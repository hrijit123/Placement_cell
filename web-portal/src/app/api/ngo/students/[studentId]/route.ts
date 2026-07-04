import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

// Zod schema for input validation
// Assuming studentId is an alphanumeric NGO ID string, not necessarily a UUID
const StudentIdSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);

// In-Memory Token Bucket for Rate Limiting (Basic protection against scraping)
const rateLimitCache = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 dossier fetches per minute per user

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'ADMIN' && role !== 'TEACHER') {
      return NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 });
    }
    
    // --- RATE LIMITING ---
    const userEmail = session.user.email || 'anonymous';
    const now = Date.now();
    let limitRecord = rateLimitCache.get(userEmail);
    if (!limitRecord || limitRecord.resetTime < now) {
      limitRecord = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    } else {
      limitRecord.count += 1;
    }
    rateLimitCache.set(userEmail, limitRecord);
    
    if (limitRecord.count > MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
    }

    // --- INPUT VALIDATION ---
    const { studentId } = await params;
    const validation = StudentIdSchema.safeParse(studentId);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid Student ID format' }, { status: 400 });
    }
    
    const url = new URL(request.url);
    const isFullHistory = url.searchParams.get('full') === 'true';

    // Fetch the target student's profile
    const studentProfile = await prisma.profile.findUnique({
      where: { studentId },
      include: {
        user: {
          include: {
            applications: {
              include: { job: true },
              orderBy: { createdAt: 'desc' }
            },
            careerHistory: { 
              orderBy: { startDate: 'desc' },
              take: isFullHistory ? undefined : 5
            },
            attendance: { 
              orderBy: { date: 'desc' },
              take: isFullHistory ? undefined : 5
            }
          }
        },
        cohorts: true
      }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // --- COHORT SCOPING & REDACTION FOR TEACHERS ---
    let isRedacted = false;
    
    if (role === 'TEACHER') {
      isRedacted = true;
      // Fetch the teacher's DB user to check their cohorts
      const teacherUser = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: { cohortsLed: true }
      });
      
      const teacherCohortIds = teacherUser?.cohortsLed.map(c => c.id) || [];
      const studentCohortIds = studentProfile.cohorts.map(c => c.id);
      
      const hasAccess = studentCohortIds.some(id => teacherCohortIds.includes(id));
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden: Student is not in your assigned cohorts' }, { status: 403 });
      }
    }

    // --- AUDIT LOGGING ---
    const viewerUser = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (viewerUser) {
      await prisma.dossierAccessLog.create({
        data: {
          viewerId: viewerUser.id,
          studentId: studentProfile.studentId || "unknown",
          reason: `Accessed dossier (full=${isFullHistory})`
        }
      });
    }

    // --- BUILD DOSSIER PAYLOAD ---
    const dossier = {
      studentId: studentProfile.studentId,
      name: studentProfile.user.name,
      email: studentProfile.user.email,
      image: studentProfile.user.image,
      isRedacted,
      personalDetails: {
        headline: studentProfile.headline,
        address: studentProfile.address,
        languages: studentProfile.languages,
        hobbies: studentProfile.hobbies,
        vocation: studentProfile.vocation,
        // Redact highly sensitive info if Teacher
        disabilityInfo: isRedacted ? '[REDACTED]' : studentProfile.disabilityInfo
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
        expectedSalary: isRedacted ? '[REDACTED]' : studentProfile.expectedSalary,
        availability: studentProfile.availability
      },
      jobApplications: studentProfile.user.applications.map((app: any) => ({
        id: app.id,
        jobTitle: app.job.title,
        company: app.job.company,
        status: app.status,
        offeredSalary: isRedacted ? null : app.offeredSalary,
        rejectionReason: isRedacted ? '[REDACTED]' : app.rejectionReason,
        appliedAt: app.createdAt
      })),
      careerHistory: studentProfile.user.careerHistory.map((history: any) => ({
        id: history.id,
        company: history.company,
        role: history.role,
        salary: isRedacted ? null : history.salary,
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
