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

  const { type, ...data } = await req.json();

  const profile = await prisma.profile.findUnique({
    where: { studentId }
  });

  if (!profile) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  if (type === "CAREER") {
    await prisma.careerPlacement.create({
      data: {
        userId: profile.userId,
        company: data.company,
        role: data.role,
        salary: data.salary ? parseFloat(data.salary) : null,
        startDate: new Date(data.startDate),
        status: data.status,
        nextMove: data.nextMove || null
      }
    });
  }

  if (type === "INTERVIEW") {
    // We would need to link to a Job, but since staff is manually inputting, 
    // maybe we just create a dummy Job or we have a custom table. 
    // For simplicity, we can create a dummy job if it doesn't exist, or just rely on careerPlacement.
    // The user's tracker specifically said "interviews sat in or reject, company they choose... career they make move".
    // We can just log everything as career placement records or interview tracking.
    // Let's create a dummy job for the application record.
    const job = await prisma.job.create({
      data: {
        title: data.role,
        company: data.company,
        description: "Manual Tracker Entry",
        location: "N/A",
        recruiterId: (await prisma.user.findFirst({ where: { role: "ADMIN" } }))!.id,
      }
    });

    await prisma.jobApplication.create({
      data: {
        studentId: profile.userId,
        jobId: job.id,
        status: data.status,
        offeredSalary: data.salary ? parseFloat(data.salary) : null,
        rejectionReason: data.rejectionReason || null
      }
    });
  }

  return NextResponse.json({ success: true });
}
