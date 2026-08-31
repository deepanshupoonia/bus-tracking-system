# College Bus Tracking System

A full-stack, real-time college transportation platform built with React, Express, PostgreSQL, Redis, and Socket.IO.

## Phase 1 status

This repository contains a working foundation plus the first role-based workflow: separate frontend/backend apps, PostgreSQL migrations, student and driver login, a seeded bus/route, driver GPS updates, and student tracking cards.

## Architecture

```text
React + Vite client
  ├─ REST API (Axios) ─────────────┐
  └─ Socket.IO client (later) ─────┤
                                 Express + Socket.IO server
                                      ├─ PostgreSQL: durable domain data
                                      └─ Redis: latest locations, cache, pub/sub
```

- **PostgreSQL** is the source of truth for users, buses, routes, stop ordering, assignments, and location history.
- **Redis** holds high-frequency, short-lived state such as `bus:{id}:location`, and will distribute location events when the backend is scaled horizontally.
- **Socket.IO rooms** will isolate updates: students following bus 12 join `bus:12`, so they only receive that bus's events.
- Controllers will remain thin; route progress and ETA are service-layer responsibilities.

## Planned database schema

| Table | Responsibility |
| --- | --- |
| `users` | Auth identity and role (`STUDENT`, `DRIVER`, `ADMIN`) |
| `drivers` | Driver-specific profile and licence details |
| `buses` | Vehicle identity, capacity, and operational status |
| `routes` | Named route definitions |
| `stops` | Reusable geographic stops |
| `route_stops` | Ordered route-to-stop relationship |
| `bus_routes` | Bus/driver route assignment history |
| `active_routes` | Current driver/bus route session |
| `location_history` | Durable, asynchronously written GPS history |

Important indexes in Phase 2 will include unique `users.email`, `location_history(bus_id, recorded_at DESC)`, and `route_stops(route_id, stop_order)`.

## API and socket design

Initial REST groups will be `/api/auth`, `/api/buses`, `/api/routes`, `/api/stops`, `/api/driver`, and `/api/admin`. JWT authentication and role checks protect each appropriate route.

The real-time protocol will use:

- `bus:join` / `bus:leave` — student room subscriptions
- `location:update` — authenticated driver location upload
- `bus:location` — server broadcast to `bus:{id}`
- `bus:status` — route lifecycle/stale-state change

## Local setup

Prerequisites: Node.js 20+, PostgreSQL 16+ and Redis 7+.

1. Copy the templates:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   Copy-Item frontend\.env.example frontend\.env
   ```

2. Follow [the local PostgreSQL/pgAdmin guide](docs/local-postgres-pgadmin.md), then update `backend/.env`.

3. Install packages and start both apps:

   ```powershell
   npm install
   npm run install:all
   npm run migrate --prefix backend
   npm run seed --prefix backend
   npm run dev
   ```

4. Open `http://localhost:5173`; confirm API health at `http://localhost:4000/api/health`.

Before pushing or redeploying, run this local release check from the repository root:

```powershell
npm run verify
```

It runs the backend tests and creates a production frontend build. For an end-to-end check, keep `npm run dev` running, log in as a driver and student in separate browser profiles, start/end a route, and send a service alert.

Demo users seeded by the command above:

- Student: `student@college.test` / `College@123`
- Driver: `driver@college.test` / `College@123`

The driver account owns `BUS-12`. Start its route, grant browser GPS permission, and the student dashboard receives updates through Socket.IO.

If Redis is unavailable in Phase 1, the API stays up and health reports Redis as unavailable. It will become required before real-time location tracking is enabled.

## Deployment (Vercel + Render + Neon)

This repository is ready for a Vercel frontend and a Render backend. Secrets stay out of Git; use the environment-variable templates as the source of key names only.

1. In **Render**, deploy the repository using `render.yaml` (or set the service root directory to `backend`). Set `DATABASE_URL` to the **pooled** Neon connection string and keep `JWT_SECRET` set. Set `CORS_ORIGIN` to your stable Vercel production URL. `CORS_ORIGIN_PATTERN` is preconfigured for this project's Vercel preview URLs, so it should not need changing. Redis is optional for the current phase.
2. The Render blueprint runs migrations before starting the API. It records applied migration files, so rerunning it is safe (including on Render's free plan).
3. In **Vercel**, set the project root directory to `frontend`, then add these production environment variables and redeploy:

   ```text
   VITE_API_URL=https://bus-tracking-system-oqnw.onrender.com/api
   VITE_SOCKET_URL=https://bus-tracking-system-oqnw.onrender.com
   ```

   Vite embeds `VITE_*` values at build time, so a redeploy is required after changing them.
4. Confirm the backend health endpoint at `https://bus-tracking-system-oqnw.onrender.com/api/health`, then log in with the seeded account. If this is a fresh Neon database, the migration runs during the first Render deployment; run `npm run seed --prefix backend` once only if you want the demo accounts/data.

## Development phases

1. **Foundation** — repository, configs, API/client shell (complete).
2. **Database** — migrations, indexes, seed data.
3. **Authentication** — bcrypt, JWT, RBAC.
4. **Admin management** — buses, routes, stops, drivers.
5. **Driver workflow** — assignment and start/end route lifecycle.
6. **Real time** — Socket.IO rooms, Redis latest location and pub/sub.
7. **Route intelligence** — Haversine, progress, ETA, unit tests.
8. **Student experience** — live map and subscriptions.
9. **Hardening** — validation, rate limits, logging, testing, deployment readiness.
