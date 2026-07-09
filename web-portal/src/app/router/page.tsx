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
  let user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    redirect("/");
  }

  // Restore the demo behavior: if they click a specific portal, switch their role to match it.
  let finalRole = user.role;
  if (requestedRole && requestedRole !== user.role && ["ADMIN", "TEACHER", "STUDENT"].includes(requestedRole)) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: requestedRole as any }
    });
    finalRole = user.role;
  }

  // Route based on final role
  if (finalRole === "ADMIN") {
    redirect("/admin");
  } else if (finalRole === "TEACHER") {
    redirect("/staff");
  } else if (finalRole === "STUDENT") {
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
