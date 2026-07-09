import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function RouterPage({ searchParams }: { searchParams: Promise<{ role?: string; studentPin?: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/");
  }

  const { role: requestedRole, studentPin } = await searchParams;

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
    redirect("/database");
  } else if (finalRole === "STUDENT") {
    // Check if profile is already linked to this Google User
    let profile = await prisma.profile.findUnique({
      where: { userId: user.id }
    });

    if (profile) {
      redirect(`/database/${profile.studentId}`);
    } else {
      // First time logging in, go to onboarding to enter PIN or self-register
      redirect("/student/onboarding");
    }
  } else {
    redirect("/");
  }
}
