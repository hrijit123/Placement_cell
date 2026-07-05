import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import DatabaseRecordView from "./DatabaseRecordView";

export default async function DossierPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/");
  }

  // Allow ADMIN, TEACHER, or the STUDENT themselves.
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  
  if (user?.role === "STUDENT") {
    // If student, they can only view their OWN dossier.
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (profile?.studentId !== studentId) {
      redirect("/unauthorized");
    }
  }

  return <DatabaseRecordView studentId={studentId} />;
}
