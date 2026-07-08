import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cohorts = await prisma.cohort.findMany({
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      _count: { select: { students: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(cohorts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, teacherId } = await req.json();

    if (!name || !teacherId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cohort = await prisma.cohort.create({
      data: {
        name,
        description,
        teacherId
      }
    });

    return NextResponse.json(cohort);
  } catch (error) {
    console.error("Failed to create cohort:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
