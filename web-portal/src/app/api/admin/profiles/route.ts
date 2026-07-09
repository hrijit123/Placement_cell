import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profiles = await prisma.profile.findMany({
      where: {
        user: { role: "STUDENT" }
      },
      select: {
        id: true,
        studentId: true,
        className: true,
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        user: { name: 'asc' }
      }
    });

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Failed to fetch student profiles:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
