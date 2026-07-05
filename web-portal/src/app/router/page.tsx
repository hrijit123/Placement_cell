import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function RouterPage({ searchParams }: { searchParams: { role?: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/");
  }

  const requestedRole = searchParams.role;

  // Find the user in DB
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    redirect("/");
  }

  // For demo purposes, we will update the role to what they clicked on the home page portal.
  if (requestedRole && ["ADMIN", "TEACHER", "STUDENT"].includes(requestedRole)) {
    await prisma.user.update({
      where: { email: user.email! },
      data: { role: requestedRole as any }
    });
    user.role = requestedRole as any;
  }

  // Route based on final role
  if (user.role === "ADMIN" || user.role === "TEACHER") {
    redirect("/staff");
  } else if (user.role === "STUDENT") {
    // Redirect to their own dossier
    redirect(`/database/${user.id}`);
  } else {
    redirect("/onboarding");
  }
}
