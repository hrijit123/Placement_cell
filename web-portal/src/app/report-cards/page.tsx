import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ReportCardsClient from "./ReportCardsClient";
import Link from "next/link";

export default async function ReportCardsPage() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role;
  
  if (!session || (role !== "ADMIN" && role !== "TEACHER")) {
    redirect("/");
  }

  let students;
  
  if (role === "ADMIN") {
    students = await prisma.profile.findMany({
      include: {
        user: true,
        cohorts: true,
        examRecords: { orderBy: { createdAt: 'desc' } },
        careerTrack: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { name: 'asc' }
    });
  } else {
    const teacherUser = await prisma.user.findUnique({
      where: { email: session?.user?.email! },
      include: { cohortsLed: true }
    });
    
    const cohortIds = teacherUser?.cohortsLed.map((c: any) => c.id) || [];
    
    students = await prisma.profile.findMany({
      where: {
        cohorts: { some: { id: { in: cohortIds } } }
      },
      include: {
        user: true,
        cohorts: true,
        examRecords: { orderBy: { createdAt: 'desc' } },
        careerTrack: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { name: 'asc' }
    });
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-serif text-[#2C241B] font-semibold tracking-tight">Bulk Report Cards</h1>
            <p className="text-[#6B5E4C]">Enter and update marks for multiple students in your cohorts.</p>
          </div>
          <Link href="/staff" className="px-4 py-2 border border-[#E1D8C9] rounded text-[#6B5E4C] hover:bg-[#FAF8F3]">
            Back to Portal
          </Link>
        </div>
        
        {/* We map `examRecords` explicitly because the type needs to match `StudentData` expected in client */}
        <ReportCardsClient initialStudents={students.map((s: any) => ({
          id: s.user?.id || s.id, // User ID if exists, fallback to profile ID
          name: s.name || s.user?.name || '',
          email: s.user?.email || '',
          profile: {
            id: s.id,
            studentId: s.studentId || '',
            cohorts: s.cohorts?.map((c: any) => ({ name: c.name })) || []
          },
          examRecords: s.examRecords || []
        }))} />
      </div>
    </div>
  );
}
