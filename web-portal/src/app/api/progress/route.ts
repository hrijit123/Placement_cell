import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { profileId, month, academicPerformance, behavioralNotes } = await req.json();

    const report = await prisma.studentProgressReport.create({
      data: {
        profileId,
        teacherId: user.id,
        month,
        academicPerformance,
        behavioralNotes
      }
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to create progress report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
