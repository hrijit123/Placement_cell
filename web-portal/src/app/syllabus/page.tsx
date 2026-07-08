import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import SyllabusClient from "./SyllabusClient";

export default async function SyllabusPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || user.status !== "ACTIVE") redirect("/");

  const role = user.role;
  const subtitle =
    role === "ADMIN"
      ? "All monthly syllabus plans submitted by teachers."
      : role === "TEACHER"
        ? "Update your monthly syllabus — target, completed, and pending chapters."
        : "Monthly syllabus plans for your class.";

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 border-b border-[#E1D8C9] pb-6 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-serif text-[#2C241B] mb-2">Syllabus Tracker</h1>
            <p className="text-[#6B5E4C]">{subtitle}</p>
          </div>
          <Link
            href={role === "STUDENT" ? "/" : role === "ADMIN" ? "/admin" : "/staff"}
            className="text-sm text-[#6B5E4C] hover:text-[#2C241B] px-4 py-2 border border-[#E1D8C9] rounded hover:bg-white"
          >
            Back
          </Link>
        </header>

        <SyllabusClient role={role} />
      </div>
    </div>
  );
}
