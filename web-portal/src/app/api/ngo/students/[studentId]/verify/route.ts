import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VerifySchema = z.object({
  target: z.enum(["education", "certifications", "transcripts", "careerTrack"]),
  status: z.enum(["VERIFIED", "REJECTED", "REMOVED"]),
  recordId: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const session = await getServerSession(authOptions);
    const role = (session as any)?.user?.role;

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (role === "STUDENT") {
      return NextResponse.json({ error: "Forbidden: Students cannot verify records" }, { status: 403 });
    }

    const actor = await prisma.user.findUnique({ where: { email: session.user.email! }, include: { profile: true } });
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.profile.findUnique({
      where: { studentId },
      include: { cohorts: true, user: true }
    });

    if (!profile) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // --- ACCESS CONTROL ---
    if (role === "TEACHER") {
      const teacherUser = await prisma.user.findUnique({
        where: { id: actor.id },
        include: { cohortsLed: true }
      });
      const teacherCohortIds = teacherUser?.cohortsLed.map(c => c.id) || [];
      const studentCohortIds = profile.cohorts.map(c => c.id) || [];
      const hasAccess = studentCohortIds.some(id => teacherCohortIds.includes(id));

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied: Cannot verify students outside your cohort" }, { status: 403 });
      }
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsedBody = VerifySchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid verification payload" }, { status: 400 });
    }
    const { target, status, recordId } = parsedBody.data;

    if (target === 'careerTrack') {
      if (!recordId) return NextResponse.json({ error: "Missing recordId for careerTrack verification" }, { status: 400 });
      // Scope the update to this student's profile so a recordId belonging
      // to another student cannot be verified through this route (IDOR).
      if (status === "REMOVED") {
        const deleted = await prisma.careerRecord.deleteMany({
          where: { id: recordId, profileId: profile.id }
        });
        if (deleted.count === 0) {
          return NextResponse.json({ error: "Record not found for this student" }, { status: 404 });
        }
      } else {
        const updated = await prisma.careerRecord.updateMany({
          where: { id: recordId, profileId: profile.id },
          data: { verification: status }
        });
        if (updated.count === 0) {
          return NextResponse.json({ error: "Record not found for this student" }, { status: 404 });
        }
      }
    } else {
      // Need to parse existing JSON string and update status
      const currentValue = profile[target as keyof typeof profile] as string | null;
      if (currentValue) {
        try {
          if (status === "REMOVED") {
            await prisma.profile.update({
              where: { studentId },
              data: { [target]: null }
            });
          } else {
            const parsed = JSON.parse(currentValue);
            parsed.status = status;
            await prisma.profile.update({
              where: { studentId },
              data: { [target]: JSON.stringify(parsed) }
            });
          }
        } catch (e) {
          return NextResponse.json({ error: `Failed to parse existing ${target} JSON` }, { status: 500 });
        }
      }
    }

    // --- AUDIT LOGGING ---
    await prisma.recordAuditLog.create({
      data: {
        profileId: profile.id,
        actorId: actor.id,
        action: "VERIFY",
        field: target,
        newValue: status
      }
    });

    // --- NOTIFICATIONS ---
    // Notify the student
    if (profile.userId) {
      await prisma.notification.create({
        data: {
          recipientId: profile.userId,
          profileId: profile.id,
          message: `Your ${target} record was marked as ${status} by ${actor.name || 'Admin'}.`,
          actionUrl: `/router?role=STUDENT`
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
