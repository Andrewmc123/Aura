# Aura

**Share your aura with the world.** Aura is a short-video social app: record, post, go live, and connect with the people who match your energy.

**Live app:** https://aura-x2a4.onrender.com

## Features

- **Discover** — story row and a card feed of videos, photos and GIFs, with a full-screen player
- **Create** — in-app camera, upload studio with filters, sounds and text
- **Stories** — posts that disappear after 24 hours
- **Live** — live streams with chat and gifts
- **Social** — follows, friends, comments, direct messages and group chats
- **Aura score** — creators earn Aura and unlock tiers as people engage
- **Explore** — trending hashtags, sounds, creators and search
- **Shop** — creator product listings
- **Safety** — report and block tools, content filter, moderation queue, account deletion

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 18, Redux, React Router, Vite |
| Backend | Python, Flask, SQLAlchemy, Alembic |
| Database | PostgreSQL in production, SQLite for local development |
| Media storage | S3-compatible bucket (Cloudflare R2) |
| Hosting | Render (Docker) |
| iOS | Capacitor |

## Run it locally

You need Python 3.9+ and Node 22+.

**1. Backend**

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
flask db upgrade
flask seed all                   # optional demo content
flask run
```

**2. Frontend** (in a second terminal)

```bash
cd react-vite
npm install
npm run dev
```

The app opens at http://localhost:5173 and talks to the Flask server on port 5000.

## Configuration

All settings are environment variables. `.env.example` lists every one with a short explanation. The important ones for production:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | Signs login sessions |
| `S3_BUCKET`, `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | Where uploaded media is stored |
| `ADMIN_EMAILS` | Accounts allowed to review reports at `/admin/reports` |
| `SUPPORT_EMAIL` | Contact address shown on the Privacy, Terms and Support pages |

## Deploying

The app deploys to Render from `render.yaml`. Every push to `main` triggers a new deploy.

The production frontend is served by Flask from `react-vite/dist`, which is committed to the repo. After changing frontend code, rebuild it before pushing:

```bash
cd react-vite
npm run build
```

`GET /api/health` reports whether the server and database are healthy.

## Project structure

```
app/            Flask API, models, seed data
migrations/     Database migrations
react-vite/     React frontend and Capacitor (iOS) config
brand/          Logo and video brand assets
render.yaml     Render deployment settings
```

## Launch status

Steps remaining before the App Store release are tracked in [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md).

The original full-screen design is kept under the git tag `original-v1`.

---

© 2026 Aura. All rights reserved.
