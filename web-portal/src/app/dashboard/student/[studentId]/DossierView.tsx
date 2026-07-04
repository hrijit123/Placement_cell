"use client";

import { useCallback, useEffect, useState } from "react";

type JobApplicationEntry = {
  id: string;
  jobTitle: string;
  company: string;
  status: string;
  offeredSalary: number | null;
  rejectionReason: string | null;
  appliedAt: string;
};

type CareerHistoryEntry = {
  id: string;
  company: string;
  role: string;
  salary: number | null;
  startDate: string;
  endDate: string | null;
  status: string;
  nextMove: string | null;
};

type AttendanceEntry = {
  id: string;
  date: string;
  status: string;
  classOrEvent: string | null;
};

type Dossier = {
  studentId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isRedacted: boolean;
  personalDetails: {
    headline: string | null;
    address: string | null;
    languages: string | null;
    hobbies: string | null;
    vocation: string | null;
    disabilityInfo: string | null;
  };
  professionalBackground: {
    skills: string | null;
    experience: string | null;
    education: string | null;
    courseworks: string | null;
    internships: string | null;
    certifications: string | null;
  };
  jobPreferences: {
    expectedSalary: string | null;
    availability: string | null;
  };
  jobApplications: JobApplicationEntry[];
  careerHistory: CareerHistoryEntry[];
  attendance: AttendanceEntry[];
};

type FetchState =
  | { status: "loading" }
  | { status: "error"; code: number; message: string }
  | { status: "success"; data: Dossier };

function RedactedField({
  value,
  isRedacted,
  fallback = "Not provided",
  nullMeansRedacted = false,
}: {
  value: string | number | null | undefined;
  isRedacted: boolean;
  fallback?: string;
  // The API redacts salary fields by returning null instead of "[REDACTED]".
  // Only those fields should render a lock for null values; for everything
  // else null just means the student hasn't filled it in.
  nullMeansRedacted?: boolean;
}) {
  if (value === "[REDACTED]" || (isRedacted && nullMeansRedacted && (value === null || value === undefined))) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-200 text-stone-500">
        🔒 Redacted
      </span>
    );
  }
  if (value === null || value === undefined || value === "") {
    return <span className="text-[#8B7D6B] italic">{fallback}</span>;
  }
  return <span>{value}</span>;
}

function formatINR(amount: number) {
  return "₹" + amount.toLocaleString("en-IN");
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">{label}</div>
      <div className="text-[#3E362E]">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status.includes("OFFER_ACCEPTED") || status === "WORKING" || status === "PRESENT"
      ? "bg-[#E8F0E5] text-[#2D4A22]"
      : status.includes("REJECTED") || status.includes("NO_SHOW") || status === "ABSENT" || status === "TERMINATED"
      ? "bg-red-100 text-red-800"
      : status === "LATE" || status === "RESIGNED"
      ? "bg-orange-100 text-orange-800"
      : "bg-stone-100 text-stone-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${tone}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function DossierView({ studentId }: { studentId: string }) {
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [fullHistory, setFullHistory] = useState(false);

  const load = useCallback(async (full: boolean) => {
    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/ngo/students/${encodeURIComponent(studentId)}${full ? "?full=true" : ""}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        setState({ status: "error", code: res.status, message: body.error || "Something went wrong." });
        return;
      }
      const data: Dossier = await res.json();
      setState({ status: "success", data });
    } catch {
      setState({ status: "error", code: 0, message: "Network error — could not reach the server." });
    }
  }, [studentId]);

  useEffect(() => {
    load(fullHistory);
  }, [load, fullHistory]);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-[#8B7D6B] animate-pulse">Loading dossier...</div>
      </div>
    );
  }

  if (state.status === "error") {
    const messages: Record<number, { title: string; body: string }> = {
      401: { title: "Sign in required", body: "You need to sign in to view this dossier." },
      403: {
        title: "Access denied",
        body: "This student is not in one of your assigned cohorts, or your role doesn't have dossier access.",
      },
      404: { title: "Student not found", body: `No student found with ID "${studentId}".` },
      429: { title: "Too many requests", body: "You've hit the dossier lookup rate limit. Please wait a minute and try again." },
    };
    const info = messages[state.code] || { title: "Error", body: state.message };

    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-10">
        <div className="max-w-md text-center bg-white border border-[#E1D8C9] rounded p-8 shadow-sm">
          <h2 className="text-2xl font-serif text-[#2C241B] mb-2">{info.title}</h2>
          <p className="text-[#6B5E4C] mb-6">{info.body}</p>
          {state.code === 429 && (
            <button
              onClick={() => load(fullHistory)}
              className="px-4 py-2 bg-[#2D4A22] text-white rounded text-sm font-semibold hover:bg-[#3d632e] transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const d = state.data;
  const { personalDetails, professionalBackground, jobPreferences } = d;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 border-b border-[#E1D8C9] pb-6 flex justify-between items-start">
          <div className="flex items-center gap-4">
            {d.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.image} alt="" className="w-16 h-16 rounded-full object-cover border border-[#E1D8C9]" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#E1D8C9] flex items-center justify-center text-[#6B5E4C] font-serif text-xl">
                {d.name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-serif text-[#2C241B]">{d.name || "Unnamed Student"}</h1>
              <p className="text-[#6B5E4C] text-sm">
                Student ID: {d.studentId} {d.email && <>• {d.email}</>}
              </p>
            </div>
          </div>
          {d.isRedacted && (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 whitespace-nowrap">
              🔒 Teacher view — sensitive fields redacted
            </span>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <section className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
            <h2 className="text-xl font-serif text-[#2C241B] mb-4">Personal Details</h2>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Headline"><RedactedField value={personalDetails.headline} isRedacted={d.isRedacted} /></Field>
              <Field label="Address"><RedactedField value={personalDetails.address} isRedacted={d.isRedacted} /></Field>
              <Field label="Languages"><RedactedField value={personalDetails.languages} isRedacted={d.isRedacted} /></Field>
              <Field label="Hobbies"><RedactedField value={personalDetails.hobbies} isRedacted={d.isRedacted} /></Field>
              <Field label="Vocation"><RedactedField value={personalDetails.vocation} isRedacted={d.isRedacted} /></Field>
              <Field label="Disability Accommodations">
                <RedactedField value={personalDetails.disabilityInfo} isRedacted={d.isRedacted} />
              </Field>
            </div>
          </section>

          <section className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
            <h2 className="text-xl font-serif text-[#2C241B] mb-4">Job Preferences</h2>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Expected Salary"><RedactedField value={jobPreferences.expectedSalary} isRedacted={d.isRedacted} /></Field>
              <Field label="Availability"><RedactedField value={jobPreferences.availability} isRedacted={d.isRedacted} /></Field>
            </div>

            <h2 className="text-xl font-serif text-[#2C241B] mt-8 mb-4">Professional Background</h2>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Skills"><RedactedField value={professionalBackground.skills} isRedacted={d.isRedacted} /></Field>
              <Field label="Education"><RedactedField value={professionalBackground.education} isRedacted={d.isRedacted} /></Field>
              <Field label="Experience"><RedactedField value={professionalBackground.experience} isRedacted={d.isRedacted} /></Field>
              <Field label="Courseworks"><RedactedField value={professionalBackground.courseworks} isRedacted={d.isRedacted} /></Field>
              <Field label="Internships"><RedactedField value={professionalBackground.internships} isRedacted={d.isRedacted} /></Field>
              <Field label="Certifications"><RedactedField value={professionalBackground.certifications} isRedacted={d.isRedacted} /></Field>
            </div>
          </section>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setFullHistory((f) => !f)}
            className="text-sm font-semibold text-[#2D4A22] hover:underline"
          >
            {fullHistory ? "Show recent only (last 5)" : "View Full History"}
          </button>
        </div>

        <section className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9] mb-8">
          <h2 className="text-xl font-serif text-[#2C241B] mb-4">Job Applications</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#E1D8C9] text-[#6B5E4C] text-sm">
                  <th className="py-2 px-3 font-semibold">Job Title</th>
                  <th className="py-2 px-3 font-semibold">Company</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold">Offered Salary</th>
                  <th className="py-2 px-3 font-semibold">Rejection Reason</th>
                  <th className="py-2 px-3 font-semibold">Applied</th>
                </tr>
              </thead>
              <tbody>
                {d.jobApplications.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-[#8B7D6B] italic">No applications on record.</td></tr>
                ) : (
                  d.jobApplications.map((app) => (
                    <tr key={app.id} className="border-b border-[#F5F0E6]">
                      <td className="py-3 px-3 font-medium">{app.jobTitle}</td>
                      <td className="py-3 px-3">{app.company}</td>
                      <td className="py-3 px-3"><StatusBadge status={app.status} /></td>
                      <td className="py-3 px-3"><RedactedField value={app.offeredSalary != null ? formatINR(app.offeredSalary) : null} isRedacted={d.isRedacted} fallback="—" nullMeansRedacted /></td>
                      <td className="py-3 px-3"><RedactedField value={app.rejectionReason} isRedacted={d.isRedacted} fallback="—" /></td>
                      <td className="py-3 px-3 text-sm text-[#6B5E4C]">{new Date(app.appliedAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9] mb-8">
          <h2 className="text-xl font-serif text-[#2C241B] mb-4">Career History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#E1D8C9] text-[#6B5E4C] text-sm">
                  <th className="py-2 px-3 font-semibold">Company</th>
                  <th className="py-2 px-3 font-semibold">Role</th>
                  <th className="py-2 px-3 font-semibold">Salary</th>
                  <th className="py-2 px-3 font-semibold">Duration</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold">Next Move</th>
                </tr>
              </thead>
              <tbody>
                {d.careerHistory.length === 0 ? (
                  <tr><td colSpan={6} className="py-6 text-center text-[#8B7D6B] italic">No career history on record.</td></tr>
                ) : (
                  d.careerHistory.map((c) => (
                    <tr key={c.id} className="border-b border-[#F5F0E6]">
                      <td className="py-3 px-3 font-medium">{c.company}</td>
                      <td className="py-3 px-3">{c.role}</td>
                      <td className="py-3 px-3"><RedactedField value={c.salary != null ? formatINR(c.salary) : null} isRedacted={d.isRedacted} fallback="—" nullMeansRedacted /></td>
                      <td className="py-3 px-3 text-sm text-[#6B5E4C]">
                        {new Date(c.startDate).toLocaleDateString()} – {c.endDate ? new Date(c.endDate).toLocaleDateString() : "Present"}
                      </td>
                      <td className="py-3 px-3"><StatusBadge status={c.status} /></td>
                      <td className="py-3 px-3 text-sm">{c.nextMove || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
          <h2 className="text-xl font-serif text-[#2C241B] mb-4">Attendance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#E1D8C9] text-[#6B5E4C] text-sm">
                  <th className="py-2 px-3 font-semibold">Date</th>
                  <th className="py-2 px-3 font-semibold">Status</th>
                  <th className="py-2 px-3 font-semibold">Class / Event</th>
                </tr>
              </thead>
              <tbody>
                {d.attendance.length === 0 ? (
                  <tr><td colSpan={3} className="py-6 text-center text-[#8B7D6B] italic">No attendance records.</td></tr>
                ) : (
                  d.attendance.map((a) => (
                    <tr key={a.id} className="border-b border-[#F5F0E6]">
                      <td className="py-3 px-3 text-sm">{new Date(a.date).toLocaleDateString()}</td>
                      <td className="py-3 px-3"><StatusBadge status={a.status} /></td>
                      <td className="py-3 px-3 text-sm">{a.classOrEvent || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
