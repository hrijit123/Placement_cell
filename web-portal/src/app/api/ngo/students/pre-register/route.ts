import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PreRegisterSchema = z.object({
  names: z.array(z.string().min(1, "Name is required")).min(1, "At least one name is required"),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;

    if (!session || (role !== "ADMIN" && role !== "TEACHER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const data = PreRegisterSchema.parse(body);

    let cohortConnect = {};
    if (role === "TEACHER") {
      const dbUser = await prisma.user.findUnique({ where: { email: session.user?.email || "" } });
      if (dbUser) {
        const teacherCohorts = await prisma.cohort.findMany({ where: { teacherId: dbUser.id } });
        if (teacherCohorts.length > 0) {
          cohortConnect = {
            cohorts: {
              connect: teacherCohorts.map(c => ({ id: c.id }))
            }
          };
        }
      }
    }

    const createdProfiles = await prisma.$transaction(
      data.names.map((name) => {
        const studentId = `STU-${Math.floor(10000 + Math.random() * 90000)}`;
        return prisma.profile.create({
          data: {
            name,
            studentId,
            ...cohortConnect,
          },
        });
      })
    );

    return NextResponse.json(createdProfiles, { status: 201 });
  } catch (error) {
    console.error("Pre-register error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
