import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const optionalTrimmed = z.string().max(2000).optional().nullable();
const optionalDate = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? new Date(v) : null));

const StaffRecordSchema = z.object({
  userId: z.string().min(1),
  phone: optionalTrimmed,
  address: optionalTrimmed,
  designation: optionalTrimmed,
  dob: optionalDate,
  qualification: optionalTrimmed,
  joiningDate: optionalDate,
  probationEndDate: optionalDate,
  department: optionalTrimmed,
  project: optionalTrimmed,
  salary: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().nonnegative().nullable()
  ),
  incrementNote: z.string().max(500).optional().nullable(),
  additionalTasks: optionalTrimmed,
  workingHours: optionalTrimmed,
  subject: optionalTrimmed,
  classesTaking: optionalTrimmed,
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!adminUser || adminUser.role !== "ADMIN" || adminUser.status !== "ACTIVE") return null;
  return adminUser;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const teachers = await prisma.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        staffRecord: true,
      },
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Failed to fetch staff records:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const parsed = StaffRecordSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid staff record payload" }, { status: 400 });
    }
    const { userId, incrementNote, ...fields } = parsed.data;

    const teacher = await prisma.user.findUnique({
      where: { id: userId },
      include: { staffRecord: true },
    });
    if (!teacher || teacher.role !== "TEACHER") {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Append to increment history automatically whenever the salary changes.
    let incrementHistory = teacher.staffRecord?.incrementHistory ?? null;
    const previousSalary = teacher.staffRecord?.salary ?? null;
    if (fields.salary !== null && fields.salary !== previousSalary) {
      let history: unknown[] = [];
      try {
        history = incrementHistory ? JSON.parse(incrementHistory) : [];
        if (!Array.isArray(history)) history = [];
      } catch {
        history = [];
      }
      history.push({
        date: new Date().toISOString(),
        previousSalary,
        newSalary: fields.salary,
        note: incrementNote || null,
        changedBy: admin.name || admin.email,
      });
      incrementHistory = JSON.stringify(history);
    }

    const record = await prisma.staffRecord.upsert({
      where: { userId },
      create: { userId, ...fields, incrementHistory },
      update: { ...fields, incrementHistory },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error("Failed to save staff record:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
