# Rafael Coffee — Subscription Platform

A custom coffee subscription service built for Rafael Coffee, Lancefield Victoria.

Built by [Flipside Digital](https://flipsidedigital.com.au), Woodend Victoria.

---

## Stack

| Layer | Technology |
|---|---|
| Backend API | Node.js + Express |
| Database | PostgreSQL |
| Frontend | React.js |
| Payments | Square Subscriptions + Web Payments SDK |
| Hosting (API + DB) | Railway |
| Hosting (Frontend) | Vercel |
| CDN + SSL | Cloudflare |

---

## Project Structure

```
rafael-coffee-subscriptions/
├── backend/
│   ├── src/
│   │   ├── index.js          # Express app entry point
│   │   ├── config/
│   │   │   └── square.js     # Square client configuration
│   │   ├── db/
│   │   │   ├── index.js      # PostgreSQL connection pool
│   │   │   └── schema.sql    # Database schema
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js       # Register / Login
│   │   │   ├── products.js   # Coffee product listings
│   │   │   ├── subscriptions.js # Subscription management
│   │   │   ├── orders.js     # Order history
│   │   │   └── admin.js      # Admin dashboard
│   │   └── webhooks/
│   │       └── square.js     # Square webhook handler
│   ├── .env.example
│   └── package.json
├── frontend/                 # React app (Phase 3)
├── railway.toml              # Railway deployment config
└── .gitignore
```

---

## Getting Started (Local Development)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your .env values
npm install
npm run dev
```

API will run at: `http://localhost:3001`
Health check: `http://localhost:3001/health`

### Database

Run the schema against your local PostgreSQL instance:

```bash
psql -U postgres -d rafael_coffee -f backend/src/db/schema.sql
```

---

## Environment Variables

See `backend/.env.example` for all required variables.

Key variables needed in Railway:
- `DATABASE_URL` — auto-set by Railway PostgreSQL addon
- `SQUARE_ACCESS_TOKEN` — from Square Developer dashboard
- `SQUARE_ENVIRONMENT` — `sandbox` or `production`
- `SQUARE_WEBHOOK_SIGNATURE_KEY` — from Square webhook configuration
- `JWT_SECRET` — random string, min 32 characters
- `FRONTEND_URL` — your Vercel deployment URL

---

## Phases

- [x] Phase 1 — Discovery & Architecture
- [ ] Phase 2 — Backend Development ← *current*
- [ ] Phase 3 — Frontend (React)
- [ ] Phase 4 — Customer Self-Service Portal
- [ ] Phase 5 — Admin & Fulfilment Dashboard
- [ ] Phase 6 — Testing & QA
- [ ] Phase 7 — Deployment & Handover
- [ ] v2 — Gift Subscriptions (post-launch)
