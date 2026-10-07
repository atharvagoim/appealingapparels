# Appealing Apparels

Full-stack e-commerce storefront + admin panel. React (Vite) frontend and a
Node/Express/MongoDB API, deployed together as **one Vercel project**.

## Project structure

```
src/            React storefront + admin panel (Vite)
public/         static assets
index.html      Vite entry
api/
  index.js      serverless adapter — wraps the Express app below for Vercel
  sitemap.js    /sitemap.xml generator
server/         the Express API (unchanged internally — same app.js, routes,
                controllers, models as before)
  server.js     traditional entry point, for local dev (`npm run server`)
  app.js        the actual Express app (used by both server.js and api/index.js)
  config/ controllers/ middleware/ models/ routes/ seed/ utils/
vercel.json     routes /api/* to the API, everything else to the SPA
.env.example    every environment variable the app uses, in one file
```

One `package.json`, one `node_modules`, one `.env` locally, one set of
environment variables in Vercel. No second service to deploy or keep in sync.

## Local development

```bash
npm install
cp .env.example .env     # fill in MONGODB_URI, JWT_SECRET, etc.
npm run seed              # load the starting product catalogue (idempotent)
npm run seed:admin        # create the admin login
```

Run the API and the frontend in two terminals:

```bash
npm run server:dev        # Express API on http://localhost:5000
npm run dev                # Vite dev server on http://localhost:5173
```

Set `VITE_API_URL=http://localhost:5000/api` in `.env` while developing this
way (Vite's dev server and the Express API run on different ports locally).
Leave it unset for production — the deployed app calls its own `/api` on the
same domain.

## Deploying (Vercel, one project)

1. Push this repo to GitHub and import it in Vercel — no root directory
   override needed, this folder *is* the project root.
2. In Project Settings → Environment Variables, add everything from
   `.env.example` except `VITE_API_URL` (leave that unset in production).
3. Deploy. Vercel builds the Vite frontend as static assets and
   `api/index.js` as a serverless function; `vercel.json` routes `/api/*`
   requests to it and everything else to the single-page app.

## API reference (unchanged from the previous backend)

| Method | Route | Access | Purpose |
| ------ | ----- | ------ | ------- |
| GET | `/api/health` | public | Liveness check |
| GET | `/api/products` | public | List; `?search=&category=&featured=&newArrival=` |
| GET | `/api/products/:slug` | public | Single product by slug |
| POST/PUT/DELETE | `/api/products` | admin | Create/update/delete |
| POST | `/api/auth/register` | public | Create customer account → `{token,user}` |
| POST | `/api/auth/login` | public | Log in → `{token,user}` |
| GET | `/api/auth/me` | auth | Current user from the Bearer token |
| POST | `/api/upload/images` | admin | Upload product photos (multipart) → `{urls}` |

Full route list lives in `server/routes/index.js`. Admins are provisioned
only through `npm run seed:admin` — the public `/register` endpoint always
creates `role: "user"`.
