import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Must be a Candidate or Recruiter
    const role = (session.user as any).role;
    if (role !== "STUDENT" && role !== "RECRUITER") {
      return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
    }

    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // Issue a short-lived token (e.g. 5 minutes)
    const token = jwt.sign(
      {
        userId: session.user.email,
        role: role,
        purpose: "websocket_translation"
      },
      secret,
      { expiresIn: "5m" }
    );

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error("Failed to issue WS token:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
