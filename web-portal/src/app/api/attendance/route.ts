import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AttendanceSchema = z.object({
  userId: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "LATE"]),
  classOrEvent: z.string().max(300).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role !== "ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsedBody = AttendanceSchema.safeParse(await req.json());
  if (!parsedBody.success) {
    return NextResponse.json({ error: "Invalid attendance payload" }, { status: 400 });
  }
  const { userId, date, status, classOrEvent, notes } = parsedBody.data as any; // notes added from HEAD

  // --- ACCESS CONTROL ---
  if (role === "TEACHER") {
    const actor = await prisma.user.findUnique({
      where: { email: session?.user?.email! },
      include: { cohortsLed: true }
    });
    
    const targetStudentProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { cohorts: true }
    });
    
    if (!targetStudentProfile) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const teacherCohortIds = actor?.cohortsLed.map(c => c.id) || [];
    const studentCohortIds = targetStudentProfile.cohorts.map(c => c.id) || [];
    const hasAccess = studentCohortIds.some(id => teacherCohortIds.includes(id));

    if (!hasAccess) {
      return NextResponse.json({ error: "Cannot mark attendance for students outside your cohort." }, { status: 403 });
    }
  }
  const attendance = await prisma.attendance.create({
    data: {
      userId,
      date: new Date(date),
      status,
      classOrEvent,
      notes
    }
  });

  return NextResponse.json(attendance);
}
