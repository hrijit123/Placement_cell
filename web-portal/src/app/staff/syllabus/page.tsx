import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SyllabusClient from "./SyllabusClient";
import Link from "next/link";

export default async function SyllabusPage() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role;
  
  if (!session || (role !== "ADMIN" && role !== "TEACHER")) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({ 
    where: { email: session.user?.email! },
    include: { cohortsLed: true }
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-serif text-[#2C241B] font-semibold tracking-tight">Syllabus Tracker</h1>
            <p className="text-[#6B5E4C]">Log and monitor monthly academic progress.</p>
          </div>
          <Link href="/staff" className="px-4 py-2 border border-[#E1D8C9] rounded text-[#6B5E4C] hover:bg-[#FAF8F3]">
            Back to Portal
          </Link>
        </div>
        
        <SyllabusClient role={role} cohorts={user?.cohortsLed || []} />
      </div>
    </div>
  );
}
