import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!adminUser || adminUser.role !== "ADMIN" || adminUser.status !== "ACTIVE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (adminUser.id === id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Safely unlink Profile instead of hard deletion to avoid restrict constraint errors
    await prisma.profile.updateMany({
      where: { userId: id },
      data: { userId: null }
    });

    // Delete NextAuth/User logs that are tied with Restrict/Cascade where applicable
    await prisma.accessLog.deleteMany({ where: { actorId: id } });
    await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.account.deleteMany({ where: { userId: id } });
    await prisma.syllabusPlan.deleteMany({ where: { teacherId: id } });
    await prisma.cohort.deleteMany({ where: { teacherId: id } });
    
    // Unlink Audit Logs
    await prisma.recordAuditLog.deleteMany({
      where: { actorId: id }
    });
    
    // Delete Staff and Job records
    await prisma.staffRecord.deleteMany({ where: { userId: id } });
    await prisma.job.deleteMany({ where: { recruiterId: id } });
    
    // Now safe to delete the user
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
