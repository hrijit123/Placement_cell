import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AttendanceClient from "./AttendanceClient";
import Link from "next/link";

export default async function AttendancePage() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role;
  
  if (!session || (role !== "ADMIN" && role !== "TEACHER")) {
    redirect("/");
  }

  // Fetch students based on role
  let students;
  
  if (role === "ADMIN") {
    students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      include: {
        profile: true,
        attendance: {
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: { name: 'asc' }
    });
  } else {
    // TEACHER role: only fetch students in their cohorts
    const teacherUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { cohortsLed: true }
    });
    
    const cohortIds = teacherUser?.cohortsLed.map(c => c.id) || [];
    
    students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        profile: {
          cohorts: {
            some: {
              id: { in: cohortIds }
            }
          }
        }
      },
      include: {
        profile: true,
        attendance: {
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-serif text-[#2C241B] font-semibold tracking-tight">Attendance System</h1>
            <p className="text-[#6B5E4C]">View and mark attendance records for students.</p>
          </div>
          <Link href="/staff" className="px-4 py-2 border border-[#E1D8C9] rounded text-[#6B5E4C] hover:bg-[#FAF8F3]">
            Back to Portal
          </Link>
        </div>
        
        <AttendanceClient initialStudents={students} />
      </div>
    </div>
  );
}
