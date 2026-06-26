import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const StatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!adminUser || adminUser.role !== "ADMIN" || adminUser.status !== "ACTIVE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (adminUser.id === params.id) {
      return NextResponse.json({ error: "Cannot change your own status" }, { status: 400 });
    }

    const data = await req.json();
    const validatedData = StatusSchema.safeParse(data);
    if (!validatedData.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { status: validatedData.data.status },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Failed to update user status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
