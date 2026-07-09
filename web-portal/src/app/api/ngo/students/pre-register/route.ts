import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const PreRegisterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  className: z.string().optional(),
  vocation: z.string().optional(),
  disabilityInfo: z.string().optional(),
  expectedSalary: z.string().optional(),
  cohortId: z.string().optional(),
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

    const studentId = `STU-${Math.floor(10000 + Math.random() * 90000)}`;

    let cohortConnect = {};
    if (data.cohortId) {
      cohortConnect = {
        cohorts: {
          connect: [{ id: data.cohortId }]
        }
      };
    } else if (role === "TEACHER") {
      // Fallback: If no cohort is selected, but they are a teacher, assign to all their cohorts (or first one)
      const dbUser = await prisma.user.findUnique({ where: { email: session.user?.email || "" } });
      if (dbUser) {
        const teacherCohorts = await prisma.cohort.findMany({ where: { teacherId: dbUser.id } });
        if (teacherCohorts.length > 0) {
          cohortConnect = {
            cohorts: {
              connect: [{ id: teacherCohorts[0].id }]
            }
          };
        }
      }
    }

    const profile = await prisma.profile.create({
      data: {
        name: data.name,
        studentId: studentId,
        phone: data.phone || null,
        className: data.className || null,
        vocation: data.vocation || null,
        disabilityInfo: data.disabilityInfo || null,
        expectedSalary: data.expectedSalary || null,
        ...cohortConnect,
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error("Pre-register error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
