import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const email = session?.user?.email;

    if (!session || (role !== "ADMIN" && role !== "TEACHER") || !email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const isExport = searchParams.get("export") === "true";

    let profiles;

    if (role === "ADMIN") {
      profiles = await prisma.profile.findMany({
        include: {
          user: { select: { name: true, email: true } },
          cohorts: { select: { id: true, name: true, teacher: { select: { name: true } } } },
          careerTrack: true
        }
      });
    } else {
      profiles = await prisma.profile.findMany({
        where: {
          cohorts: {
            some: {
              teacherId: dbUser.id
            }
          }
        },
        include: {
          user: { select: { name: true, email: true } },
          cohorts: { select: { id: true, name: true, teacher: { select: { name: true } } } },
          careerTrack: true
        }
      });
    }

    if (isExport) {
      // Build CSV
      const headers = ["Student ID", "Name", "Email", "Cohorts", "Placements", "Latest Salary"];
      const rows = profiles.map(p => {
        const placements = p.careerTrack.filter(c => c.recordType === "PLACEMENT");
        const latestPlacement = placements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
        
        return [
          p.studentId || "N/A",
          `"${p.name || p.user?.name || ""}"`,
          `"${p.user?.email || "Unclaimed"}"`,
          `"${p.cohorts.map(c => c.name).join(", ")}"`,
          placements.length,
          latestPlacement?.salary || "N/A"
        ].join(",");
      });

      const csv = [headers.join(","), ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="student_database.csv"'
        }
      });
    }

    return NextResponse.json(profiles);

  } catch (error) {
    console.error("Failed to fetch students:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
