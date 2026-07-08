import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    include: {
      teacherProfile: true,
      cohortsLed: true
    },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json(teachers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { userId, ...profileData } = data;

    if (!userId) {
      return NextResponse.json({ error: "Missing teacher userId" }, { status: 400 });
    }

    // Convert dates if present
    if (profileData.dob) profileData.dob = new Date(profileData.dob);
    if (profileData.joiningDate) profileData.joiningDate = new Date(profileData.joiningDate);
    if (profileData.probationCompletionDate) profileData.probationCompletionDate = new Date(profileData.probationCompletionDate);
    if (profileData.salary) profileData.salary = parseFloat(profileData.salary);

    const profile = await prisma.teacherProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData
      }
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to update teacher profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
