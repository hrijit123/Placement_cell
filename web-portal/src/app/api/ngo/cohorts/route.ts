import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const email = session?.user?.email;

  if (!session || (role !== "ADMIN" && role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let cohorts;

  if (role === "ADMIN") {
    cohorts = await prisma.cohort.findMany({
      orderBy: { createdAt: "desc" },
    });
  } else {
    const dbUser = await prisma.user.findUnique({ where: { email: email || "" } });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    cohorts = await prisma.cohort.findMany({
      where: { teacherId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json(cohorts);
}
