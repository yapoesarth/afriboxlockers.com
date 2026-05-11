"""AFRIBOX backend API tests.

Covers:
- Service info root
- Locker stations seed
- Newsletter (create, duplicate, invalid)
- Booking (create, missing field, list)
- Contact (create)
- Verifies _id is excluded from all responses.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to reading from frontend/.env (testing context)
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- Root / service info ----------------
class TestRoot:
    def test_root_service_info(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("service") == "AFRIBOX"
        assert data.get("status") == "online"


# ---------------- Lockers ----------------
class TestLockers:
    def test_list_lockers_returns_10_seed_stations(self, session):
        r = session.get(f"{API}/lockers")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 10
        required = {
            "id", "name", "city", "district", "latitude", "longitude",
            "total_units", "available_units", "status", "accent",
        }
        for s in data:
            assert required.issubset(s.keys()), f"missing keys: {required - s.keys()}"
            assert "_id" not in s
            assert isinstance(s["latitude"], (int, float))
            assert isinstance(s["longitude"], (int, float))
            assert isinstance(s["total_units"], int)
            assert isinstance(s["available_units"], int)


# ---------------- Newsletter ----------------
class TestNewsletter:
    def test_subscribe_valid_email(self, session):
        email = f"TEST_news_{uuid.uuid4().hex[:8]}@afribox.io"
        r = session.post(f"{API}/newsletter", json={"email": email})
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["email"] == email
        assert "id" in data and isinstance(data["id"], str)
        assert "created_at" in data
        assert "_id" not in data

    def test_subscribe_duplicate_returns_409(self, session):
        email = f"TEST_dup_{uuid.uuid4().hex[:8]}@afribox.io"
        r1 = session.post(f"{API}/newsletter", json={"email": email})
        assert r1.status_code == 201
        r2 = session.post(f"{API}/newsletter", json={"email": email})
        assert r2.status_code == 409, r2.text

    def test_subscribe_invalid_email_returns_422(self, session):
        r = session.post(f"{API}/newsletter", json={"email": "not-an-email"})
        assert r.status_code == 422


# ---------------- Booking ----------------
class TestBooking:
    def test_create_booking_full_payload(self, session):
        payload = {
            "full_name": "TEST User Cinematic",
            "email": f"TEST_book_{uuid.uuid4().hex[:8]}@afribox.io",
            "phone": "+221770000000",
            "city": "Dakar",
            "locker_size": "medium",
            "pickup_window": "Morning (08:00 — 12:00)",
            "notes": "Pytest run",
        }
        r = session.post(f"{API}/booking", json=payload)
        assert r.status_code == 201, r.text
        data = r.json()
        assert "id" in data and isinstance(data["id"], str)
        assert data["full_name"] == payload["full_name"]
        assert data["email"] == payload["email"]
        assert data["city"] == payload["city"]
        assert data["status"] == "received"
        assert "_id" not in data

    def test_create_booking_missing_required_returns_422(self, session):
        # missing 'pickup_window'
        payload = {
            "full_name": "TEST Missing",
            "email": "test@afribox.io",
            "city": "Lagos",
            "locker_size": "medium",
        }
        r = session.post(f"{API}/booking", json=payload)
        assert r.status_code == 422

    def test_list_bookings_returns_recent(self, session):
        # Ensure at least one exists
        payload = {
            "full_name": "TEST List Booking",
            "email": f"TEST_list_{uuid.uuid4().hex[:8]}@afribox.io",
            "city": "Nairobi",
            "locker_size": "small",
            "pickup_window": "Evening (17:00 — 21:00)",
        }
        cr = session.post(f"{API}/booking", json=payload)
        assert cr.status_code == 201

        r = session.get(f"{API}/booking")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        for item in data:
            assert "_id" not in item
            assert "id" in item
            assert "email" in item


# ---------------- Contact ----------------
class TestContact:
    def test_create_contact_valid(self, session):
        payload = {
            "name": "TEST Contact",
            "email": f"TEST_contact_{uuid.uuid4().hex[:8]}@afribox.io",
            "company": "Acme",
            "message": "Please bring AFRIBOX to my city.",
        }
        r = session.post(f"{API}/contact", json=payload)
        assert r.status_code == 201, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["email"] == payload["email"]
        assert "id" in data
        assert "_id" not in data
