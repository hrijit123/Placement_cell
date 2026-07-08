import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import HomePortalCards from "./HomePortalCards";
import PlacementDonut from "./PlacementDonut";

export const dynamic = "force-dynamic";

const HERO_POINTS = [
  "Track student progress",
  "Manage placements efficiently",
  "Build a brighter future together",
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as string | undefined;
  const isStaff = role === "TEACHER" || role === "ADMIN";

  // Live metrics are only computed (and shown) once the visitor is signed in.
  let kpis: {
    totalStudents: number;
    eligible: number;
    placed: number;
    placementRate: number;
    activeEmployers: number;
    upcomingInterviews: number;
    inProcess: number;
    notPlaced: number;
  } | null = null;

  let recentPlacements: { id: string; student: string; company: string; role: string }[] = [];
  let scheduledInterviews: { id: string; company: string; role: string; createdAt: Date }[] = [];

  if (session) {
    const [totalStudents, eligible, placedGroups, interviewGroups, employerGroups, upcomingCount] =
      await Promise.all([
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.profile.count({ where: { user: { role: "STUDENT" }, availability: { not: null } } }),
        prisma.careerRecord.groupBy({
          by: ["profileId"],
          where: {
            OR: [
              { recordType: "INTERVIEW", interviewStatus: "OFFER_ACCEPTED" },
              { recordType: "PLACEMENT", placementStatus: "WORKING" },
            ],
          },
        }),
        prisma.careerRecord.groupBy({
          by: ["profileId"],
          where: { recordType: "INTERVIEW" },
        }),
        prisma.careerRecord.groupBy({ by: ["company"] }),
        prisma.careerRecord.count({
          where: { recordType: "INTERVIEW", interviewStatus: "SCHEDULED" },
        }),
      ]);

    const placedIds = new Set(placedGroups.map((g) => g.profileId));
    const inProcess = interviewGroups.filter((g) => !placedIds.has(g.profileId)).length;
    const placed = placedIds.size;
    const eligibleBase = eligible > 0 ? eligible : totalStudents;

    kpis = {
      totalStudents,
      eligible,
      placed,
      placementRate: eligibleBase > 0 ? Math.round((placed / eligibleBase) * 1000) / 10 : 0,
      activeEmployers: employerGroups.length,
      upcomingInterviews: upcomingCount,
      inProcess,
      notPlaced: Math.max(0, totalStudents - placed - inProcess),
    };

    // Named records are staff-only.
    if (isStaff) {
      const [placements, interviews] = await Promise.all([
        prisma.careerRecord.findMany({
          where: {
            OR: [
              { recordType: "INTERVIEW", interviewStatus: "OFFER_ACCEPTED" },
              { recordType: "PLACEMENT" },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 4,
          include: { profile: { include: { user: { select: { name: true } } } } },
        }),
        prisma.careerRecord.findMany({
          where: { recordType: "INTERVIEW", interviewStatus: "SCHEDULED" },
          orderBy: { createdAt: "desc" },
          take: 4,
          select: { id: true, company: true, role: true, createdAt: true },
        }),
      ]);
      recentPlacements = placements.map((p) => ({
        id: p.id,
        student: p.profile.user.name || "Student",
        company: p.company,
        role: p.role,
      }));
      scheduledInterviews = interviews;
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* ---- Hero ---- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-emerald-900 mb-3">
              Welcome to Deeds Connect
            </h1>
            <p className="text-lg text-stone-600 mb-8">
              Empowering Specially Abled Students Towards Meaningful Careers 💚
            </p>
            <ul className="space-y-3">
              {HERO_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-3 text-stone-700">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-emerald-600 shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <HeroIllustration />
        </section>

        {/* ---- KPI strip (signed-in only) ---- */}
        {kpis ? (
          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-12">
            <KpiCard icon="👥" title="Total Students" value={kpis.totalStudents} note="Across all cohorts" tint="bg-emerald-50" />
            <KpiCard icon="🎯" title="Eligible for Placement" value={kpis.eligible} note="Availability confirmed" tint="bg-blue-50" />
            <KpiCard icon="🎓" title="Students Placed" value={kpis.placed} note="This academic year" tint="bg-purple-50" />
            <KpiCard icon="📈" title="Placement Rate" value={`${kpis.placementRate}%`} note="Of eligible students" tint="bg-amber-50" />
            <KpiCard icon="🏢" title="Active Employers" value={kpis.activeEmployers} note="Partner companies" tint="bg-teal-50" />
            <KpiCard icon="📅" title="Upcoming Interviews" value={kpis.upcomingInterviews} note="Currently scheduled" tint="bg-rose-50" />
          </section>
        ) : (
          <section className="mb-12 bg-white border border-stone-200 rounded-2xl p-6 text-center text-stone-500 text-sm">
            🔒 Live placement metrics are visible after you sign in.
          </section>
        )}

        {/* ---- Portal cards ---- */}
        <section className="mb-12">
          <HomePortalCards signedInRole={role} />
        </section>

        {/* ---- Staff dashboard widgets ---- */}
        {kpis && isStaff && (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
            <WidgetCard title="Placement Overview">
              <PlacementDonut placed={kpis.placed} inProcess={kpis.inProcess} notPlaced={kpis.notPlaced} />
            </WidgetCard>

            <WidgetCard title="Recent Placements" footer={{ href: "/database", label: "Open Student Database" }}>
              {recentPlacements.length === 0 ? (
                <EmptyNote text="No placements recorded yet." />
              ) : (
                <ul className="divide-y divide-stone-100">
                  {recentPlacements.map((p) => (
                    <li key={p.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-stone-800 truncate">{p.student}</p>
                        <p className="text-xs text-stone-500 truncate">{p.role} · {p.company}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 shrink-0">
                        Placed
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </WidgetCard>

            <WidgetCard title="Upcoming Interviews">
              {scheduledInterviews.length === 0 ? (
                <EmptyNote text="No interviews scheduled." />
              ) : (
                <ul className="divide-y divide-stone-100">
                  {scheduledInterviews.map((i) => (
                    <li key={i.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-stone-800 truncate">{i.company}</p>
                        <p className="text-xs text-stone-500 truncate">{i.role}</p>
                      </div>
                      <span className="text-xs text-stone-500 shrink-0">
                        {new Date(i.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </WidgetCard>

            <WidgetCard title="Quick Actions">
              <ul className="space-y-2">
                <QuickAction href="/database" label="Student Database" icon="🗂️" />
                <QuickAction href="/attendance" label="Mark Attendance" icon="🗓️" />
                {role === "ADMIN" && <QuickAction href="/admin" label="Reports & Analytics" icon="📊" />}
                {role === "ADMIN" && <QuickAction href="/api/admin/export" label="Export Users CSV" icon="⬇️" />}
                <QuickAction href="/staff" label="Staff Portal" icon="🏫" />
              </ul>
            </WidgetCard>
          </section>
        )}
      </div>

      {/* ---- Footer ---- */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-stone-500">
          <p>Together, we empower dreams and build inclusive futures.</p>
          <p>© {new Date().getFullYear()} Deeds Connect | DEEDS Public Charitable Trust</p>
          <p>Made with ❤️ for Specially Abled</p>
        </div>
      </footer>
    </div>
  );
}

function KpiCard({
  icon,
  title,
  value,
  note,
  tint,
}: {
  icon: string;
  title: string;
  value: number | string;
  note: string;
  tint: string;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-3 ${tint}`}>{icon}</div>
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">{title}</p>
      <p className="text-3xl font-serif font-semibold text-stone-900">{value}</p>
      <p className="text-xs text-stone-400 mt-1">{note}</p>
    </div>
  );
}

function WidgetCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: { href: string; label: string };
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col">
      <h3 className="font-serif font-semibold text-lg text-stone-900 mb-4">{title}</h3>
      <div className="flex-grow">{children}</div>
      {footer && (
        <Link href={footer.href} className="mt-4 text-sm font-semibold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1">
          {footer.label} →
        </Link>
      )}
    </div>
  );
}

function QuickAction({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-stone-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors text-sm font-medium text-stone-700"
      >
        <span className="flex items-center gap-2.5">
          <span>{icon}</span> {label}
        </span>
        <span className="text-stone-300">›</span>
      </Link>
    </li>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-sm text-stone-400 italic py-6 text-center">{text}</p>;
}

function HeroIllustration() {
  return (
    <div className="hidden lg:flex justify-center" aria-hidden="true">
      <svg viewBox="0 0 480 300" className="w-full max-w-lg">
        {/* skyline */}
        <g fill="#e7e5e4">
          <rect x="20" y="180" width="60" height="100" rx="4" />
          <rect x="330" y="160" width="70" height="120" rx="4" />
          <rect x="410" y="200" width="50" height="80" rx="4" />
        </g>
        {/* connection arcs */}
        <path d="M110 90 Q 240 20 370 90" fill="none" stroke="#a7f3d0" strokeWidth="3" strokeDasharray="6 8" strokeLinecap="round" />
        {/* icon bubbles */}
        <g>
          <circle cx="110" cy="95" r="30" fill="#d1fae5" />
          <text x="110" y="105" textAnchor="middle" fontSize="26">🎓</text>
        </g>
        <g>
          <circle cx="240" cy="52" r="30" fill="#d1fae5" />
          <text x="240" y="62" textAnchor="middle" fontSize="26">💼</text>
        </g>
        <g>
          <circle cx="370" cy="95" r="30" fill="#d1fae5" />
          <text x="370" y="105" textAnchor="middle" fontSize="26">🤝</text>
        </g>
        {/* people */}
        <g>
          <circle cx="140" cy="185" r="26" fill="#065f46" />
          <rect x="108" y="212" width="64" height="68" rx="26" fill="#047857" />
          <circle cx="240" cy="175" r="26" fill="#065f46" />
          <rect x="208" y="202" width="64" height="78" rx="26" fill="#059669" />
          <rect x="196" y="238" width="88" height="42" rx="8" fill="#d6d3d1" />
          <circle cx="340" cy="185" r="26" fill="#065f46" />
          <rect x="308" y="212" width="64" height="68" rx="26" fill="#047857" />
        </g>
        {/* plants */}
        <g stroke="#34d399" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M60 280 q0 -24 -14 -34" />
          <path d="M60 280 q0 -18 12 -28" />
          <path d="M430 280 q0 -24 14 -34" />
          <path d="M430 280 q0 -18 -12 -28" />
        </g>
        <rect x="0" y="280" width="480" height="4" rx="2" fill="#e7e5e4" />
      </svg>
    </div>
  );
}
