MedConnect 2.0 — Web App (React + Vercel + Neon)
================================================

Stack:
- Frontend: React (Vite)
- Backend:  Vercel Serverless Functions (the /api folder)
- Database: Neon (Postgres)

All deployable from your phone via GitHub + Vercel + Neon.


HOW IT FITS
-----------
- Push this repo to GitHub.
- Vercel connects to the repo and auto-builds on every push.
- Calls to /api/* are handled by the files in the /api folder.
- Neon stores users + connections.


SETUP (from a phone)
--------------------
1. NEON  (you've likely done this already)
   - Neon SQL Editor -> paste api/_shared/schema.sql -> Run.
   - Copy your Neon connection string (postgresql://...?sslmode=require).
     Prefer the POOLED string (has "-pooler" in the host).

2. GITHUB
   - Put this whole folder in a GitHub repo.

3. VERCEL
   - vercel.com -> "Add New… -> Project" -> import your GitHub repo.
   - Framework preset: Vite (Vercel usually auto-detects it).
   - Before deploying, open "Environment Variables" and add:
        DATABASE_URL = your Neon connection string
        JWT_SECRET   = a long random string you invent
   - Click Deploy. Vercel gives you a live URL.

4. SEED DEMO DOCTORS
   - Visit:  https://YOUR-APP.vercel.app/api/seed?key=YOUR_JWT_SECRET
   - Login as e.g. sana@demo.com / password123


IMPORTANT VERCEL NOTES
----------------------
- Environment variables: if you add/change them AFTER deploying, you must
  REDEPLOY (Vercel -> Deployments -> ... -> Redeploy) for them to apply.
- The /api folder = your backend. Each file is one endpoint:
  register, login, me, profile, matches, connections, seed.
- No netlify.toml here; vercel.json handles the SPA routing.


WHAT WORKS
----------
Register/login, profile setup (incl. question bank), matching, connections
(send/pending/accept/decline), OSCE freemium gate, dark/light theme.


TODO (needs external accounts/keys)
-----------------------------------
- Social login, live video (Daily/LiveKit), real payments (Stripe).
- pro_active is a placeholder — enforce Pro in a function, never client-only.


SECURITY
--------
- DATABASE_URL + JWT_SECRET live ONLY in Vercel env vars, never in code/GitHub.
- .env is gitignored.
