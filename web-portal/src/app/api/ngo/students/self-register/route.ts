import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const providedName = body.name || null;

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

    const existingProfile = await prisma.profile.findUnique({
      where: { userId: user.id }
    });

    if (existingProfile) {
      return NextResponse.json({ error: "You already have a profile." }, { status: 400 });
    }

    // Generate unique ID
    let newId = "STU-" + Math.floor(10000 + Math.random() * 90000);
    while (await prisma.profile.findUnique({ where: { studentId: newId } })) {
      newId = "STU-" + Math.floor(10000 + Math.random() * 90000);
    }

    // If they provided a custom name that differs from their google name, we should probably update their user name too
    if (providedName && providedName !== user.name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: providedName }
      });
    }

    const finalName = providedName || user.name || "New Student";

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        studentId: newId,
        name: finalName,
      }
    });

    // Notify ALL Admins that a student self-registered and is unassigned
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          recipientId: admin.id,
          profileId: profile.id,
          message: "New student (ID: ) self-registered. They are currently unassigned to any cohort.",
          actionUrl: "/database/"
        }
      });
    }

    return NextResponse.json({ success: true, studentId: profile.studentId });
  } catch (error) {
    console.error("Error self registering student:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
