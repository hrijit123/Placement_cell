# 🚀 ISL Connect - Frontend & Deployment Handoff

Welcome to the team! The backend architecture and database schema have just been completely overhauled and secured following a rigorous technical audit. 

This document outlines exactly where the backend currently stands, what needs to be built on the frontend, and how to eventually host this project.

---

## 1. Current State of the Backend
- **Database (Supabase / Prisma)**: The database is fully operational. We've introduced a **Cohort** model to link Teachers to specific Students and added strict `onDelete: Restrict` rules so NGO data cannot be accidentally destroyed.
- **Authentication**: We use **NextAuth (Google OAuth)** exclusively. Password-based authentication has been entirely removed for security reasons.
- **Dossier API (`/api/ngo/students/[studentId]`)**: This is the core endpoint you will be interacting with. It is fully locked down:
  - Validates IDs, uses a token-bucket rate limiter, and has pagination built-in.
  - **Crucial for Frontend**: If a `TEACHER` requests a student dossier, the backend automatically redacts sensitive info, returning the string `"[REDACTED]"` for `disabilityInfo`, `expectedSalary`, `offeredSalary`, and `rejectionReason`.
- **ML Service**: The Python/FastAPI ML WebSocket service has been **segregated (commented out)** in `start.bat` and `main.py` due to security audit findings (it currently lacks WSS authentication). We are not focusing on this for the MVP deployment unless you want to fix the Auth tokens first.

---

## 2. Frontend Development Tasks (What You Need to Do)

### A. The "Dossier" Dashboard (Highest Priority)
You need to build the UI for the NGO Placement Cell.
- **Route**: Create a dynamic page at `src/app/dashboard/student/[studentId]/page.tsx`.
- **Data Fetching**: Fetch the JSON payload from `GET /api/ngo/students/[studentId]`.
- **UI States**: 
  - Handle `403 Forbidden` if a Teacher tries to view a student not in their Cohort.
  - Handle `429 Too Many Requests` gracefully (the backend rate limiter).
- **Conditional Rendering**: If any field equals `"[REDACTED]"`, render a locked UI state (e.g., a greyed-out padlock icon) rather than standard text.

### B. Pagination & Full History
The API only returns the 5 most recent `careerHistory` and `attendance` records by default to save bandwidth.
- **Task**: Add a "View Full History" button on the frontend that refetches the API by appending `?full=true` to the URL.

### C. Admin Metrics Dashboard
- **Route**: `src/app/admin/page.tsx`
- **Task**: Flesh out the charts. The data is available via Prisma, but you'll need to use a charting library (like Recharts or Chart.js) to visualize the placement metrics, top employers, and attendance ratios.

---

## 3. Hosting & Deployment Strategy

When the frontend is ready, follow this multi-tier deployment strategy:

### Tier 1: The Database (Supabase)
The database is already hosted on Supabase.
- For production, ensure you are using the **Connection Pooling URL** (port `6543`) in your production `.env` for `DATABASE_URL`.
- The `DIRECT_URL` (port `5432`) is only for running `npx prisma db push` or migrations. Do NOT use it for the Next.js runtime.

### Tier 2: The Web Portal (Vercel)
Vercel is the easiest and best platform for Next.js (App Router).
1. Connect this GitHub repository directly to Vercel.
2. In the Vercel Environment Variables settings, you **must** add:
   - `DATABASE_URL` (Pooler URL - port 6543)
   - `DIRECT_URL` (Direct URL - port 5432)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET` (Generate a new secure string for production)
   - `NEXTAUTH_URL` (Set this to your production Vercel domain, e.g., `https://isl-connect.vercel.app`)

### Tier 3: The ML Service (Render / Railway) - *Optional/Later*
Because Vercel is Serverless, it *cannot* host persistent WebSockets or heavy Python TensorFlow models. 
1. If you reactivate the ML service, deploy the `ml-service` folder separately to **Render.com** (as a Web Service) or **Railway.app**.
2. Make sure to update the frontend WebSocket connection string to point to the new Render/Railway URL (e.g., `wss://isl-ml-service.onrender.com/ws/translate`).
3. You will need to pass the `NEXTAUTH_SECRET` into the Render environment so it can decode the JWTs sent by the Next.js frontend.

---

## 4. How to Run Locally

1. **Clone the repo**.
2. **Environment Variables**: Create a `.env` file in the `web-portal` directory matching the keys listed above (ask the backend lead for the current local keys).
3. **Install Dependencies**: `cd web-portal && npm install`
4. **Sync Database**: `npx prisma generate` (you don't need `db push` if the remote Supabase is already updated, but generate is required for the local TS client).
5. **Run**: Use `start.bat` in the root folder, or run `npm run dev` inside `web-portal`.

Good luck! 🚀
