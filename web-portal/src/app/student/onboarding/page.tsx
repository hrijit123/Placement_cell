"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function StudentOnboarding() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");

  useEffect(() => {
    if (session?.user?.name) {
      setStudentName(session.user.name);
    }
  }, [session?.user?.name]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  const handleLinkPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pin.trim()) {
      setError("Please enter the PIN.");
      return;
    }

    try {
      const res = await fetch("/api/ngo/students/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to link account.");
        return;
      }
      
      router.push(`/database/${data.studentId}`);
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  const handleSelfRegister = async () => {
    setIsRegistering(true);
    setError("");
    try {
      const res = await fetch("/api/ngo/students/self-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: studentName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to register.");
        setIsRegistering(false);
        return;
      }
      setGeneratedId(data.studentId);
    } catch (err) {
      setError("An unexpected error occurred.");
      setIsRegistering(false);
    }
  };

  if (generatedId) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-emerald-100 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Welcome to Deeds Connect!</h2>
          <p className="text-stone-600 mb-6">Your student profile has been created successfully.</p>
          
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 mb-8">
            <p className="text-sm text-stone-500 font-medium mb-2 uppercase tracking-wider">Your Student ID</p>
            <p className="text-3xl font-mono font-bold text-emerald-800 tracking-widest">{generatedId}</p>
            <p className="text-sm text-amber-700 mt-4 bg-amber-50 p-3 rounded">
              ⚠️ Please write this ID down and remember it! You may need it for future references.
            </p>
          </div>

          <button
            onClick={() => router.push(`/database/${generatedId}`)}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Go to My Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-stone-900 mb-3">Complete Your Registration</h1>
          <p className="text-lg text-stone-500">Welcome, {session?.user?.name || "Student"}! How would you like to set up your profile?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Option 1: Link existing */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 flex flex-col h-full">
            <h2 className="text-xl font-serif font-semibold text-stone-800 mb-2">I have a PIN</h2>
            <p className="text-stone-500 text-sm mb-6 flex-grow">
              If your teacher already created an account for you, they should have given you a Student ID or PIN (e.g. STU-12345). Enter it below to link your account.
            </p>
            <form onSubmit={handleLinkPin} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Enter Student PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none font-mono tracking-wider"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
              >
                Link My Account
              </button>
            </form>
          </div>

          {/* Option 2: Self Register */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-200 flex flex-col h-full">
            <h2 className="text-xl font-serif font-semibold text-stone-800 mb-2">I am a New Student</h2>
            <p className="text-stone-500 text-sm mb-6 flex-grow">
              If you don't have a PIN and your teacher hasn't created a profile for you yet, click below to generate your own Student ID instantly.
            </p>
            <div className="mt-auto">
              <div className="mb-4">
                <label className="block text-xs font-semibold text-stone-600 uppercase mb-1">Your Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none"
                />
              </div>
              <button
                onClick={handleSelfRegister}
                disabled={isRegistering}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isRegistering ? "Creating Profile..." : "Register as New Student"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-8 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-center max-w-lg mx-auto">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
