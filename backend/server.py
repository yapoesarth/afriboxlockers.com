from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="AFRIBOX API", version="1.0.0")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class NewsletterCreate(BaseModel):
    email: EmailStr


class Newsletter(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BookingCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: Optional[str] = None
    city: str
    locker_size: str  # small, medium, large
    pickup_window: str  # ISO date string or label
    notes: Optional[str] = None


class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    city: str
    locker_size: str
    pickup_window: str
    notes: Optional[str] = None
    status: str = "received"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LockerStation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    city: str
    district: str
    latitude: float
    longitude: float
    total_units: int
    available_units: int
    status: str  # online, maintenance
    accent: str  # for UI lighting variation


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    company: Optional[str] = None
    message: str = Field(min_length=4, max_length=2000)


class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    company: Optional[str] = None
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------- Seed data for locker stations ----------
SEED_STATIONS = [
    {"id": "stn-dkr-01", "name": "Plateau Hub", "city": "Dakar", "district": "Plateau",
     "latitude": 14.6707, "longitude": -17.4376, "total_units": 96, "available_units": 41,
     "status": "online", "accent": "emerald"},
    {"id": "stn-dkr-02", "name": "Almadies Node", "city": "Dakar", "district": "Almadies",
     "latitude": 14.7393, "longitude": -17.5093, "total_units": 64, "available_units": 18,
     "status": "online", "accent": "mint"},
    {"id": "stn-abj-01", "name": "Cocody Tower", "city": "Abidjan", "district": "Cocody",
     "latitude": 5.3599, "longitude": -3.9870, "total_units": 120, "available_units": 73,
     "status": "online", "accent": "emerald"},
    {"id": "stn-abj-02", "name": "Plateau Riviera", "city": "Abidjan", "district": "Plateau",
     "latitude": 5.3194, "longitude": -4.0167, "total_units": 80, "available_units": 9,
     "status": "online", "accent": "cyan"},
    {"id": "stn-lgs-01", "name": "Victoria Island Grid", "city": "Lagos", "district": "Victoria Island",
     "latitude": 6.4281, "longitude": 3.4219, "total_units": 144, "available_units": 88,
     "status": "online", "accent": "emerald"},
    {"id": "stn-lgs-02", "name": "Lekki Phase 1", "city": "Lagos", "district": "Lekki",
     "latitude": 6.4474, "longitude": 3.4553, "total_units": 96, "available_units": 27,
     "status": "online", "accent": "mint"},
    {"id": "stn-acc-01", "name": "Osu Central", "city": "Accra", "district": "Osu",
     "latitude": 5.5557, "longitude": -0.1837, "total_units": 72, "available_units": 31,
     "status": "online", "accent": "emerald"},
    {"id": "stn-nbo-01", "name": "Westlands Loop", "city": "Nairobi", "district": "Westlands",
     "latitude": -1.2676, "longitude": 36.8108, "total_units": 88, "available_units": 0,
     "status": "maintenance", "accent": "amber"},
    {"id": "stn-nbo-02", "name": "Karen Cluster", "city": "Nairobi", "district": "Karen",
     "latitude": -1.3194, "longitude": 36.7079, "total_units": 60, "available_units": 24,
     "status": "online", "accent": "cyan"},
    {"id": "stn-cmn-01", "name": "Centre-Ville", "city": "Casablanca", "district": "Anfa",
     "latitude": 33.5731, "longitude": -7.5898, "total_units": 100, "available_units": 56,
     "status": "online", "accent": "emerald"},
]


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"service": "AFRIBOX", "status": "online", "version": "1.0.0"}


@api_router.get("/lockers", response_model=List[LockerStation])
async def list_lockers():
    return [LockerStation(**s) for s in SEED_STATIONS]


@api_router.post("/newsletter", response_model=Newsletter, status_code=201)
async def subscribe_newsletter(payload: NewsletterCreate):
    obj = Newsletter(email=payload.email)
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    existing = await db.newsletter.find_one({"email": payload.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Email already subscribed")
    await db.newsletter.insert_one(doc)
    return obj


@api_router.post("/booking", response_model=Booking, status_code=201)
async def create_booking(payload: BookingCreate):
    obj = Booking(**payload.model_dump())
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.bookings.insert_one(doc)
    return obj


@api_router.get("/booking", response_model=List[Booking])
async def list_bookings():
    cursor = db.bookings.find({}, {"_id": 0}).sort("created_at", -1).limit(50)
    items = await cursor.to_list(50)
    for it in items:
        if isinstance(it.get("created_at"), str):
            it["created_at"] = datetime.fromisoformat(it["created_at"])
    return [Booking(**i) for i in items]


@api_router.post("/contact", response_model=ContactMessage, status_code=201)
async def create_contact(payload: ContactCreate):
    obj = ContactMessage(**payload.model_dump())
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.contacts.insert_one(doc)
    return obj


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
