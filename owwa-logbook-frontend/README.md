# OWWA Region 9 Logbook — Frontend

React (Vite + TypeScript) client for the OWWA Region 9 Logbook System.

## Tech Stack
- React 18 + TypeScript + Vite
- React Router v6
- Tailwind CSS (custom OWWA blue/red palette)
- Axios (with JWT interceptor)
- react-qr-code (QR display)
- html5-qrcode (camera scanning)
- react-hot-toast (notifications)
- lucide-react (icons)
- date-fns (date formatting)

## Folder Structure
```
owwa-logbook-frontend/
├── src/
│   ├── components/
│   │   ├── admin/AdminLayout.tsx
│   │   ├── user/UserLayout.tsx
│   │   └── shared/ (OWWALogo, ProtectedRoute)
│   ├── context/
│   │   └── AuthContext.tsx       # JWT auth state, login/logout
│   ├── pages/
│   │   ├── auth/ (Login, Register)
│   │   ├── user/ (Dashboard, MyAttendance)
│   │   ├── admin/ (Dashboard, Scanner, AttendanceRecords, UserManagement, PendingApprovals)
│   │   └── NotFoundPage.tsx
│   ├── types/index.ts
│   ├── utils/api.ts              # Axios instance + endpoint helpers
│   ├── App.tsx                   # Routing
│   ├── main.tsx
│   └── index.css                 # Tailwind + OWWA component classes
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## Setup
See the root-level `SETUP_INSTRUCTIONS.md` for full step-by-step setup.

Quick start:
```bash
npm install
cp .env.example .env   # optional — defaults to http://localhost:5000/api
npm run dev              # starts on http://localhost:5173
```

## Pages
**User**
- `/login`, `/register` — public auth
- `/dashboard` — profile + large scannable QR code
- `/attendance` — personal attendance history with pagination

**Admin** (role must be `admin`)
- `/admin/dashboard` — stats overview + today's attendance
- `/admin/scanner` — live camera QR scanner, logs attendance on scan
- `/admin/attendance` — full records table, date-range filter, CSV export
- `/admin/users` — search/filter all users, view details, delete
- `/admin/pending` — approve/reject new registrations

## Notes
- The QR code embeds `{ "userId": "<mongo id>" }` as JSON, matching what the backend `/attendance/log` endpoint expects.
- The scanner page debounces rapid duplicate scans for a few seconds after each successful read.
- CSV export pulls the full filtered dataset (not just the current page) before building the file client-side.
- Mobile-responsive: sidebar collapses to a slide-out drawer below the `md` breakpoint; the scanner viewport and tables adapt to narrow screens.
