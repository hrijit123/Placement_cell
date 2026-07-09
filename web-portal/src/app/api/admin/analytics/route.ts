import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role;

  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const totalStudents = await prisma.profile.count();
    const activeStudents = await prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } });
    
    const allAttendance = await prisma.attendance.findMany();
    const presentCount = allAttendance.filter(a => a.status === "PRESENT").length;
    const attendancePct = allAttendance.length ? ((presentCount / allAttendance.length) * 100).toFixed(1) : 0;

    const eligibleStudents = await prisma.profile.count({ where: { isEligibleForPlacement: true } });
    
    const allCareers = await prisma.careerRecord.findMany({ where: { verification: "VERIFIED" } });
    const placedStudents = new Set(allCareers.filter(c => c.recordType === "PLACEMENT" && c.placementStatus === "WORKING").map(c => c.profileId)).size;
    
    const activeEmployers = new Set(allCareers.map(c => c.company)).size;

    const alumniByYearRaw = allCareers.filter(c => c.recordType === "PLACEMENT" && c.placementStatus === "WORKING" && c.startDate);
    
    const alumniByYear = alumniByYearRaw.reduce((acc: any, curr) => {
      const year = new Date(curr.startDate!).getFullYear();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});

    const alumniYearList = Object.keys(alumniByYear).map(year => ({
      year,
      count: alumniByYear[year]
    })).sort((a, b) => Number(b.year) - Number(a.year));

    return NextResponse.json({
      totalStudents,
      activeStudents,
      attendancePct,
      eligibleStudents,
      placedStudents,
      activeEmployers,
      alumniByYear: alumniYearList
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
