# CineBook - Production-Ready Cinema Ticket Booking Platform

[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-Serverless_Postgres-00e599?logo=postgresql)](https://neon.tech/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.35-c5f74f)](https://orm.drizzle.team/)
[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)](https://vercel.com/)

**CineBook** is a production-ready, full-stack cinema ticketing web platform engineered for deployment on Vercel with Neon Serverless PostgreSQL. It features an interactive curved projection screen seat map, real-time 10-minute hold timers, race-condition safe database transactions, payment idempotency, digital boarding passes with QR codes, and a comprehensive cinema administration suite.

---

## Team Division & Architecture

- **Agent 1 (App Agent):** Next.js App Router UI, Tailwind CSS luxury dark aesthetic, interactive seat maps, checkout engine, QR boarding passes, booking history with refunds, and Admin Portal.
- **Agent 2 (Database Engine Agent):** Neon PostgreSQL Drizzle schema, UUID primary keys, integer minor-unit pricing, atomic row-level locks, hold expiration lifecycle, and seed data.
- **Agent 3 (QA Agent):** Concurrency race condition testing, duplicate payment protection, authorization boundaries, hold expiration cleanup, and build verification.

---

## Key Features

1. **Movie Catalog & Multi-Facet Filtering:** Search and filter by keyword, genre, language (English, Spanish, French, Japanese, Hindi), cinema venue, and date.
2. **Interactive Cinematic Seat Map:** Curved screen visualizer, seat tiers (Standard, VIP Recliner, Accessible, Couple), real-time hold countdown timer, and live price breakdown.
3. **Atomic Booking Transaction Engine:** Row-level locks (`FOR UPDATE`) prevent double-booking. Seats are placed in temporary 10-minute holds during checkout.
4. **Idempotent Payment Sandbox:** One-click test card fillers (Visa, Mastercard, Amex), CVV verification, and duplicate replay protection via idempotency keys.
5. **Digital Boarding Pass Tickets:** Generated cryptographic QR codes, printable tickets, barcode view, and confetti celebrations.
6. **Booking Management & Self-Serve Refunds:** View past/active bookings with instant cancellation and seat release (up to 2 hours before showtime).
7. **Complete Admin Suite (`/admin`):**
   - Live revenue, ticket volume, and occupancy metrics.
   - Movie management (add/edit movies, poster URLs, trailer links).
   - Showtime scheduler with auditorium overlap clash prevention.
   - Live auditorium seat inspector with manual maintenance block/unblock.
   - Security audit logs.
8. **Automated Hold Release Cron (`/api/cron/release-holds`):** Protected by `CRON_SECRET` for scheduled cleanup via Vercel Cron.

---

## Database Entities & Enums

- **Enums:** `user_role` (USER, ADMIN), `screen_type` (STANDARD, IMAX, 4DX, VIP, DOLBY), `seat_type` (STANDARD, VIP, RECLINER, COUPLE, ACCESSIBLE), `movie_rating` (G, PG, PG_13, R, NC_17), `showtime_format` (2D, 3D, IMAX, 4DX), `seat_status` (AVAILABLE, HELD, BOOKED, BLOCKED), `booking_status` (PENDING, CONFIRMED, CANCELLED, EXPIRED, REFUNDED), `payment_status` (PENDING, SUCCEEDED, FAILED, REFUNDED).
- **Tables:** `users`, `genres`, `movies`, `movie_genres`, `cinemas`, `auditoriums`, `seats`, `showtimes`, `showtime_seats`, `bookings`, `booking_items`, `payments`, `tickets`, `audit_logs`.

---

## Environment Variables

Create `.env.local` based on `.env.example`:

```env
# Neon PostgreSQL pooled connection string
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Direct unpooled URL for migrations if needed
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# JWT Secret for cookie sessions
JWT_SECRET="cinebook_super_secure_production_jwt_secret_key_2026_x99a"

# Cron Secret protecting /api/cron/release-holds
CRON_SECRET="cinebook_cron_hold_release_secret_token_991823"

# Payment Gateway Configuration
PAYMENT_PROVIDER="test_gateway"
PAYMENT_WEBHOOK_SECRET="whsec_test_cinebook_secret_key_7781"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Local Development & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Migration & Seeding
Ensure `DATABASE_URL` in `.env.local` points to your Neon PostgreSQL database instance:

```bash
# Push schema migrations
npm run db:push

# Populate sample blockbuster movies, cinemas, auditoriums, seats, and showtimes
npm run db:seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Demo Accounts

| Role | Email | Password | Features |
|---|---|---|---|
| **Chief Admin** | `admin@cinebook.com` | `admin123` | Full access to `/admin` dashboard, movie publisher, scheduler, seat inspector, audit logs |
| **Cinephile User** | `alex@cinebook.com` | `alex123` | Pre-seeded confirmed ticket booking (`CB-DEMO01`), seat reservations |
| **Regular User** | `sarah@cinebook.com` | `sarah123` | Standard customer bookings |

*Tip: Use the 1-click test buttons on the `/login` screen to instantly sign in without typing.*

---

## QA & Concurrency Verification

Run the automated verification suite:

```bash
# Run unit, JWT, pricing minor unit, and security tests
npm run test:qa

# Run atomic concurrency race-condition simulation
npm run test:concurrency

# Test production build
npm run build
```

---

## Vercel Deployment Instructions

### Step 1: Push Code to GitHub / Git Provider
```bash
git remote add origin https://github.com/captsyed30-art/Ciniapp.git
git push -u origin main
```

### Step 2: Import Project to Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
2. Under **Framework Preset**, select **Next.js**.

### Step 3: Provision Neon Serverless PostgreSQL
1. Navigate to the **Storage** tab in your Vercel project dashboard.
2. Select **Connect Database** > **Neon Serverless Postgres** (from Vercel Marketplace).
3. Vercel will automatically configure the `DATABASE_URL` environment variables.

### Step 4: Configure Environment Variables in Vercel
Add the following in **Project Settings > Environment Variables**:
- `JWT_SECRET`: A secure 32+ character random string.
- `CRON_SECRET`: Secret token for Vercel Cron protection.
- `PAYMENT_PROVIDER`: `test_gateway`
- `PAYMENT_WEBHOOK_SECRET`: `whsec_live_...`

### Step 5: Run Migrations and Seed in Deployment
Trigger a database seed by running `npm run db:seed` against your production database or executing the SQL script in your Neon console.

### Step 6: Verify Vercel Cron
Vercel will detect `vercel.json` and automatically schedule `/api/cron/release-holds` every minute to clean up expired holds.
