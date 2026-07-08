"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Shield, BookOpen, GraduationCap, Users, LayoutDashboard, Settings, FileBarChart, Handshake, Heart, LogIn, CheckCircle, Briefcase, Building, CalendarCheck } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinVerified, setPinVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/public/stats').then(res => res.json()).then(data => setStats(data)).catch(console.error);
  }, []);

  if (status === "loading") {
    return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-stone-500">Loading...</div>;
  }

  const handleDashboardRedirect = () => {
    const role = (session as any)?.user?.role;
    if (role === "STUDENT") router.push("/router?role=STUDENT");
    else if (role === "TEACHER") router.push("/staff");
    else if (role === "ADMIN") router.push("/admin");
  };

  const handleRoleSelect = (role: string) => {
    if (session) {
      if (role === "STUDENT") router.push("/router?role=STUDENT");
      else if (role === "TEACHER") router.push("/staff");
      else if (role === "ADMIN") router.push("/admin");
      return;
    }
    setSelectedRole(role);
    setPin("");
    setPinError("");
    setPinVerified(role === "STUDENT");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setPinError("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: pin,
      });
      if (res?.error) {
        setPinError("Invalid email or user not found");
      } else {
        router.push(`/router?role=${selectedRole}`);
      }
    } catch (err) {
      setPinError("Network error. Try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] font-sans selection:bg-[#2D4A22] selection:text-white pb-12">


      {selectedRole && !session ? (
        <div className="flex items-center justify-center min-h-[70vh] p-4">
          <div className="flex flex-col items-center bg-white p-12 rounded-2xl shadow-sm border border-[#E1D8C9] max-w-md w-full">
            <h2 className="text-3xl font-serif font-semibold text-[#2C241B] mb-2">{selectedRole} Portal</h2>
            <p className="text-[#6B5E4C] mb-8 text-center">Sign in to access your {selectedRole.toLowerCase()} dashboard and records.</p>
            
            <form onSubmit={handleLogin} className="w-full flex flex-col items-center mb-4">
              <div className="w-full relative mb-4">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-stone-400" />
                <input 
                  type="email" 
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder={`Enter your mock email (e.g., admin@deeds.org)`}
                  className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-xl outline-none focus:border-[#2D4A22] focus:ring-1 focus:ring-[#2D4A22]"
                  required
                />
              </div>
              {pinError && <p className="text-red-600 text-sm mb-4">{pinError}</p>}
              <button type="submit" disabled={isVerifying} className="w-full bg-[#2C241B] text-white py-3 rounded-xl font-semibold hover:bg-black transition-colors disabled:bg-stone-400">
                {isVerifying ? "Signing In..." : "Sign In"}
              </button>
            </form>
            
            <button onClick={() => handleRoleSelect("")} className="text-[#8B7D6B] hover:text-[#2C241B] text-sm underline underline-offset-4 font-medium transition-colors mt-2">
              Go back
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 mt-12">
          {/* Hero */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-12">
            <div className="flex-1">
              <h1 className="text-5xl lg:text-6xl font-serif text-[#2C241B] font-semibold tracking-tight mb-4">
                Welcome to <span className="text-[#2D4A22]">DEEDS Connect</span>
              </h1>
              <p className="text-xl text-[#6B5E4C] mb-8 font-medium">Empowering Specially Abled Students Towards Meaningful Careers <Heart className="w-5 h-5 inline text-[#2D4A22] fill-[#2D4A22] ml-1" /></p>
              
              <ul className="space-y-4 text-stone-700 font-medium">
                <li className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-700" /></span> Track student progress seamlessly</li>
                <li className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-700" /></span> Manage placements efficiently</li>
                <li className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-700" /></span> Build a brighter future together</li>
              </ul>
            </div>
            
            <div className="flex-1 flex justify-end relative h-[300px]">
              <div className="w-full max-w-md h-full rounded-2xl bg-stone-200 overflow-hidden relative border-4 border-white shadow-xl flex items-center justify-center">
                 {/* Placeholder for illustration */}
                 <div className="flex flex-col items-center opacity-50">
                    <Users className="w-16 h-16 text-stone-600 mb-2" />
                    <span className="font-semibold text-stone-600">DEEDS Hero Illustration</span>
                 </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
            <StatCard label="Total Students" value={stats?.totalStudents ?? "-"} sub="Across all cohorts" icon={<Users className="w-5 h-5 text-emerald-600" />} />
            <StatCard label="Eligible for Placement" value={stats?.eligibleStudents ?? "-"} sub="Final year students" icon={<Users className="w-5 h-5 text-blue-500" />} />
            <StatCard label="Students Placed" value={stats?.placedStudents ?? "-"} sub="This academic year" icon={<Briefcase className="w-5 h-5 text-purple-600" />} />
            <StatCard label="Placement Rate" value={stats ? `${stats.placementRate}%` : "-"} sub="Of eligible students" icon={<FileBarChart className="w-5 h-5 text-amber-500" />} />
            <StatCard label="Active Employers" value={stats?.activeEmployers ?? "-"} sub="Partner companies" icon={<Building className="w-5 h-5 text-teal-600" />} />
            <StatCard label="Upcoming Interviews" value={stats?.upcomingInterviews ?? "-"} sub="Next 7 days" icon={<CalendarCheck className="w-5 h-5 text-red-500" />} />
          </div>

          {/* Portals */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <PortalCard 
              title="Admin Portal"
              desc="Manage NGO placement records, attendance, users, and system settings."
              icon={<Shield className="w-8 h-8 text-emerald-700" />}
              iconBg="bg-emerald-50"
              bulletPoints={["Placement Management", "Student & Employer Management", "Reports & Analytics", "System Configuration"]}
              onClick={() => handleRoleSelect("ADMIN")}
            />
            <PortalCard 
              title="Teacher Portal"
              desc="Update student database, track placement activities, and mark attendance."
              icon={<BookOpen className="w-8 h-8 text-blue-700" />}
              iconBg="bg-blue-50"
              bulletPoints={["Student Database", "Attendance Management", "Placement Tracker", "Interview Updates"]}
              onClick={() => handleRoleSelect("TEACHER")}
            />
            <PortalCard 
              title="Student Portal"
              desc="View your profile, apply for jobs, track interviews, and upload documents."
              icon={<GraduationCap className="w-8 h-8 text-purple-700" />}
              iconBg="bg-purple-50"
              bulletPoints={["My Profile & Documents", "Job Opportunities", "Interview Schedule", "Placement Status"]}
              onClick={() => handleRoleSelect("STUDENT")}
            />
            <PortalCard 
              title="Staff Portal"
              desc="Access attendance sheet and student database quickly and easily."
              icon={<Users className="w-8 h-8 text-orange-700" />}
              iconBg="bg-orange-50"
              bulletPoints={["Attendance Sheet", "Student Database", "Placement Updates", "Communication"]}
              onClick={() => handleRoleSelect("TEACHER")} // Assuming staff acts similarly to teachers currently
            />
          </div>

        </div>
      )}

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-[#E1D8C9] text-center text-sm text-[#6B5E4C]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Heart className="w-4 h-4 text-[#2D4A22]" /> 
            <span>Together, we empower dreams and build inclusive futures.</span>
          </div>
          <div>© 2026 DEEDS Connect | DEEDS Public Charitable Trust</div>
          <div className="mt-4 md:mt-0 flex items-center justify-center">Made with <Heart className="w-3 h-3 inline text-red-500 fill-red-500 mx-1" /> for Specially Abled</div>
        </div>
      </footer>
    </div>
  );
}

const StatCard = ({ label, value, sub, icon }: { label: string, value: string | number, sub: string, icon: any }) => (
  <div className="bg-white p-4 rounded-xl border border-[#E1D8C9] shadow-sm flex flex-col items-center justify-center text-center">
    <div className="flex items-center justify-center w-10 h-10 bg-stone-50 rounded-full mb-3 border border-stone-100">
      {icon}
    </div>
    <p className="text-xs font-semibold text-stone-500 mb-1 tracking-wider uppercase">{label}</p>
    <h3 className="text-2xl font-bold text-[#2C241B]">{value}</h3>
    <p className="text-[10px] text-stone-400 mt-1">{sub}</p>
  </div>
);

const PortalCard = ({ title, desc, icon, iconBg, bulletPoints, onClick }: any) => (
  <div className="bg-white border border-[#E1D8C9] rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center group cursor-pointer" onClick={onClick}>
    <div className="w-full flex justify-end mb-2">
       <Lock className="w-4 h-4 text-stone-300 group-hover:text-amber-500 transition-colors" />
    </div>
    <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center mb-6 border border-stone-100 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h2 className="text-xl font-serif font-bold text-[#2C241B] mb-2">{title}</h2>
    <p className="text-[#6B5E4C] text-xs font-medium mb-6 px-2 leading-relaxed h-10">{desc}</p>
    
    <ul className="text-left w-full space-y-2 mb-8 text-xs font-medium text-stone-600 flex-1">
      {bulletPoints.map((bp: string, i: number) => (
        <li key={i} className="flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-[#2D4A22]" />
          {bp}
        </li>
      ))}
    </ul>
    
    <button className="w-full py-2.5 px-4 border border-[#2D4A22] text-[#2D4A22] rounded-xl text-sm font-bold group-hover:bg-[#2D4A22] group-hover:text-white transition-colors">
      Go to {title} &rarr;
    </button>
  </div>
);
