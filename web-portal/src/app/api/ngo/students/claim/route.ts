import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { pin } = await req.json();
    if (!pin) {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    let searchPin = pin.trim();
    if (/^\d+$/.test(searchPin)) {
      searchPin = "STU-" + searchPin;
    }

    const unclaimed = await prisma.profile.findUnique({
      where: { studentId: searchPin }
    });

    if (!unclaimed) {
      return NextResponse.json({ error: "Invalid Student PIN" }, { status: 400 });
    }
    
    if (unclaimed.userId) {
      return NextResponse.json({ error: "This Student ID is already claimed by another account." }, { status: 400 });
    }

    const profile = await prisma.profile.update({
      where: { id: unclaimed.id },
      data: { userId: user.id }
    });

    return NextResponse.json({ success: true, studentId: profile.studentId });
  } catch (error) {
    console.error("Error claiming student PIN:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
