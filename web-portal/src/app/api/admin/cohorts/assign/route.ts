import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { profileId, cohortId } = await req.json();

    if (!profileId || !cohortId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: profileId },
      data: {
        cohorts: {
          connect: { id: cohortId }
        }
      }
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error("Failed to assign cohort:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
