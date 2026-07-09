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
  examName: z.string().min(1).max(100),
  marks: mark,
  maxMarks: z.preprocess((v) => (v === "" || v == null ? 100 : Number(v)), z.number().positive()),
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

  return { viewer, profile, canEdit: true }; // Admin
}

export async function GET(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const auth = await authorize(studentId);
    if (auth instanceof NextResponse) return auth;
    const { profile, canEdit } = auth;

    const records = await prisma.examRecord.findMany({
      where: { profileId: profile.id },
      orderBy: [
        { academicYear: "desc" },
        { subject: "asc" },
        { examName: "asc" }
      ],
    });

    return NextResponse.json({ records, canEdit });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const auth = await authorize(studentId);
    if (auth instanceof NextResponse) return auth;
    const { profile, canEdit } = auth;

    if (!canEdit) {
      return NextResponse.json({ error: "You are not authorized to edit marks" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = ExamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;

    const record = await prisma.examRecord.upsert({
      where: {
        profileId_academicYear_subject_examName: {
          profileId: profile.id,
          academicYear: data.academicYear,
          subject: data.subject,
          examName: data.examName
        }
      },
      create: {
        profileId: profile.id,
        academicYear: data.academicYear,
        subject: data.subject,
        examName: data.examName,
        marks: data.marks,
        maxMarks: data.maxMarks,
      },
      update: {
        marks: data.marks,
        maxMarks: data.maxMarks,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const auth = await authorize(studentId);
    if (auth instanceof NextResponse) return auth;
    const { canEdit } = auth;

    if (!canEdit) {
      return NextResponse.json({ error: "You are not authorized to delete marks" }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing record ID" }, { status: 400 });

    await prisma.examRecord.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
