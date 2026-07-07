import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { role, pin } = await request.json();

    if (!role || !pin) {
      return NextResponse.json({ error: "Missing role or pin" }, { status: 400 });
    }

    const validTeacherPin = process.env.TEACHER_PIN || "teacher123";
    const validAdminPin = process.env.ADMIN_PIN || "admin123";

    if (role === "TEACHER") {
      if (pin === validTeacherPin) {
        return NextResponse.json({ success: true });
      }
    } else if (role === "ADMIN") {
      if (pin === validAdminPin) {
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
