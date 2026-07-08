import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const mark = z.preprocess(
  (v) => (v === "" || v == null ? null : Number(v)),
  z.number().min(0).nullable()
);

const ExamSchema = z.object({
  academicYear: z.string().regex(/^\d{4}-\d{2}$/, "Use format 2026-27"),
  subject: z.string().min(1).max(100),
  ia1: mark,
  ia2: mark,
  ia3: mark,
  ia4: mark,
  sem1: mark,
  sem2: mark,
  iaMax: z.preprocess((v) => (v === "" || v == null ? 25 : Number(v)), z.number().positive()),
  semMax: z.preprocess((v) => (v === "" || v == null ? 100 : Number(v)), z.number().positive()),
});

// Returns { viewer, profile, canEdit } or a NextResponse error.
async function authorize(studentId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const viewer = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true, cohortsLed: true },
  });
  if (!viewer || viewer.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { studentId },
    include: { cohorts: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  if (viewer.role === "STUDENT") {
    if (viewer.profile?.studentId !== studentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return { viewer, profile, canEdit: false };
  }
  if (viewer.role === "TEACHER") {
    const teacherCohortIds = viewer.cohortsLed.map((c) => c.id);
    const hasAccess = profile.cohorts.some((c) => teacherCohortIds.includes(c.id));
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied: student is outside your cohort" }, { status: 403 });
    }
    return { viewer, profile, canEdit: true };
  }
  if (viewer.role === "ADMIN") {
    return { viewer, profile, canEdit: true };
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const auth = await authorize(studentId);
    if (auth instanceof NextResponse) return auth;

    const records = await prisma.examRecord.findMany({
      where: { profileId: auth.profile.id },
      orderBy: [{ academicYear: "desc" }, { subject: "asc" }],
    });

    return NextResponse.json({ records, canEdit: auth.canEdit });
  } catch (error) {
    console.error("Failed to fetch exam records:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const auth = await authorize(studentId);
    if (auth instanceof NextResponse) return auth;
    if (!auth.canEdit) {
      return NextResponse.json({ error: "Students cannot edit marks" }, { status: 403 });
    }

    const parsed = ExamSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid exam payload" }, { status: 400 });
    }
    const { academicYear, subject, iaMax, semMax, ...marks } = parsed.data;

    // Marks cannot exceed their maximums.
    for (const key of ["ia1", "ia2", "ia3", "ia4"] as const) {
      if (marks[key] != null && marks[key]! > iaMax) {
        return NextResponse.json({ error: `${key.toUpperCase()} exceeds max marks (${iaMax})` }, { status: 400 });
      }
    }
    for (const key of ["sem1", "sem2"] as const) {
      if (marks[key] != null && marks[key]! > semMax) {
        return NextResponse.json({ error: `${key.toUpperCase()} exceeds max marks (${semMax})` }, { status: 400 });
      }
    }

    const record = await prisma.examRecord.upsert({
      where: {
        profileId_academicYear_subject: {
          profileId: auth.profile.id,
          academicYear,
          subject,
        },
      },
      create: { profileId: auth.profile.id, academicYear, subject, iaMax, semMax, ...marks },
      update: { iaMax, semMax, ...marks },
    });

    await prisma.recordAuditLog.create({
      data: {
        profileId: auth.profile.id,
        actorId: auth.viewer.id,
        action: "UPDATE",
        field: `Exam marks: ${subject} (${academicYear})`,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Failed to save exam record:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const auth = await authorize(studentId);
    if (auth instanceof NextResponse) return auth;
    if (!auth.canEdit) {
      return NextResponse.json({ error: "Students cannot delete marks" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing record id" }, { status: 400 });

    const deleted = await prisma.examRecord.deleteMany({
      where: { id, profileId: auth.profile.id },
    });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Record not found for this student" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete exam record:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
