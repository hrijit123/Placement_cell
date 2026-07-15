# DEEDS Placement Cell Portal

A comprehensive, full-stack placement and student management portal built to streamline operations for the DEEDS NGO. This platform tracks student progress, attendance, document verification, and end-to-end career placements, giving teachers, students, and administrators unified access to critical educational data.

## 🚀 Built With "Vibe Coding"
This project was developed rapidly under a tight deadline through **AI-assisted "vibe coding"**. I do not have a technical background in Next.js, TypeScript, or Prisma. Instead, I pair-programmed with an autonomous AI coding assistant (Antigravity/Gemini). 

I functioned strictly as the **Product Manager and Domain Expert**—defining the requirements, business logic, user roles, and testing the workflows. The AI handled all the boilerplate generation, database implementation, UI coding (Tailwind CSS), and complex TypeScript logic. This project is a testament to how AI can bridge the gap between a product vision and a fully deployed, production-ready application.

## 🛠 Tech Stack
* **Framework:** [Next.js (App Router)](https://nextjs.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Database:** [PostgreSQL](https://www.postgresql.org/) managed via [Prisma ORM](https://www.prisma.io/)
* **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Google Provider with Role-Based Access)
* **Deployment:** [Vercel](https://vercel.com/)

## ✨ Key Features
* **Role-Based Access Control (RBAC):** Distinct dashboards and permissions for `ADMIN`, `TEACHER`, and `STUDENT` roles.
* **Student Database:** Centralized tracking of student profiles, education, certifications, and courseworks.
* **Document Verification:** Workflow for students to upload credentials and for Teachers/Admins to Approve, Reject, or Remove them.
* **Placement & Career Tracking:** Track interview schedules, outcomes, and final job placements with monthly salary metrics.
* **Attendance Tracking:** Keep track of student attendance across various cohorts.
* **PDF Report Generation:** Generate detailed, downloadable PDF report cards summarizing student performance and placements.
* **Admin Analytics:** Bird's eye view of placement funnels, top employers, average monthly salaries, and staff HR records.

## 💻 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL instance (local or hosted, e.g., Neon/Supabase)

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/hrijit123/Placement_cell.git
   cd Placement_cell
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory based on `.env.example` (if provided) and add the following variables:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/deeds"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="your-google-oauth-client-id"
   GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
   ```

4. **Initialize the Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
   *(Optional) To populate the database with mock data for testing:*
   ```bash
   npx prisma db seed
   ```

5. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📝 License
This project is open-source and available under the [MIT License](LICENSE).
