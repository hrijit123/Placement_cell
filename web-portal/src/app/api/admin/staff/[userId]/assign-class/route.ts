import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const { className } = await req.json();

    if (!className || typeof className !== "string") {
      return NextResponse.json({ error: "Class name is required" }, { status: 400 });
    }

    // Find existing staff record to append to, or create one if it doesn't exist
    const staffRecord = await prisma.staffRecord.findUnique({
      where: { userId }
    });

    let updatedClasses = className;
    if (staffRecord && staffRecord.classesTaking) {
      const existing = staffRecord.classesTaking.split(',').map(c => c.trim()).filter(Boolean);
      if (!existing.includes(className)) {
        existing.push(className);
        updatedClasses = existing.join(', ');
      } else {
        updatedClasses = staffRecord.classesTaking; // already has it
      }
    }

    const updated = await prisma.staffRecord.upsert({
      where: { userId },
      update: { classesTaking: updatedClasses },
      create: {
        userId,
        classesTaking: updatedClasses
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to assign class to staff:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
