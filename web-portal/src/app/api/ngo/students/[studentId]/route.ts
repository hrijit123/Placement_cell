import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';

const StudentIdSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);

const rateLimitCache = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 10;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;
    const url = new URL(request.url);
    const isFullHistory = url.searchParams.get('full') === 'true';
    const overrideReason = url.searchParams.get('overrideReason');

    const role = (session.user as any).role;
    
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
    const validation = StudentIdSchema.safeParse(studentId);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid Student ID format' }, { status: 400 });
    }

    // Fetch the target student's profile
    const studentProfile = await prisma.profile.findUnique({
      where: { studentId },
      include: {
        user: {
          include: {
            attendance: { 
              orderBy: { date: 'desc' },
              take: isFullHistory ? undefined : 5
            }
          }
        },
        cohorts: true,
        careerTrack: {
          orderBy: { createdAt: 'desc' },
          take: isFullHistory ? undefined : 20
        }
      }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // --- ACCESS CONTROL & SCOPING ---
    const viewerUser = await prisma.user.findUnique({ where: { email: session.user.email! }, include: { profile: true } });
    if (!viewerUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let isRedacted = false;
    let isOutOfCohort = false;

    if (role === 'STUDENT') {
      if (viewerUser.profile?.studentId !== studentId) {
        return NextResponse.json({ error: 'Forbidden: Can only view your own profile' }, { status: 403 });
      }
    } else if (role === 'TEACHER') {
      const teacherUser = await prisma.user.findUnique({
        where: { id: viewerUser.id },
        include: { cohortsLed: true }
      });
      
      const teacherCohortIds = teacherUser?.cohortsLed.map(c => c.id) || [];
      const studentCohortIds = studentProfile.cohorts.map(c => c.id);
      
      const hasAccess = studentCohortIds.some(id => teacherCohortIds.includes(id));
      
      if (!hasAccess) {
        if (!overrideReason) {
          return NextResponse.json({ error: 'OUT_OF_COHORT', message: 'Student is outside your cohort. Provide an override reason to access.' }, { status: 403 });
        }
        isOutOfCohort = true;
        isRedacted = true; // Redact salary and disability info when out of cohort
      }
    }

    // --- AUDIT LOGGING ---
    if (role !== 'STUDENT') {
      await prisma.accessLog.create({
        data: {
          actorId: viewerUser.id,
          targetStudentId: studentProfile.studentId || "unknown",
          isOutOfCohort,
          reason: isOutOfCohort ? overrideReason : 'Standard access'
        }
      });
      
      if (isOutOfCohort) {
        // Send notification to ADMIN
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        for (const admin of admins) {
          await prisma.notification.create({
            data: {
              recipientId: admin.id,
              profileId: studentProfile.id,
              message: `Teacher ${viewerUser.name || viewerUser.email} performed an out-of-cohort lookup for student ${studentProfile.name || studentProfile.user?.name || studentProfile.studentId}. Reason: ${overrideReason}`,
              actionUrl: `/database?search=${studentProfile.studentId || studentProfile.id}`
            }
          });
        }
      }
    }

    // --- BUILD DOSSIER PAYLOAD ---
    const dossier = {
      studentId: studentProfile.studentId,
      name: studentProfile.name || studentProfile.user?.name || "Student",
      email: studentProfile.user?.email || "Unclaimed",
      image: studentProfile.user?.image,
      isRedacted,
      cohorts: studentProfile.cohorts,
      personalDetails: {
        headline: studentProfile.headline,
        address: studentProfile.address,
        phone: studentProfile.phone,
        className: studentProfile.className,
        photoData: studentProfile.photoData,
        languages: studentProfile.languages,
        hobbies: studentProfile.hobbies,
        vocation: studentProfile.vocation,
        disabilityInfo: isRedacted ? '[REDACTED]' : studentProfile.disabilityInfo
      },
      professionalBackground: {
        skills: studentProfile.skills,
        experience: studentProfile.experience,
        education: studentProfile.education,
        courseworks: studentProfile.courseworks,
        internships: studentProfile.internships,
        certifications: studentProfile.certifications,
        transcripts: studentProfile.transcripts,
        resumePdfUrl: studentProfile.resumePdfUrl
      },
      jobPreferences: {
        expectedSalary: isRedacted ? '[REDACTED]' : studentProfile.expectedSalary,
        availability: studentProfile.availability
      },
      careerTrack: studentProfile.careerTrack.map(ct => ({
        id: ct.id,
        recordType: ct.recordType,
        company: ct.company,
        role: ct.role,
        verification: ct.verification,
        interviewStatus: ct.interviewStatus,
        placementStatus: ct.placementStatus,
        salary: isRedacted ? null : ct.salary,
        startDate: ct.startDate,
        endDate: ct.endDate,
        nextMove: ct.nextMove,
        createdAt: ct.createdAt
      })),
      attendance: studentProfile.user?.attendance?.map((att: any) => ({
        id: att.id,
        date: att.date,
        status: att.status,
        classOrEvent: att.classOrEvent
      })) || []
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
