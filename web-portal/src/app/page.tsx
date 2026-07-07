"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">Loading...</div>;
  }

  const handleDashboardRedirect = () => {
    const role = (session as any)?.user?.role;
    if (role === "STUDENT") router.push("/router?role=STUDENT");
    else if (role === "TEACHER") router.push("/staff");
    else if (role === "ADMIN") router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] font-sans selection:bg-[#2D4A22] selection:text-white flex flex-col items-center justify-center p-6">
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-7xl font-serif text-[#2C241B] font-semibold tracking-tight mb-4">Placement Tracker</h1>
        <p className="text-xl text-[#6B5E4C]">Empowering Specially Abled</p>
      </div>

      {session ? (
        <div className="flex flex-col items-center space-y-6">
          <p className="text-lg text-[#6B5E4C]">Welcome back, {session.user?.name}!</p>
          <button 
            onClick={handleDashboardRedirect}
            className="px-8 py-4 bg-[#2D4A22] text-white rounded-full font-semibold hover:bg-[#1f3418] transition-colors shadow-sm text-lg"
          >
            Go to My Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {/* Admin Login */}
          <div 
            onClick={() => signIn("google", { callbackUrl: "/router?role=ADMIN" })}
            className="group cursor-pointer bg-white border border-[#E1D8C9] rounded-xl p-10 flex flex-col items-center text-center shadow-sm hover:shadow-xl hover:border-[#2D4A22] transition-all duration-300"
          >
            <div className="w-20 h-20 bg-[#FAF8F3] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#2D4A22] group-hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-semibold text-[#2C241B] mb-2">Admin Portal</h2>
            <p className="text-[#6B5E4C] text-sm">Manage NGO placement records, global attendance, and system settings.</p>
          </div>

          {/* Teacher Login */}
          <div 
            onClick={() => signIn("google", { callbackUrl: "/router?role=TEACHER" })}
            className="group cursor-pointer bg-white border border-[#E1D8C9] rounded-xl p-10 flex flex-col items-center text-center shadow-sm hover:shadow-xl hover:border-[#2C241B] transition-all duration-300"
          >
            <div className="w-20 h-20 bg-[#FAF8F3] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#2C241B] group-hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-semibold text-[#2C241B] mb-2">Teacher Portal</h2>
            <p className="text-[#6B5E4C] text-sm">Update student database, fill out placement trackers, and mark attendance.</p>
          </div>

          {/* Student Login */}
          <div 
            onClick={() => signIn("google", { callbackUrl: "/router?role=STUDENT" })}
            className="group cursor-pointer bg-white border border-[#E1D8C9] rounded-xl p-10 flex flex-col items-center text-center shadow-sm hover:shadow-xl hover:border-[#8B7D6B] transition-all duration-300"
          >
            <div className="w-20 h-20 bg-[#FAF8F3] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#8B7D6B] group-hover:text-white transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-semibold text-[#2C241B] mb-2">Student Portal</h2>
            <p className="text-[#6B5E4C] text-sm">View your personal dossier, coursework, interview schedule, and applications.</p>
          </div>
        </div>
      )}
    </div>
  );
}
