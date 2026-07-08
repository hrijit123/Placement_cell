import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let syllabi;
  if (role === "ADMIN") {
    syllabi = await prisma.syllabusTracker.findMany({
      include: { cohort: true, teacher: true },
      orderBy: { createdAt: 'desc' }
    });
  } else {
    syllabi = await prisma.syllabusTracker.findMany({
      where: { teacherId: user.id },
      include: { cohort: true, teacher: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  return NextResponse.json(syllabi);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { cohortId, month, targetChapters, completedChapters, pendingChapters } = await req.json();

    const syllabus = await prisma.syllabusTracker.create({
      data: {
        cohortId,
        teacherId: user.id,
        month,
        targetChapters,
        completedChapters,
        pendingChapters
      }
    });

    return NextResponse.json(syllabus);
  } catch (error) {
    console.error("Failed to create syllabus:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
