# ISL Connect / NGO Placement Cell Backend Architecture

*This document is formatted for an external AI (Claude) to audit the database schema, role management, and backend API design.*

## 1. Database Schema (`prisma/schema.prisma`)

The system is built on PostgreSQL using Prisma ORM. It enforces 4 distinct roles and completely maps the lifecycle of a student (from onboarding to career placements).

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
}

enum Role {
  STUDENT
  TEACHER
  RECRUITER
  ADMIN
}

enum ApplicationStatus {
  APPLIED
  INTERVIEW_SCHEDULED
  INTERVIEW_ATTENDED
  INTERVIEW_NO_SHOW
  OFFER_EXTENDED
  REJECTED_BY_COMPANY
  OFFER_REJECTED_BY_STUDENT
  OFFER_ACCEPTED
}

enum PlacementStatus {
  WORKING
  RESIGNED
  TERMINATED
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
}

model User {
  id            String    @id @default(uuid())
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          Role      @default(STUDENT)
  status        UserStatus @default(ACTIVE)
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // NextAuth Relations
  accounts      Account[]
  sessions      Session[]

  // Core Relations
  profile          Profile?
  jobsPosted       Job[]              @relation("RecruiterJobs")
  applications     JobApplication[]   @relation("StudentApplications")
  careerHistory    CareerPlacement[]  @relation("StudentCareerHistory")
  attendance       Attendance[]       @relation("StudentAttendance")
}

model Profile {
  id     String @id @default(uuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // NGO Universal ID
  studentId      String? @unique

  // General Details
  headline       String?
  address        String?
  languages      String? // comma separated
  hobbies        String?
  vocation       String? // Vocational interests/training
  disabilityInfo String? // Accommodations/Specifics for recruiters

  // Professional Background
  skills         String? // Stored as comma separated or JSON
  experience     String? // JSON or text
  education      String? // JSON or text
  courseworks    String? // JSON or text
  internships    String? // JSON or text
  certifications String?
  
  // Job Preferences
  expectedSalary String?
  availability   String? // e.g. Full-time, Immediate

  resumePdfUrl   String?
}

model Job {
  id          String   @id @default(uuid())
  title       String
  description String
  company     String
  location    String
  recruiterId String
  recruiter   User     @relation("RecruiterJobs", fields: [recruiterId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  isActive    Boolean  @default(true)

  applications JobApplication[]
}

model JobApplication {
  id          String            @id @default(uuid())
  jobId       String
  job         Job               @relation(fields: [jobId], references: [id])
  studentId   String
  student     User              @relation("StudentApplications", fields: [studentId], references: [id])
  
  status      ApplicationStatus @default(APPLIED)
  offeredSalary Float?
  rejectionReason String?
  notes       String?
  
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

model CareerPlacement {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation("StudentCareerHistory", fields: [userId], references: [id])
  
  company     String
  role        String
  salary      Float?
  
  startDate   DateTime
  endDate     DateTime?
  status      PlacementStatus @default(WORKING)
  
  nextMove    String? // "Where are they now" if they left
  
  createdAt   DateTime @default(now())
}

model Attendance {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation("StudentAttendance", fields: [userId], references: [id])
  
  date        DateTime
  status      AttendanceStatus @default(PRESENT)
  classOrEvent String? // Optional descriptor of what they attended
  
  createdAt   DateTime @default(now())
}

// NextAuth mapping tables (Account, Session, VerificationToken) omitted for brevity.
```

## 2. Universal Search API Endpoint (`GET /api/ngo/students/[studentId]`)

This endpoint allows an `ADMIN` or `TEACHER` to pull a full "360-degree" dossier of a student by querying their `studentId`.

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow Admin or Teacher roles to query 360 student data
    if (!session || ((session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { studentId } = params;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Pull down every relation associated with this student
    const studentProfile = await prisma.profile.findUnique({
      where: { studentId },
      include: {
        user: {
          include: {
            applications: {
              include: { job: true },
              orderBy: { createdAt: 'desc' }
            },
            careerHistory: { orderBy: { startDate: 'desc' } },
            attendance: { orderBy: { date: 'desc' } }
          }
        }
      }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Restructure response for neat frontend consumption
    const dossier = {
      studentId: studentProfile.studentId,
      name: studentProfile.user.name,
      email: studentProfile.user.email,
      personalDetails: {
        headline: studentProfile.headline,
        address: studentProfile.address,
        languages: studentProfile.languages,
        hobbies: studentProfile.hobbies,
        vocation: studentProfile.vocation,
        disabilityInfo: studentProfile.disabilityInfo
      },
      professionalBackground: {
        skills: studentProfile.skills,
        experience: studentProfile.experience,
        education: studentProfile.education,
        courseworks: studentProfile.courseworks,
        internships: studentProfile.internships,
        certifications: studentProfile.certifications
      },
      jobPreferences: {
        expectedSalary: studentProfile.expectedSalary,
        availability: studentProfile.availability
      },
      jobApplications: studentProfile.user.applications.map((app: any) => ({
        id: app.id,
        jobTitle: app.job.title,
        company: app.job.company,
        status: app.status,
        offeredSalary: app.offeredSalary,
        rejectionReason: app.rejectionReason,
        appliedAt: app.createdAt
      })),
      careerHistory: studentProfile.user.careerHistory.map((history: any) => ({
        id: history.id,
        company: history.company,
        role: history.role,
        salary: history.salary,
        startDate: history.startDate,
        endDate: history.endDate,
        status: history.status,
        nextMove: history.nextMove
      })),
      attendance: studentProfile.user.attendance.map((att: any) => ({
        id: att.id,
        date: att.date,
        status: att.status,
        classOrEvent: att.classOrEvent
      }))
    };

    return NextResponse.json(dossier);
  } catch (error) {
    console.error('Error fetching student dossier:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

## 3. Role Management & Authentication
- Managed via `NextAuth` with Google Providers.
- `src/app/api/user/role/route.ts` is used during onboarding to attach a `STUDENT`, `TEACHER`, or `RECRUITER` role to the user's Prisma record.
- The NextAuth JWT callback has been extended to push the `role` onto the session token natively so that `session.user.role` is accessible throughout the application.
