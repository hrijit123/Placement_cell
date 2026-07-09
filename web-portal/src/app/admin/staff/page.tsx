import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import StaffRecordsClient from "./StaffRecordsClient";
import ClassMasterList from "./ClassMasterList";

export default async function StaffRecordsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/");
  const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!adminUser || adminUser.role !== "ADMIN" || adminUser.status !== "ACTIVE") redirect("/");

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 border-b border-[#E1D8C9] pb-6 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-serif text-[#2C241B] mb-2">Teacher Records</h1>
            <p className="text-[#6B5E4C]">
              HR records for teaching staff — designation, salary, increments, subjects, and more.
            </p>
          </div>
          <Link href="/admin" className="text-sm text-[#6B5E4C] hover:text-[#2C241B] px-4 py-2 border border-[#E1D8C9] rounded hover:bg-white">
            Back to Dashboard
          </Link>
        </header>

        <ClassMasterList />
        <StaffRecordsClient />
      </div>
    </div>
  );
}
