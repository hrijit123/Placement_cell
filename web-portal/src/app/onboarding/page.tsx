"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Onboarding() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!session) {
    router.push("/api/auth/signin");
    return null;
  }

  const handleRoleSelection = async (role: "CANDIDATE" | "RECRUITER" | "ADMIN") => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        // Force session update to reflect new role
        await update();
        router.push("/");
      } else {
        alert("Failed to update role. Please try again.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <h1 className="text-4xl font-serif text-stone-900 mb-4 text-center">Welcome to ISL Connect!</h1>
        <p className="text-lg text-stone-600 mb-12 text-center">
          To personalize your experience, please tell us how you will be using the platform.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <button 
            onClick={() => handleRoleSelection("CANDIDATE")}
            disabled={loading}
            className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md hover:border-emerald-200 transition-all group"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              🎓
            </div>
            <h3 className="text-xl font-semibold text-stone-800 mb-2">I am a Candidate</h3>
            <p className="text-sm text-stone-500 text-center">I want to build my resume and apply for jobs.</p>
          </button>

          <button 
            onClick={() => handleRoleSelection("RECRUITER")}
            disabled={loading}
            className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              🏢
            </div>
            <h3 className="text-xl font-semibold text-stone-800 mb-2">I am a Recruiter</h3>
            <p className="text-sm text-stone-500 text-center">I want to post jobs and find great talent.</p>
          </button>

          <button 
            onClick={() => handleRoleSelection("ADMIN")}
            disabled={loading}
            className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md hover:border-rose-200 transition-all group"
          >
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              🛡️
            </div>
            <h3 className="text-xl font-semibold text-stone-800 mb-2">I am an Admin</h3>
            <p className="text-sm text-stone-500 text-center">I need access to manage the platform.</p>
          </button>
        </div>
        
        <p className="text-xs text-stone-400 mt-12 text-center">
          Note: In a real production environment, Admin access should require a secret code or manual database intervention. We've added it here for demonstration purposes!
        </p>
      </div>
    </div>
  );
}
