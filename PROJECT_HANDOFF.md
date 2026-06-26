# ISL Connect: Project Overview & Architecture Handoff

*This document is designed to be fed into any LLM (like Claude or another AI) to instantly give it full context on the project's objectives, architecture, state, and codebase requirements.*

## 1. Project Objectives
**ISL Connect** is a two-sided marketplace and real-time accessibility platform designed to bridge the communication gap between Deaf/Hard-of-Hearing (DHH) candidates who use Indian Sign Language (ISL) and corporate recruiters. 

**Core Goals:**
- **Accessibility**: Provide real-time ISL-to-English text translation during video interviews.
- **Placement Hub**: Allow recruiters to post jobs, and candidates to build resumes and apply.
- **Robustness**: Secure authentication, role-based access, and highly responsive modern UI.

---

## 2. Tech Stack & Architecture

### A. Web Portal (Frontend & Core Backend)
- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS (Earthy, premium aesthetics: `#2C241B`, `#FDFBF7`, `#2D4A22`)
- **Authentication**: NextAuth.js (Google OAuth Provider + Prisma Adapter)
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: Prisma (v7.8.0, utilizing `@prisma/adapter-pg` for edge/serverless compatibility)

### B. Machine Learning Service (Translation Backend)
- **Framework**: FastAPI (Python, Uvicorn)
- **Communication**: WebSockets (Real-time bidrectional streaming)
- **Computer Vision**: Google MediaPipe (Client-side Hand Landmark detection)
- **ML Model**: Scikit-Learn/TensorFlow (Pre-trained Random Forest/Neural Net `ready_model_nn.h5` trained on ISL coordinate geometry).

---

## 3. How the Real-Time Translation Works (The Interview Room)
1. **Client-Side Capture**: The Next.js `/interview` page accesses the user's webcam.
2. **Client-Side Processing**: MediaPipe (loaded via CDN) extracts 3D hand landmarks (`(x,y,z)` coordinates) directly in the browser to save server bandwidth.
3. **WebSocket Streaming**: The raw coordinate geometry is stringified and sent over a WebSocket connection to the FastAPI server (`ws://localhost:8000/ws/translate`).
4. **Server-Side Inference**: FastAPI feeds the coordinates into the pre-trained ML model, predicting the ISL character/word.
5. **Real-time Subtitles**: The predicted text is instantly sent back over the WebSocket and displayed as closed captions on the Next.js frontend.

---

## 4. Database Schema (Prisma)
The PostgreSQL database revolves around Role-Based Access Control (RBAC):
- **User**: Stores email, name, and `Role` (`CANDIDATE`, `RECRUITER`, `ADMIN`). Integrates with NextAuth `Account` and `Session`.
- **Profile**: 1-to-1 with User. Stores resume data (headline, skills, education) and analytics (jobs applied, offers).
- **Job**: 1-to-Many with User (Recruiters). Stores job title, description, company, and location.
- **Application**: Links `User` (Candidate) to `Job`.
- **Interview**: Links an `Application` to a scheduled video room.

---

## 5. Folder Structure
The workspace is located in the user's local directory and is split into two microservices:

```text
isl-translator/
├── web-portal/                  # Next.js Application
│   ├── .env                     # Contains DB strings and Google OAuth secrets
│   ├── package.json             
│   ├── prisma/
│   │   └── schema.prisma        # Database schema definitions
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/             # Next.js API Routes (Jobs, Auth, Roles)
│   │   │   ├── interview/       # WebSocket + MediaPipe UI
│   │   │   ├── jobs/            # Job Board (Candidates) & Post Job (Recruiters)
│   │   │   ├── onboarding/      # Role selection after first Google Login
│   │   │   ├── resume/          # Resume builder UI
│   │   │   ├── layout.tsx       # Global layout containing the Navbar
│   │   │   └── page.tsx         # Landing page
│   │   ├── components/          # Reusable UI (Navbar.tsx)
│   │   └── lib/                 # Utilities (prisma.ts instantiation with adapter-pg)
│
├── ml-service/                  # FastAPI Application
│   ├── main.py                  # WebSocket server & ML inference logic
│   ├── requirements.txt         # fastapi, uvicorn, websockets, scikit-learn
│   └── ready_model_nn.h5        # The pre-trained model weights
```

---

## 6. Current State & Known Behaviors
- **Authentication**: Fully working. Users log in via Google. First-time users are redirected to `/onboarding` to pick a role. The NextAuth session token securely stores their chosen role.
- **Navigation**: A global sticky Navbar dynamically renders links based on the active session's role.
- **Database Connection**: Using Prisma 7's new serverless architecture. We strictly use `pg` and `@prisma/adapter-pg` in `src/lib/prisma.ts`.
- **MediaPipe Stability**: MediaPipe CDNs are loaded lazily in the Interview room. The "Join" button remains disabled ("Loading AI Models...") until the scripts are fully injected to prevent crash alerts.
