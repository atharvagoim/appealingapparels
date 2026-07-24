# Appealing Apparels (monorepo)

/ frontend  — React + Vite storefront & admin (Phases 1–3, 5)
/ backend   — Express + MongoDB API with JWT auth (Phases 4–5)

## Frontend only (localStorage; no accounts)
cd frontend && npm install && npm run dev

## Full stack (database + auth)
cd backend  && npm install && cp .env.example .env   # set MONGODB_URI + JWT_SECRET
            && npm run seed && npm run seed:admin && npm run dev
cd frontend && echo "VITE_API_URL=http://localhost:5000/api" > .env
            && npm install && npm run dev
# log in at /login with your ADMIN_EMAIL / ADMIN_PASSWORD → /admin unlocks
