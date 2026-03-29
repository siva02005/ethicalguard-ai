# EthicalGuard AI

EthicalGuard AI is a full stack auditing dashboard for LLM outputs.

## Stack
- Frontend: React + Tailwind + Recharts
- Backend: FastAPI + SQLAlchemy
- Database: PostgreSQL (or SQLite fallback for local quick start)

## Folder Structure
```text
.
|-- backend
|   |-- app
|   |   |-- main.py
|   |   |-- schemas.py
|   |   |-- models.py
|   |   |-- db.py
|   |   `-- services
|   |       |-- auditor.py
|   |       `-- exporter.py
|   |-- requirements.txt
|   `-- .env.example
|-- frontend
|   |-- src
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   |-- api.js
|   |   |-- index.css
|   |   `-- components
|   |       |-- Sidebar.jsx
|   |       |-- AuditPlayground.jsx
|   |       `-- SafetyRadar.jsx
|   |-- index.html
|   |-- package.json
|   |-- tailwind.config.js
|   |-- postcss.config.js
|   `-- vite.config.js
`-- docker-compose.yml
```

## Backend Setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables
See `backend/.env.example`.

## Deployment

### Frontend on Vercel
1. Push this project to GitHub.
2. Import the `frontend` folder into Vercel.
3. Add environment variable:
   - `VITE_API_BASE_URL=https://your-render-backend.onrender.com`
4. Deploy. Your frontend link will look like:
   - `https://ethicalguard-ai.vercel.app`

### Frontend on Netlify
1. Push this project to GitHub.
2. Import the repository into Netlify.
3. Netlify can read [netlify.toml](C:\Users\Dell\Documents\prototype\netlify.toml) automatically.
4. Add environment variable:
   - `VITE_API_BASE_URL=https://your-render-backend.onrender.com`
5. Deploy. Your frontend link will look like:
   - `https://ethicalguard-ai.netlify.app`

### Frontend on Cloudflare Workers
1. Go to the [frontend](C:\Users\Dell\Documents\prototype\frontend) folder.
2. Add environment variable before building:
   - `VITE_API_BASE_URL=https://your-backend-url.onrender.com`
3. Build and deploy:
   - `npm install`
   - `npm run cf:deploy`
4. Cloudflare Workers will use [frontend/wrangler.toml](C:\Users\Dell\Documents\prototype\frontend\wrangler.toml) to serve the Vite `dist` output as a single-page app.
5. Your frontend link will look like:
   - `https://ethicalguard-ai.<your-subdomain>.workers.dev`

### Backend on Render
1. Push this project to GitHub.
2. Create a new Render Blueprint using [render.yaml](C:\Users\Dell\Documents\prototype\render.yaml).
3. Set the backend service root to `backend`.
4. Set environment variable:
   - `CORS_ORIGINS=https://your-vercel-frontend.vercel.app`
5. Render will provision PostgreSQL automatically and inject `DATABASE_URL`.
6. Your backend link will look like:
   - `https://ethicalguard-api.onrender.com`

### Backend on Railway
1. Push this project to GitHub.
2. Create a new Railway project from the GitHub repo.
3. Set the service root to `backend`.
4. Railway is configured to deploy with Docker using [backend/Dockerfile](C:\Users\Dell\Documents\prototype\backend\Dockerfile) and [backend/railway.json](C:\Users\Dell\Documents\prototype\backend\railway.json).
5. Add environment variables:
   - `DATABASE_URL=<railway-postgres-connection-string>`
   - `CORS_ORIGINS=https://aicareerassist.netlify.app`
6. Redeploy the latest commit after changing the service root.
7. Your backend link will look like:
   - `https://your-app.up.railway.app`

### Always-On Production Setup
- Frontend host: Vercel
- Frontend host alternative: Netlify
- Frontend host alternative: Cloudflare Workers
- Backend host: Render
- Backend host alternative: Railway
- Database: Render PostgreSQL
- Database alternative: Railway PostgreSQL
- Frontend production env example: [frontend/.env.production.example](C:\Users\Dell\Documents\prototype\frontend\.env.production.example)
- Vercel config: [frontend/vercel.json](C:\Users\Dell\Documents\prototype\frontend\vercel.json)
- Netlify config: [netlify.toml](C:\Users\Dell\Documents\prototype\netlify.toml)
- Cloudflare Workers config: [frontend/wrangler.toml](C:\Users\Dell\Documents\prototype\frontend\wrangler.toml)
- Render blueprint: [render.yaml](C:\Users\Dell\Documents\prototype\render.yaml)
