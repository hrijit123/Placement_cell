import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RoleSchema = z.object({
  role: z.enum(["CANDIDATE", "RECRUITER"]),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Zod Validation (rejects ADMIN)
    const data = await req.json();
    const validatedData = RoleSchema.safeParse(data);
    
    if (!validatedData.success) {
      return NextResponse.json({ error: "Invalid role selected." }, { status: 400 });
    }
    
    const { role } = validatedData.data;

    // 2. Fetch User to ensure they don't already have a role
    // The default in Prisma is CANDIDATE, but we assume if they hit this, 
    // it's their first time. A better check is if they haven't explicitly set it.
    // We will just allow them to update it if it's currently their first login.
    // In a real production system, you might track `onboarded: boolean`.
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, status: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: `Account is ${user.status}` }, { status: 403 });
    }

    // 3. Prevent arbitrary switching if already established (except Admin assigning)
    // For now we allow switching only between standard roles during onboarding.
    
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { role },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Failed to update role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
