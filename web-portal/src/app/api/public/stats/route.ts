import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalStudents, eligibleStudents, allCareers] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { isEligibleForPlacement: true } }),
      prisma.careerRecord.findMany({ where: { recordType: "PLACEMENT", placementStatus: "WORKING" } })
    ]);

    const placedStudents = new Set(allCareers.map(c => c.profileId)).size;
    const placementRate = eligibleStudents > 0 ? ((placedStudents / eligibleStudents) * 100).toFixed(1) : "0.0";
    const activeEmployers = new Set(allCareers.map(c => c.company)).size;

    const upcomingInterviews = await prisma.careerRecord.count({
      where: {
        recordType: "INTERVIEW",
        interviewStatus: "SCHEDULED"
      }
    });

    return NextResponse.json({
      totalStudents,
      eligibleStudents,
      placedStudents,
      placementRate,
      activeEmployers,
      upcomingInterviews
    });
  } catch (err) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
