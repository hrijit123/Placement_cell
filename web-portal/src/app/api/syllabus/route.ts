import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SyllabusSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM"),
  className: z.string().min(1).max(100),
  subject: z.string().min(1).max(100),
  topics: z.array(z.object({
    title: z.string().min(1).max(200),
    status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"])
  }))
});

async function getViewer() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });
}

export async function GET(req: Request) {
  try {
    const viewer = await getViewer();
    if (!viewer || viewer.status !== "ACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // optional YYYY-MM filter

    const baseWhere = month && /^\d{4}-\d{2}$/.test(month) ? { month } : {};

    let where;
    if (viewer.role === "ADMIN") {
      where = baseWhere; // admins see everything
    } else if (viewer.role === "TEACHER") {
      where = { ...baseWhere, teacherId: viewer.id };
    } else if (viewer.role === "STUDENT") {
      const className = viewer.profile?.className;
      if (!className) return NextResponse.json({ plans: [], noClass: true });
      where = { ...baseWhere, className };
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const plans = await prisma.syllabusPlan.findMany({
      where,
      orderBy: [{ month: "desc" }, { className: "asc" }, { subject: "asc" }],
      include: { teacher: { select: { name: true, email: true } } },
    });

    return NextResponse.json({ plans, role: viewer.role });
  } catch (error) {
    console.error("Failed to fetch syllabus plans:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const viewer = await getViewer();
    if (!viewer || viewer.status !== "ACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (viewer.role !== "TEACHER" && viewer.role !== "ADMIN") {
      return NextResponse.json({ error: "Only teachers can update the syllabus" }, { status: 403 });
    }

    const parsed = SyllabusSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid syllabus payload" }, { status: 400 });
    }
    const { month, className, subject, topics } = parsed.data;
    const topicsJson = JSON.stringify(topics);

    const plan = await prisma.syllabusPlan.upsert({
      where: {
        teacherId_month_className_subject: {
          teacherId: viewer.id,
          month,
          className,
          subject,
        },
      },
      create: { teacherId: viewer.id, month, className, subject, topics: topicsJson },
      update: { topics: topicsJson },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Failed to save syllabus plan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const viewer = await getViewer();
    if (!viewer || viewer.status !== "ACTIVE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing plan id" }, { status: 400 });

    // Teachers can delete only their own plans; admins can delete any.
    const where = viewer.role === "ADMIN" ? { id } : { id, teacherId: viewer.id };
    const deleted = await prisma.syllabusPlan.deleteMany({ where });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete syllabus plan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
