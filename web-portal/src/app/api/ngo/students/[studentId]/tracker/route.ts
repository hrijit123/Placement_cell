import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TrackerSchema = z.object({
  recordType: z.enum(["INTERVIEW", "PLACEMENT"]),
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  interviewStatus: z.enum([
    "APPLIED", "SCHEDULED", "ATTENDED", "NO_SHOW",
    "OFFER_EXTENDED", "OFFER_ACCEPTED", "OFFER_REJECTED_BY_STUDENT", "REJECTED_BY_COMPANY"
  ]).optional(),
  placementStatus: z.enum(["WORKING", "RESIGNED", "TERMINATED"]).optional(),
  // The form sends "" when no salary is entered — treat that as absent, not 0.
  salary: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().nonnegative().optional()
  ),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  nextMove: z.string().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const session = await getServerSession(authOptions);
    const role = (session as any)?.user?.role;

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({ where: { email: session.user.email! }, include: { profile: true } });
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.profile.findUnique({
      where: { studentId },
      include: { cohorts: true, user: true }
    });

    if (!profile) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // --- ACCESS CONTROL ---
    if (role === "STUDENT") {
      if (actor.profile?.studentId !== studentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (role === "TEACHER") {
      const teacherUser = await prisma.user.findUnique({
        where: { id: actor.id },
        include: { cohortsLed: true }
      });
      const teacherCohortIds = teacherUser?.cohortsLed.map(c => c.id) || [];
      const studentCohortIds = profile.cohorts.map(c => c.id) || [];
      const hasAccess = studentCohortIds.some(id => teacherCohortIds.includes(id));

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsedBody = TrackerSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid tracker payload" }, { status: 400 });
    }
    const { recordType, company, role: jobRole, interviewStatus, placementStatus, salary, startDate, endDate, nextMove } = parsedBody.data;

    const verificationStatus = role === "STUDENT" ? "SELF_REPORTED" : "VERIFIED";

    await prisma.careerRecord.create({
      data: {
        profileId: profile.id,
        recordType,
        company,
        role: jobRole,
        verification: verificationStatus,
        interviewStatus: recordType === 'INTERVIEW' ? (interviewStatus ?? 'APPLIED') : null,
        placementStatus: recordType === 'PLACEMENT' ? (placementStatus ?? 'WORKING') : null,
        salary: salary ?? null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        nextMove: nextMove || null
      }
    });

    // --- AUDIT LOGGING ---
    await prisma.recordAuditLog.create({
      data: {
        profileId: profile.id,
        actorId: actor.id,
        action: "CREATE",
        field: "Career Track Record",
      }
    });

    // --- NOTIFICATIONS ---
    if (role === "STUDENT") {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      const teacherIds = [...new Set(profile.cohorts.map(c => c.teacherId))];
      
      for (const admin of admins) {
        await prisma.notification.create({
          data: { recipientId: admin.id, profileId: profile.id, message: `Student ${profile.user.name || studentId} added a new Career Track record.` }
        });
      }
      for (const tId of teacherIds) {
        await prisma.notification.create({
          data: { recipientId: tId, profileId: profile.id, message: `Student ${profile.user.name || studentId} added a new Career Track record.` }
        });
      }
    } else {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: { recipientId: admin.id, profileId: profile.id, message: `${role} ${actor.name || actor.email} added a Career Track record for ${profile.user.name || studentId}.` }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tracker update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
