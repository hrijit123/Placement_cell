import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ cohortId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cohortId } = await params;

    const cohort = await prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        students: {
          select: { id: true }
        }
      }
    });

    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }

    return NextResponse.json(cohort.students);
  } catch (error) {
    console.error("Failed to fetch cohort students:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ cohortId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cohortId } = await params;
    const { profileIds } = await req.json();

    if (!Array.isArray(profileIds)) {
      return NextResponse.json({ error: "Invalid profileIds array" }, { status: 400 });
    }

    const updatedCohort = await prisma.cohort.update({
      where: { id: cohortId },
      data: {
        students: {
          set: profileIds.map((id: string) => ({ id }))
        }
      },
      include: {
        _count: { select: { students: true } }
      }
    });

    return NextResponse.json(updatedCohort);
  } catch (error) {
    console.error("Failed to update cohort students:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
