import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const BulkUpdateSchema = z.object({
  academicYear: z.string().regex(/^\d{4}-\d{2}$/, "Use format 2026-27"),
  subject: z.string().min(1),
  examName: z.string().min(1),
  maxMarks: z.number().positive(),
  updates: z.array(z.object({
    profileId: z.string(),
    mark: z.number().min(0).nullable()
  }))
});

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const viewer = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { cohortsLed: true }
    });

    if (!viewer || (viewer.role !== "ADMIN" && viewer.role !== "TEACHER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = BulkUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { academicYear, subject, examName, maxMarks, updates } = parsed.data;

    const teacherCohortIds = viewer.cohortsLed.map(c => c.id);

    // Process updates concurrently
    await Promise.all(updates.map(async ({ profileId, mark }) => {
      // Security Check: If teacher, verify they have access to this student's profile.
      if (viewer.role === "TEACHER") {
        const hasAccess = await prisma.profile.count({
          where: {
            id: profileId,
            cohorts: { some: { id: { in: teacherCohortIds } } }
          }
        });
        if (hasAccess === 0) return; // Skip if no access
      }

      await prisma.examRecord.upsert({
        where: {
          profileId_academicYear_subject_examName: {
            profileId,
            academicYear,
            subject,
            examName
          }
        },
        create: {
          profileId,
          academicYear,
          subject,
          examName,
          marks: mark,
          maxMarks
        },
        update: {
          marks: mark,
          maxMarks
        }
      });
    }));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Bulk Report Card Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
