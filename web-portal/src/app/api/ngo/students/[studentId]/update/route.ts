import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role;

  if (!session || (role !== "ADMIN" && role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();

  const profile = await prisma.profile.findUnique({
    where: { studentId }
  });

  if (!profile) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Teacher restriction check
  if (role === "TEACHER") {
    const teacherEmail = session.user?.email!;
    const teacherUser = await prisma.user.findUnique({
      where: { email: teacherEmail },
      include: { cohortsLed: true }
    });
    const studentProfile = await prisma.profile.findUnique({
      where: { studentId },
      include: { cohorts: true }
    });
    
    const teacherCohortIds = teacherUser?.cohortsLed.map(c => c.id) || [];
    const studentCohortIds = studentProfile?.cohorts.map(c => c.id) || [];
    const hasAccess = studentCohortIds.some(id => teacherCohortIds.includes(id));

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  // Update profile
  await prisma.profile.update({
    where: { studentId },
    data: {
      headline: data.headline,
      address: data.address,
      languages: data.languages,
      hobbies: data.hobbies,
      vocation: data.vocation,
      disabilityInfo: data.disabilityInfo,
      skills: data.skills,
      education: data.education,
      experience: data.experience,
      courseworks: data.courseworks,
      internships: data.internships,
      certifications: data.certifications,
      expectedSalary: data.expectedSalary,
      availability: data.availability,
    }
  });

  // Log access
  await prisma.dossierAccessLog.create({
    data: {
      viewerId: (await prisma.user.findUnique({ where: { email: session.user?.email! } }))!.id,
      studentId: studentId,
      reason: "Updated transcripts/information via Database form."
    }
  });

  return NextResponse.json({ success: true });
}
