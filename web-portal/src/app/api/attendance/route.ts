import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role;

  if (!session || (role !== "ADMIN" && role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, date, status, classOrEvent } = await req.json();

  if (!userId || !date || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const attendance = await prisma.attendance.create({
    data: {
      userId,
      date: new Date(date),
      status,
      classOrEvent
    }
  });

  return NextResponse.json(attendance);
}
