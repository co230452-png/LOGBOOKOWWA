# OWWA Region 9 Logbook System — Full Setup Instructions

A complete full-stack QR-code-based attendance/logbook system for OWWA Region 9.

- **Backend:** `owwa-logbook-backend/` — Express.js + MongoDB + JWT
- **Frontend:** `owwa-logbook-frontend/` — React (Vite + TypeScript) + Tailwind CSS

---

## 1. Prerequisites

Install before you start:
- **Node.js** v18 or newer ([nodejs.org](https://nodejs.org))
- **npm** (comes with Node.js)
- A free **MongoDB Atlas** account ([mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
- A modern browser with camera access (for the admin QR scanner) — Chrome or Edge recommended
- A code editor (VS Code recommended)

---

## 2. Set Up MongoDB Atlas (Cloud Database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Click **"Build a Database"** → choose the **free M0 tier** → pick a cloud provider/region close to you → click **Create**.
3. **Create a database user:**
   - Under Security → Database Access → "Add New Database User"
   - Choose "Password" authentication, set a username and a strong password (save these — you'll need them).
   - Grant "Read and write to any database" role.
4. **Allow network access:**
   - Under Security → Network Access → "Add IP Address"
   - For development, click "Allow Access from Anywhere" (`0.0.0.0/0`). For production, restrict to your server's IP.
5. **Get your connection string:**
   - Go to Database → click "Connect" on your cluster → "Drivers" → select Node.js.
   - Copy the connection string. It looks like:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with the credentials you created in step 3.
   - Add a database name before the `?`, e.g. `.../owwa_logbook?retryWrites=true...`

You'll paste this into the backend `.env` file in the next step.

---

## 3. Backend Setup

```bash
cd owwa-logbook-backend
npm install
```

Create your environment file:
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
```env
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/owwa_logbook?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret_string_at_least_32_characters
JWT_EXPIRES_IN=7d
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

> **Tip for `JWT_SECRET`:** generate a strong random value, e.g. run:
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

**Seed the database** with one admin account and sample users (recommended for first run):
```bash
npm run seed
```
This creates:
- **Admin:** `admin@owwa9.gov.ph` / `Admin@1234`
- **Approved users:** `maria.santos@email.com`, `juan.delacruz@email.com`, `ana.reyes@email.com` (all password `User@1234`)
- **Pending users:** `pedro.garcia@email.com`, `rosa.lim@email.com` (awaiting admin approval — useful for testing the approval flow)
- 7 days of sample attendance history for approved users

**Start the backend server:**
```bash
npm run dev
```
You should see:
```
🚀 OWWA Logbook Backend
   Running on: http://localhost:5000
   API Health: http://localhost:5000/api/health
```

Verify it's working by visiting `http://localhost:5000/api/health` in your browser — you should see a JSON status response.

---

## 4. Frontend Setup

Open a **new terminal window** (keep the backend running):

```bash
cd owwa-logbook-frontend
npm install
```

Create your environment file (optional — defaults work for local dev):
```bash
cp .env.example .env
```
The default `VITE_API_URL=http://localhost:5000/api` works as long as your backend runs on port 5000.

**Start the frontend dev server:**
```bash
npm run dev
```
You should see:
```
VITE ready
➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in your browser.

---

## 5. Try It Out

### As Admin
1. Go to `http://localhost:5173/login`
2. Log in with `admin@owwa9.gov.ph` / `Admin@1234`
3. You'll land on the Admin Dashboard. Explore:
   - **Pending Approvals** — approve `pedro.garcia@email.com` or `rosa.lim@email.com`
   - **QR Scanner** — click "Start Scanner" (allow camera permission) and scan a user's QR code (open it on another device/tab logged in as that user, or screenshot/display their dashboard QR)
   - **Attendance Records** — filter by date range, export to CSV
   - **User Accounts** — search, view details, delete users

### As a User
1. Log out, then log in with `maria.santos@email.com` / `User@1234`
2. View your dashboard with your personal QR code (downloadable)
3. Check **My Attendance** for your history

### Register a New Account
1. From the login page, click "Register here"
2. Fill out the form and submit — the account will be **pending** until an admin approves it from the Pending Approvals page

---

## 6. Running Both Servers Together (Day-to-Day)

You need **two terminals** running simultaneously:

**Terminal 1 — Backend:**
```bash
cd owwa-logbook-backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd owwa-logbook-frontend
npm run dev
```

Then visit `http://localhost:5173`.

---

## 7. Building for Production

**Backend:**
```bash
cd owwa-logbook-backend
npm start   # runs node server.js (no nodemon/watch)
```
Deploy to any Node host (Render, Railway, Heroku, a VPS, etc.). Set the same environment variables there, and update `FRONTEND_URL` to your deployed frontend's URL.

**Frontend:**
```bash
cd owwa-logbook-frontend
npm run build     # outputs static files to dist/
npm run preview   # preview the production build locally
```
Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, etc.). Set `VITE_API_URL` in that platform's environment variables to point at your deployed backend, e.g. `https://your-api.onrender.com/api`.

---

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| `MongoServerError: bad auth` | Double-check the username/password in `MONGO_URI`; special characters in the password must be URL-encoded. |
| `MongoNetworkError` / timeout | Check Network Access in Atlas — make sure your current IP (or `0.0.0.0/0` for dev) is allowed. |
| Frontend shows network errors / CORS errors | Confirm the backend is running on port 5000 and `FRONTEND_URL` in backend `.env` matches your frontend's actual URL. |
| Camera scanner doesn't open | Browsers require HTTPS or `localhost` for camera access — this works fine on `localhost:5173` but will need HTTPS in production. Also check browser camera permissions. |
| "Not authorized, invalid token" after working before | Your JWT expired (default 7 days) or `JWT_SECRET` changed — just log in again. |
| Seed script says duplicate key error | You already seeded — it clears existing data first, so this shouldn't normally happen; if it does, manually drop the database collections in Atlas and re-run. |

---

## 9. Security Checklist (Already Implemented)

- ✅ Passwords hashed with bcrypt, never stored or returned in plaintext
- ✅ JWT-based authentication with configurable expiry
- ✅ Role-based route protection (`user` vs `admin`) on both frontend and backend
- ✅ Account approval workflow — new registrations can't log in until approved
- ✅ Server-side input validation (`express-validator`) on auth routes
- ✅ Duplicate attendance prevented via unique DB index (one scan per user per day)
- ✅ CORS locked to a configured frontend origin
- ✅ `.env` files excluded from version control via `.gitignore`

For production, also consider: rate limiting (e.g. `express-rate-limit`), HTTPS everywhere, rotating `JWT_SECRET`, and restricting MongoDB Atlas network access to your server's specific IP rather than `0.0.0.0/0`.
