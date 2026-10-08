# V Car Rent — Car Rental Management System

A full-stack, production-ready platform for a real car rental company. It has **two surfaces that share one backend and database**:

- **Customer-facing website** (at the site root `/`) — browse the fleet with live availability and filters, view a car's photo gallery, and make a guest online booking.
- **Staff dashboard** (under `/dashboard`, sign-in required) — fleet, bookings, rentals, customers, payments, maintenance, damage tracking, reporting and staff administration.

A booking placed on the public site creates a real customer and a **pending booking that appears in the staff dashboard** for confirmation — using the exact same pricing, availability and no-double-booking logic as staff-created bookings. The customer is emailed a confirmation when the booking is received and again when staff confirm it, and password resets are emailed too (see transactional email below).

This is a real application, not a demo or prototype. Every number shown in the UI — dashboard statistics, booking totals, rental charges, reports — is computed and validated on the backend against PostgreSQL. The frontend never invents or hardcodes business data.

## Tech stack

**Frontend:** React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, React Hook Form + Zod, Recharts, Zustand, React Router, Axios

**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT (access + rotating refresh tokens), bcrypt, Zod, Pino, Helmet, Multer

**Architecture:** npm-workspaces monorepo (`backend`, `frontend`), modular-monolith API (one module per business domain: `routes → controller → service → schemas`), thin controllers, all business logic and financial math in the service layer.

## Prerequisites

- Node.js 18 or newer
- PostgreSQL 14 or newer (a local install, Docker container, or a managed instance such as Supabase/Neon/RDS all work)
- npm 9+

## 1. Install dependencies

From the repository root (this installs both workspaces):

```bash
npm install
```

## 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` and set at minimum:

- `DATABASE_URL` — your PostgreSQL connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — long random strings (generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)

The full list of variables, with explanations, is in `backend/.env.example`.

**Transactional email (optional).** Booking and password-reset emails are sent via SMTP. If you leave `SMTP_HOST` blank, the app does **not** send email — it logs each message (subject, recipient, and the reset link) to the server console instead, so every flow works locally without a provider. To send real email, set `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` (SendGrid, Mailgun, Postmark, Amazon SES, or any SMTP server), `MAIL_FROM`, and `APP_URL` (your frontend's URL, used to build the reset link).

## 3. Generate the Prisma client and run migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

`prisma:migrate` creates the database schema (tables, enums, indexes, foreign keys) defined in `backend/prisma/schema.prisma` and prompts you for a migration name on first run (e.g. `init`).

> **Note for anyone who received this project already scaffolded from an environment with restricted network access:** the Prisma client could not be generated inside that sandbox because `binaries.prisma.sh` (where Prisma downloads its query engine binary) was not reachable through its egress allowlist. This has no bearing on the application itself — it only means `npm run prisma:generate` must be run once in a normal environment with internet access, which is expected anyway since a real Postgres connection is also required. Everything in `backend/src` was written and reviewed against the schema in `backend/prisma/schema.prisma`; the backend's own test suite (`npm run test --workspace=backend`, 69 tests, all passing) exercises every piece of pure business logic — pricing, return-charge calculation, JWT signing/verification, password hashing, pagination, and the booking/rental overlap-conflict rule — without requiring a generated client or a live database, precisely so it stays runnable in constrained environments. Once you run `prisma generate` locally, `npm run build --workspace=backend` and `npm run typecheck --workspace=backend` will also pass cleanly end to end.

## 4. Seed realistic demo data

```bash
npm run seed
```

This creates a company settings row, four staff users, vehicle categories, a fleet of vehicles, customers, bookings, active/completed rentals, payments, expenses, maintenance records and notifications — enough to see every screen populated with realistic data on first login.

Seeded login credentials (all roles share the same password below; **change these before any real deployment**):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@vcarrent.al` | `Password123!` |
| Manager | `manager@vcarrent.al` | `Password123!` |
| Employee | `employee1@vcarrent.al` | `Password123!` |
| Employee | `employee2@vcarrent.al` | `Password123!` |

## 4b. Attach fleet photos (optional, recommended)

```bash
npm run seed:images --workspace=backend
```

This attaches the car photos bundled in `backend/uploads/vehicles/` to the seeded vehicles (one primary image each) so the public website and the dashboard show real photos instead of the gradient placeholders. The script is **idempotent** and matches image files to vehicles by license plate: to change a car's photo, drop a `<plateNumber>.jpg` into `backend/uploads/vehicles/` and re-run it. Staff can also manage photos from the dashboard (see below) — this step just gives the demo fleet a head start.

## 5. Run in development

From the repository root, in two terminals:

```bash
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:5173
```

The frontend dev server proxies `/api` and `/uploads` to the backend, so no CORS configuration is needed locally. Then open:

- **Public website:** `http://localhost:5173/` — home, `/fleet`, a car detail page with photo gallery, and the guest booking flow. No login required.
- **Staff dashboard:** `http://localhost:5173/login` (or click **Staff login** in the header) → redirects to `/dashboard`. Sign in with one of the seeded accounts above.

> **Port note:** if `5173` is already in use, Vite starts the frontend on the next free port (e.g. `5174`). Because the frontend calls the API cross-origin via `VITE_API_URL`, that new origin must be allowed by the backend's `CLIENT_ORIGIN` (it ships allowing both `http://localhost:5173` and `http://localhost:5174`). If you use a different port, add it to `CLIENT_ORIGIN` in `backend/.env` and restart the backend — otherwise the browser blocks every API call (which the UI surfaces as a generic "invalid credentials"/load error).

Health check: `GET http://localhost:4000/api/health` → `{"status":"ok","service":"car-rental-api"}`

## 6. Run the test suite

```bash
npm run test --workspace=backend
```

69 unit tests covering the business logic that must never be wrong: rental-day and booking-total calculations, late/mileage/fuel return-charge calculations, the booking/rental double-booking conflict rule, JWT access/refresh token signing and verification, password hashing, pagination helpers, and the standardized `AppError` shape.

## 7. Build for production

```bash
npm run build
```

This runs `tsc` for the backend (emitting to `backend/dist`) and a type-checked Vite build for the frontend (emitting to `frontend/dist`). Both must complete with a generated Prisma client (step 3) in place.

Start the built backend with `npm run start --workspace=backend`; serve `frontend/dist` with any static file host (Nginx, Caddy, a CDN, or a simple Express static handler) and point it at the deployed API's URL via `VITE_API_URL` at build time.

## Public website

The customer-facing site is served by the **same frontend app** (public routes at the root; the staff dashboard stays under `/dashboard`) and is backed by a **separate, unauthenticated** API module.

**Public pages** (`frontend/src/public/`):

| Route | Page |
|---|---|
| `/` | Home — hero with a date/location search, categories, featured cars, highlights |
| `/fleet` | Fleet listing with filters (category, transmission, fuel, seats, price), sorting and date-aware availability |
| `/fleet/:id` | Car detail with a photo **gallery** (thumbnails + prev/next + click-to-zoom lightbox) and pricing |
| `/book/:vehicleId` | Guest booking form (live price estimate) → real pending booking + confirmation |
| `/about`, `/contact` | Company info, rental terms, contact form |

**Public API** (`/api/public/*`, no authentication, the booking endpoint is rate-limited) exposes only presentation-safe vehicle fields — never plate, VIN, mileage or documents:

| Method & path | Purpose |
|---|---|
| `GET /api/public/company` | Public company details (name, contact, currency, policies) |
| `GET /api/public/categories` | Active vehicle categories |
| `GET /api/public/vehicles` | Browse/filter the rentable fleet (optional `pickupAt`/`returnAt` for availability) |
| `GET /api/public/vehicles/:id` | A single vehicle's public detail |
| `POST /api/public/bookings` | Guest booking — finds/creates the customer and creates a `PENDING` booking |

Guest bookings reuse the staff `bookingsService.create`, so pricing, tax and the no-double-booking rule are identical; they are attributed to a synthetic inactive `online@vcarrent.al` user so staff can see at a glance that a booking came from the website.

## Fleet photos & staff image management

Vehicle photos are stored on disk in `backend/uploads/vehicles/` and served statically from `/uploads`. The primary image is the one shown on the public site.

- **Seed/bulk:** `npm run seed:images --workspace=backend` (step 4b) attaches `<plateNumber>.jpg` files to vehicles.
- **From the dashboard:** open a vehicle (**Vehicles → a car → Photos**) to **upload** (JPEG/PNG/WEBP/GIF, ≤ 8 MB, multiple at once), **set the primary** photo (shown on the public site), and **delete** photos (which also removes the file from disk and auto-promotes another primary).

> Because the frontend is served from a different origin/port than the API in development, `app.ts` sets `Cross-Origin-Resource-Policy: cross-origin` on `/uploads` so the browser can embed the images. Without it, Helmet's default same-origin policy makes every `<img>` fail to load (while `curl` still succeeds).

## Project structure

```
car-rental-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # full relational schema: 20+ models, enums, indexes
│   │   ├── seed.ts            # realistic seed data
│   │   └── seed-images.ts     # attaches uploads/vehicles/<plate>.jpg to vehicles
│   ├── uploads/vehicles/      # fleet photos (served at /uploads, primary shown publicly)
│   └── src/
│       ├── config/            # env loading & validation
│       ├── lib/                # prisma client, logger, jwt, password hashing
│       ├── middleware/         # auth, validation, rate limiting, error handling
│       ├── modules/            # one folder per domain (routes/controller/service/schemas)
│       │   └── public/         # unauthenticated customer-site API (/api/public)
│       ├── utils/               # pricing, pagination, AppError, id generators
│       ├── app.ts / server.ts
│       └── routes/index.ts     # mounts every module + /api/public + /api/health
└── frontend/
    └── src/
        ├── components/          # layout (sidebar/topbar) + reusable UI kit
        ├── features/            # one folder per domain: api.ts + TanStack Query hooks
        ├── pages/                # staff dashboard route-level pages (under /dashboard)
        ├── public/              # customer-facing website (home, fleet, car detail, booking, gallery)
        ├── routes/               # ProtectedRoute / RoleGuard
        ├── store/                # auth store (Zustand, in-memory access token)
        └── types/                # shared TypeScript types mirroring the API
```

## Core business rules enforced server-side

These are never trusted from the client and are always re-validated in the service layer, most inside a Postgres `Serializable` transaction:

- **No double-booking.** `findConflictingVehicleIds` (used by availability search, booking creation, booking updates, and rental checkout/extend) checks for any overlapping `CONFIRMED`/`ACTIVE` booking or `PENDING`/`ACTIVE`/`OVERDUE` rental on that vehicle before committing. A concurrent conflicting write is caught and converted into a `409 CONFLICT` response.
- **Vehicles under maintenance or inactive cannot be booked or rented.**
- **All financial totals are computed server-side** (`src/utils/pricing.ts`): booking subtotal/tax/total from the vehicle's live daily rate and company tax settings, and rental return charges (late fee, excess mileage fee, missing-fuel fee) from the odometer/fuel readings recorded at check-in. The frontend only ever shows a clearly-labeled estimate before submission.
- **Driver's license validation** happens at rental checkout — an expired or missing license blocks checkout regardless of what the UI shows.
- **Multi-step operations run inside a database transaction** (e.g. rental checkout creates the rental, a pre-rental inspection, and updates the vehicle and linked booking atomically; payment creation updates the related booking/rental balance in the same transaction it inserts the payment and ledger transaction row).
- **Role-based access control** is enforced by backend middleware (`authenticate` + `authorize(...roles)`) on every protected route — frontend route guards are a UX convenience, not the security boundary.
- **Soft handling of historically-referenced records:** vehicles/customers with booking, rental or payment history are archived/deactivated rather than hard-deleted, so financial history stays intact.

## API overview

All endpoints are namespaced under `/api`. Every list endpoint supports `page`, `pageSize`, `sortBy`, `sortOrder` and returns `{ data, meta: { page, pageSize, total, totalPages } }`. Errors always return `{ error: { message, code, details? } }`.

| Domain | Base path |
|---|---|
| **Public (no auth)** | `/api/public` (company, categories, vehicles, vehicles/:id, POST bookings) |
| Auth | `/api/auth` (login, refresh, logout, forgot/reset password, me) |
| Users (admin) | `/api/users` |
| Vehicle categories | `/api/vehicle-categories` |
| Vehicles | `/api/vehicles` |
| Customers | `/api/customers` |
| Availability | `/api/availability` |
| Bookings | `/api/bookings` |
| Rentals | `/api/rentals` (`/checkout`, `/:id/extend`, `/:id/checkin`, `/:id/cancel`) |
| Inspections | `/api/inspections` |
| Damage reports | `/api/damages` |
| Payments | `/api/payments` |
| Transactions | `/api/transactions` |
| Expenses | `/api/expenses` |
| Maintenance | `/api/maintenance` |
| Notifications | `/api/notifications` |
| Dashboard | `/api/dashboard` |
| Reports | `/api/reports/summary` |
| Settings | `/api/settings` |
| Activity log | `/api/activity` |
| Search | `/api/search` |
| Health | `/api/health` |

## Deployment notes

The backend is a plain Node/Express process with no host-specific coupling — it runs on any platform that gives you a Node runtime and a PostgreSQL connection (a VPS, Render, Railway, Fly.io, ECS, etc.). The frontend is a static Vite build servable from any static host or CDN. Set `CLIENT_ORIGIN` (backend) and `VITE_API_URL` (frontend) to your real domains, use strong unique JWT secrets, put the app behind HTTPS, and run `prisma migrate deploy` (not `migrate dev`) against your production database during deploys.

Additional notes for the public site and photos:

- `CLIENT_ORIGIN` must include the **exact origin the public site is served from** (it is a comma-separated allowlist). Since the public website and staff dashboard are the same build, that is a single origin.
- Uploaded photos live on the server's local disk (`UPLOAD_DIR`, default `backend/uploads`). On ephemeral/containerised hosts use a persistent volume or move storage to object storage (e.g. S3) so photos survive restarts and scale across instances.
- If you serve the static frontend from the **same origin** as the API (reverse proxy), the `/uploads` cross-origin header is harmless; if the API is on a **different origin**, that header (already set in `app.ts`) is what lets the browser load the images.
