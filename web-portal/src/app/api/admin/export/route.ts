import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!adminUser || adminUser.role !== "ADMIN" || adminUser.status !== "ACTIVE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch data for CSV
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });

    // Create a simple CSV string
    const headers = ["ID", "Name", "Email", "Role", "Status", "JoinedAt"];
    const rows = users.map(u => [
      u.id, 
      `"${u.name || ''}"`, 
      `"${u.email || ''}"`, 
      u.role, 
      u.status, 
      u.createdAt.toISOString()
    ].join(","));

    const csvContent = [headers.join(","), ...rows].join("\n");

    const response = new NextResponse(csvContent);
    response.headers.set("Content-Type", "text/csv");
    response.headers.set("Content-Disposition", 'attachment; filename="isl_connect_users_report.csv"');
    
    return response;
  } catch (error: any) {
    console.error("Failed to export CSV:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
