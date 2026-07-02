# Appealing Apparels — Backend (Phase 4)

Node.js + Express + MongoDB (Mongoose) API. Phase 4 establishes the backend
foundation: database connection, all five collection models, and a fully
working **Products** API that the existing admin dashboard and storefront can
talk to. Auth (Phase 5) and payments (Phase 6) build on top of these models.

## Setup

```bash
cd backend
npm install
cp .env.example .env        # then paste your MongoDB Atlas URI
npm run seed                # load the starting catalogue (idempotent)
npm run dev                 # start with auto-reload on http://localhost:5000
```

`MONGODB_URI` is required — the server exits with a clear message if it's
missing. Get it from Atlas → Cluster → **Connect** → **Drivers**.

## Project structure

```
src/
  server.js              entry — connect DB, start listening
  app.js                 express app (middleware, routes, error handling)
  config/  env.js, db.js
  models/  Product, User, Order, Cart, Wishlist
  controllers/ productController.js
  routes/  index.js, productRoutes.js
  middleware/ asyncHandler, notFound, errorHandler
  utils/   ApiError, slugify
  seed/    seed.js, products.seed.js
```

## API

| Method | Route                  | Purpose                                   |
| ------ | ---------------------- | ----------------------------------------- |
| GET    | `/api/health`          | Liveness check                            |
| GET    | `/api/products`        | List; `?search=&category=&featured=&newArrival=` |
| GET    | `/api/products/:slug`  | Single product by slug                    |
| POST   | `/api/products`        | Create                                    |
| PUT    | `/api/products/:id`    | Update                                    |
| DELETE | `/api/products/:id`    | Delete                                    |

Products serialize with `id` (not `_id`) to match the frontend shape exactly.

## Collections

- **products** — live and fully wired.
- **users** — schema ready (name, email, `passwordHash`, role); login arrives in Phase 5.
- **orders** — schema ready incl. a `payment` sub-doc for Razorpay (Phase 6).
- **cart**, **wishlist** — one-per-user schemas, ready to sync the client stores after auth.

## Connecting the frontend

In `frontend/`, set `VITE_API_URL=http://localhost:5000/api` (see
`frontend/.env.example`). With it set, the storefront and admin read/write
through this API; without it, the frontend keeps using its localStorage store,
so the UI runs fine with or without the backend.

## Notes

- Write routes are currently open; they'll sit behind admin JWT auth in Phase 5.
- Validation, duplicate-key, and cast errors are normalised to clean JSON by the error handler.

## Authentication (Phase 5)

JWT-based. Endpoints:

| Method | Route                | Access | Purpose                              |
| ------ | -------------------- | ------ | ------------------------------------ |
| POST   | `/api/auth/register` | public | Create customer account → `{token,user}` |
| POST   | `/api/auth/login`    | public | Log in (customer or admin) → `{token,user}` |
| GET    | `/api/auth/me`       | auth   | Current user from the Bearer token   |

Pass the token as `Authorization: Bearer <token>`. Product **write** routes
(`POST/PUT/DELETE /api/products`) now require an admin token via the
`protect` + `requireAdmin` middleware. Reads stay public.

Admins are provisioned only through `npm run seed:admin` (reads `ADMIN_NAME`,
`ADMIN_EMAIL`, `ADMIN_PASSWORD` from `.env`) — the public `/register` endpoint
always creates `role: "user"`. Passwords are hashed with bcrypt; `JWT_SECRET`
signs the tokens and is required to boot.
