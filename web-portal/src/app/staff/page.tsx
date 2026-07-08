import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function StaffDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role;
  
  if (!session || (role !== "ADMIN" && role !== "TEACHER")) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-serif text-[#2C241B] font-semibold tracking-tight mb-2">Staff Portal</h1>
        <p className="text-[#6B5E4C] mb-12">Welcome back, {session.user?.name}. Please select a module.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Attendance Sheet */}
          <Link href="/attendance" className="group bg-white border border-[#E1D8C9] rounded-xl p-10 flex flex-col items-center text-center shadow-sm hover:shadow-xl hover:border-[#2D4A22] transition-all duration-300">
            <div className="w-24 h-24 bg-[#FAF8F3] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#2D4A22] group-hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
              </svg>
            </div>
            <h2 className="text-3xl font-serif font-semibold text-[#2C241B] mb-4">Attendance Sheet</h2>
            <p className="text-[#6B5E4C]">View and mark daily attendance for students across various NGO cohorts.</p>
          </Link>

          {/* Database */}
          <Link href="/database" className="group bg-white border border-[#E1D8C9] rounded-xl p-10 flex flex-col items-center text-center shadow-sm hover:shadow-xl hover:border-[#2C241B] transition-all duration-300">
            <div className="w-24 h-24 bg-[#FAF8F3] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#2C241B] group-hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.926 1.875-2.25 2.15M3.75 14.15v4.25c0 1.094.926 1.875 2.25 2.15m14.25-9.4v4.25c0 1.094-.926 1.875-2.25 2.15M3.75 8.9v4.25c0 1.094.926 1.875 2.25 2.15m14.25-9.4v4.25c0 1.094-.926 1.875-2.25 2.15M3.75 3.65v4.25c0 1.094.926 1.875 2.25 2.15M12 21c-3.18 0-6.195-.472-8.25-1.308M12 21c3.18 0 6.195-.472 8.25-1.308M12 21c3.18 0 6.195-.472 8.25-1.308" />
              </svg>
            </div>
            <h2 className="text-3xl font-serif font-semibold text-[#2C241B] mb-4">Student Database</h2>
            <p className="text-[#6B5E4C]">Search by ID to view transcripts and update the placement & interview tracker.</p>
          </Link>

          {/* Syllabus Tracker */}
          <Link href="/syllabus" className="group bg-white border border-[#E1D8C9] rounded-xl p-10 flex flex-col items-center text-center shadow-sm hover:shadow-xl hover:border-[#8B7D6B] transition-all duration-300">
            <div className="w-24 h-24 bg-[#FAF8F3] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#8B7D6B] group-hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h2 className="text-3xl font-serif font-semibold text-[#2C241B] mb-4">Syllabus Tracker</h2>
            <p className="text-[#6B5E4C]">Record monthly target, completed, and pending chapters per class and subject.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
