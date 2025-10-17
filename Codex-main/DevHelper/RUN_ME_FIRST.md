
# SATORP Trainee System – Quick Start (Windows)

## 1) Prereqs
- Node.js LTS (v18+)
- SQL Server (Express OK) and enable SQL auth for `sa` user
- Create database named `SATORP_TraineeSystem`

## 2) Configure Backend
Edit `backend/.env` (already present). Ensure:
```
PORT=5000
DB_SERVER=YOURMACHINE\SQLEXPRESS
DB_NAME=SATORP_TraineeSystem
DB_USER=sa
DB_PASSWORD=YourStrong!Pass123
JWT_SECRET=change_me_in_production
```

## 3) Configure Frontend
`client/.env` already points to the backend:
```
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

## 4) Start Dev Servers
Run:
```
DevHelper/run_dev.ps1
```
This opens two windows: backend on port 5000 and frontend on port 3000.

## 5) Health Checks
- Backend: `http://localhost:5000/api/health` (should return OK JSON)
- API Docs page: visit `http://localhost:5000/` for a simple index
- Frontend: `http://localhost:3000/`

## Notes
- Design/UI not altered.
- If you see a blank page, check the browser console for CORS or network errors; the frontend expects the backend at `http://localhost:5000/api`.
- If DB won't connect, run `node backend/check-installation.js` from a Windows PowerShell to diagnose SQL Server services.
