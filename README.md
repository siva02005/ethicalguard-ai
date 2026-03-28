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

### Backend on Render
1. Push this project to GitHub.
2. Create a new Render Blueprint using [render.yaml](C:\Users\Dell\Documents\prototype\render.yaml).
3. Set the backend service root to `backend`.
4. Set environment variable:
   - `CORS_ORIGINS=https://your-vercel-frontend.vercel.app`
5. Render will provision PostgreSQL automatically and inject `DATABASE_URL`.
6. Your backend link will look like:
   - `https://ethicalguard-api.onrender.com`

### Always-On Production Setup
- Frontend host: Vercel
- Backend host: Render
- Database: Render PostgreSQL
- Frontend production env example: [frontend/.env.production.example](C:\Users\Dell\Documents\prototype\frontend\.env.production.example)
- Vercel config: [frontend/vercel.json](C:\Users\Dell\Documents\prototype\frontend\vercel.json)
- Render blueprint: [render.yaml](C:\Users\Dell\Documents\prototype\render.yaml)
