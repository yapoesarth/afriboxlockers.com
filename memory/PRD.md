# AFRIBOX — Product Requirements Document

## Original problem statement
Create an immersive cinematic hero experience based on a futuristic smart locker wall
for AFRIBOX (smart parcel infrastructure). Scroll-driven camera fly-through that
reveals 6 sections (How It Works, Mobile App, Security, Smart City Integration,
Features, Contact) by zooming into specific lockers and swinging doors open to reveal
content. Premium industrial aesthetic — Apple/Tesla inspired, NOT gaming, NOT
exaggerated sci-fi. CSS 3D transforms (no Three.js).

## User personas
- Municipal logistics operators evaluating AFRIBOX for their city
- Retailers and businesses looking to reserve compartment access
- Couriers and last-mile partners
- Press / investors browsing for the AFRIBOX vision

## Tech stack
- Frontend: React 19, framer-motion, Tailwind CSS, Shadcn/UI components
- Backend: FastAPI, Motor (async MongoDB), Pydantic v2
- Database: MongoDB (collections: newsletter, bookings, contacts)

## Architecture
- /app/frontend — Cinematic SPA with sticky-scroll Scene + post-cinematic CTA sections
- /app/backend — FastAPI server.py exposing /api routes
- Locker stations seeded in-memory (10 nodes across 6 African cities)

## Implemented (2026-02-08)
- ✅ Cinematic Scene component with 3D scroll-driven camera transforms
- ✅ 5×4 locker wall with 20 lockers (CSS 3D, no WebGL)
- ✅ Each section maps to a unique locker; door swings open at scroll threshold
- ✅ Side-positioned glass overlay cards with section copy and bullets
- ✅ Floating HUD: brand mark, system status, capacity, scroll progress, telemetry
- ✅ Locker availability map with stylized Africa continent SVG + 10 station pins
- ✅ Booking form (name, email, phone, city, locker size, pickup window, notes)
- ✅ Newsletter signup with toast feedback
- ✅ Footer with brand info
- ✅ Backend endpoints: /api/lockers, /api/booking (POST/GET), /api/newsletter, /api/contact
- ✅ Premium typography (Outfit display, Manrope body, JetBrains Mono technical)
- ✅ Color palette: deep graphite + emerald (#10B981) + mint (#2DD4BF) + cyan-green (#7CFFB2)
- ✅ Ambient animations: breathing LEDs, scan lines, screen flicker, glints

## Backlog
- P1: Mobile fallback layout (vertical accordion under 768px) — currently scales but choreography is heavy
- P1: Better accessibility (reduced-motion mode disables camera transforms)
- P2: Localisation (FR / EN toggle for African market)
- P2: Real interactive map (mapbox/leaflet) once API key provided
- P2: Authenticated operator dashboard for booking management
- P3: Live capacity websocket feed (instead of seeded data)

## Next tasks
- Run testing agent for backend integration + frontend smoke tests
- Add reduced-motion fallback if user requests it
- Optionally implement French translation
