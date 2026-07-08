import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AttendanceSchema = z.object({
  userId: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "LEAVE"]),
  classOrEvent: z.string().max(300).optional().nullable(),
  notes: z.string().optional().nullable(),
});

// GET /api/attendance?month=YYYY-MM — staff-only monthly report:
// per-student counts for the month plus overall totals.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role;

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (role !== "ADMIN" && role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Month must be YYYY-MM" }, { status: 400 });
  }

  const [y, m] = month.split("-").map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 1);

  const records = await prisma.attendance.findMany({
    where: { date: { gte: from, lt: to } },
    include: { user: { select: { id: true, name: true, profile: { select: { studentId: true } } } } },
    orderBy: { date: "asc" },
  });

  type Row = {
    userId: string;
    name: string;
    studentId: string | null;
    PRESENT: number;
    ABSENT: number;
    LATE: number;
    LEAVE: number;
    total: number;
  };
  const byStudent = new Map<string, Row>();
  const totals = { PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0, total: 0 };

  for (const r of records) {
    let row = byStudent.get(r.userId);
    if (!row) {
      row = {
        userId: r.userId,
        name: r.user.name || "Unknown",
        studentId: r.user.profile?.studentId || null,
        PRESENT: 0, ABSENT: 0, LATE: 0, LEAVE: 0, total: 0,
      };
      byStudent.set(r.userId, row);
    }
    row[r.status] += 1;
    row.total += 1;
    totals[r.status] += 1;
    totals.total += 1;
  }

  // Attendance % counts Present + Late as attended; Leave is excluded
  // from the denominator (an approved absence, not a missed day).
  const rows = [...byStudent.values()]
    .map((r) => {
      const denominator = r.total - r.LEAVE;
      return {
        ...r,
        percentage: denominator > 0 ? Math.round(((r.PRESENT + r.LATE) / denominator) * 1000) / 10 : null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const overallDenominator = totals.total - totals.LEAVE;
  return NextResponse.json({
    month,
    rows,
    totals: {
      ...totals,
      percentage:
        overallDenominator > 0
          ? Math.round(((totals.PRESENT + totals.LATE) / overallDenominator) * 1000) / 10
          : null,
    },
  });
}

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
