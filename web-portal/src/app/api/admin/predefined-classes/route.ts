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

    const classes = await prisma.predefinedClass.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Failed to fetch predefined classes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Class name is required" }, { status: 400 });
    }

    const newClass = await prisma.predefinedClass.create({
      data: { name: name.trim() }
    });

    return NextResponse.json(newClass);
  } catch (error: any) {
    console.error("Failed to create predefined class:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Class name already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
