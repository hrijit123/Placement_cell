import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params;
    const session = await getServerSession(authOptions);
    const role = (session as any)?.user?.role;

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({ where: { email: session.user.email! }, include: { profile: true } });
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.profile.findUnique({
      where: { studentId },
      include: { cohorts: true, user: true }
    });

    if (!profile) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // --- ACCESS CONTROL ---
    if (role === "STUDENT") {
      if (actor.profile?.studentId !== studentId) {
        return NextResponse.json({ error: "Forbidden: Can only edit your own profile" }, { status: 403 });
      }
    } else if (role === "TEACHER") {
      const teacherUser = await prisma.user.findUnique({
        where: { id: actor.id },
        include: { cohortsLed: true }
      });
      const teacherCohortIds = teacherUser?.cohortsLed.map(c => c.id) || [];
      const studentCohortIds = profile.cohorts.map(c => c.id) || [];
      const hasAccess = studentCohortIds.some(id => teacherCohortIds.includes(id));

      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied: Out of cohort edits not permitted" }, { status: 403 });
      }
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await req.json();

    // Photo is stored as a small base64 data URI; reject anything else or oversized.
    if (data.photoData !== undefined && data.photoData !== null) {
      if (
        typeof data.photoData !== "string" ||
        !data.photoData.startsWith("data:image/") ||
        data.photoData.length > 400_000
      ) {
        return NextResponse.json(
          { error: "Photo must be an image under ~300KB" },
          { status: 400 }
        );
      }
    }

    // --- DATA TRANSFORMATION (Verification State) ---
    // If student, mark official records as SELF_REPORTED. If teacher/admin, VERIFIED.
    const verificationStatus = role === "STUDENT" ? "SELF_REPORTED" : "VERIFIED";

    const processVerifiedField = (incomingValue: any, existingValue: string | null) => {
      if (incomingValue === undefined) return existingValue;
      return JSON.stringify({ value: incomingValue, status: verificationStatus });
    };

    const updatedData: any = {
      headline: data.headline !== undefined ? data.headline : profile.headline,
      address: data.address !== undefined ? data.address : profile.address,
      phone: data.phone !== undefined ? data.phone : profile.phone,
      className: data.className !== undefined ? data.className : profile.className,
      photoData: data.photoData !== undefined ? data.photoData : profile.photoData,
      languages: data.languages !== undefined ? data.languages : profile.languages,
      hobbies: data.hobbies !== undefined ? data.hobbies : profile.hobbies,
      vocation: data.vocation !== undefined ? data.vocation : profile.vocation,
      disabilityInfo: data.disabilityInfo !== undefined ? data.disabilityInfo : profile.disabilityInfo,
      skills: data.skills !== undefined ? data.skills : profile.skills,
      experience: data.experience !== undefined ? data.experience : profile.experience,
      courseworks: data.courseworks !== undefined ? data.courseworks : profile.courseworks,
      internships: data.internships !== undefined ? data.internships : profile.internships,
      expectedSalary: data.expectedSalary !== undefined ? data.expectedSalary : profile.expectedSalary,
      availability: data.availability !== undefined ? data.availability : profile.availability,
      
      // Verified Fields
      education: processVerifiedField(data.education, profile.education),
      certifications: processVerifiedField(data.certifications, profile.certifications),
      transcripts: processVerifiedField(data.transcripts, profile.transcripts),

      resumePdfUrl: data.resumePdfUrl !== undefined ? data.resumePdfUrl : profile.resumePdfUrl,
    };

    // Update profile
    await prisma.profile.update({
      where: { studentId },
      data: updatedData
    });

    // --- AUDIT LOGGING ---
    await prisma.recordAuditLog.create({
      data: {
        profileId: profile.id,
        actorId: actor.id,
        action: "UPDATE",
        field: "Profile Data (Bulk)",
      }
    });

    // --- NOTIFICATIONS ---
    if (role === "STUDENT") {
      // Notify student
      await prisma.notification.create({
        data: {
          recipientId: actor.id,
          profileId: profile.id,
          message: "Your profile update has been submitted and is pending verification."
        }
      });
      // Notify assigned teachers and admins
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      const teacherIds = [...new Set(profile.cohorts.map(c => c.teacherId))];
      
      for (const admin of admins) {
        await prisma.notification.create({
          data: { recipientId: admin.id, profileId: profile.id, message: `Student ${profile.user.name || studentId} updated their profile.` }
        });
      }
      for (const tId of teacherIds) {
        await prisma.notification.create({
          data: { recipientId: tId, profileId: profile.id, message: `Student ${profile.user.name || studentId} updated their profile.` }
        });
      }
    } else {
      // Notify Admins
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: { recipientId: admin.id, profileId: profile.id, message: `${role} ${actor.name || actor.email} updated profile for ${profile.user.name || studentId}.` }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
