import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Zod Schema for input validation
const JobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  company: z.string().min(2, "Company name must be at least 2 characters").max(100),
  location: z.string().min(2, "Location must be at least 2 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
});

// Simple in-memory rate limiter (Token Bucket per User ID)
// Note: In a real serverless deployment, this resets on every cold start.
// Use Upstash Redis for production deployments.
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 5; // max 5 job posts per minute

  const userRate = rateLimitCache.get(userId);

  if (!userRate || now > userRate.resetTime) {
    rateLimitCache.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (userRate.count >= maxRequests) {
    return false;
  }

  userRate.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    // 1. Authentication & Session check
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Authorization / Role Check & Status Check (Ban/Suspend)
    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: `Account is ${user.status}` }, { status: 403 });
    }

    if (user.role !== "RECRUITER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only recruiters can post jobs" }, { status: 403 });
    }

    // 3. Rate Limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    // 4. Input Validation
    const data = await req.json();
    const validatedData = JobSchema.safeParse(data);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedData.error.format() },
        { status: 400 }
      );
    }

    const { title, company, location, description } = validatedData.data;

    // 5. Database Insertion (IDOR secured natively by using the active user's ID)
    const newJob = await prisma.job.create({
      data: {
        title,
        company,
        location,
        description,
        recruiterId: user.id
      }
    });

    return NextResponse.json(newJob, { status: 201 });
  } catch (error: any) {
    console.error("Failed to post job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
