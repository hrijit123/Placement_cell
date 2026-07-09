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
      // Already claimed, verify they entered the correct PIN
      if (studentPin && profile.studentId !== studentPin) {
        redirect("/?error=Invalid_Student_ID");
      }
    } else {
      // First time logging in, claim the profile using the PIN
      if (!studentPin) {
        redirect("/?error=Student_ID_Required");
      }
      
      const unclaimed = await prisma.profile.findUnique({
        where: { studentId: studentPin }
      });
      
      if (!unclaimed) {
        redirect("/?error=Invalid_Student_ID");
      }
      if (unclaimed.userId) {
        redirect("/?error=ID_Already_Claimed");
      }
      
      // Claim the profile!
      profile = await prisma.profile.update({
        where: { id: unclaimed.id },
        data: { userId: user.id }
      });
    }

    // Redirect to their own dossier
    redirect(`/database/${profile.studentId}`);
  } else {
    redirect("/");
  }
}
