import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { role, pin } = await request.json();

    if (!role || !pin) {
      return NextResponse.json({ error: "Missing role or pin" }, { status: 400 });
    }

    if (role === "TEACHER") {
      if (pin === process.env.TEACHER_PIN) {
        return NextResponse.json({ success: true });
      }
    } else if (role === "ADMIN") {
      if (pin === process.env.ADMIN_PIN) {
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
