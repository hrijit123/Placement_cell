import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function RouterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/");
  }

  const { role: requestedRole } = await searchParams;

  // Find the user in DB
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    redirect("/");
  }

  // The role is locked to the user's account in the database.
  // We no longer allow the frontend to arbitrarily change a user's role on navigation.

  // Route based on final role
  if (user.role === "ADMIN" || user.role === "TEACHER") {
    redirect("/staff");
  } else if (user.role === "STUDENT") {
    // Check if profile exists
    let profile = await prisma.profile.findUnique({
      where: { userId: user.id }
    });

    if (!profile) {
      // Create profile with a new student ID if they don't have one
      const newStudentId = `STU-${Math.floor(10000 + Math.random() * 90000)}`;
      profile = await prisma.profile.create({
        data: {
          userId: user.id,
          studentId: newStudentId
        }
      });
    }

    // Redirect to their own dossier
    redirect(`/database/${profile.studentId}`);
  } else {
    redirect("/");
  }
}
