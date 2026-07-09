import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import UserManagementTable from "./UserManagementTable"
import ChartsSection from "./ChartsSection"
import CohortManagementTab from "./CohortManagementTab"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/')
  const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!adminUser || adminUser.role !== 'ADMIN' || adminUser.status !== 'ACTIVE') redirect('/')

  const [totalUsers, totalStudents, totalRecruiters, totalJobs, totalApplications, recentApplications] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'RECRUITER' } }),
    prisma.job.count(),
    prisma.careerRecord.count({ where: { recordType: 'INTERVIEW', verification: 'VERIFIED' } }),
    prisma.careerRecord.findMany({
      take: 5,
      where: { recordType: 'INTERVIEW', verification: 'VERIFIED' },
      orderBy: { createdAt: 'desc' },
      include: {
        profile: { include: { user: true } }
      }
    })
  ])

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const [funnelRaw, employersRaw, attendanceRaw, recentApps, placedStudents, workingNow, salaryAgg, activeStudents, placementRecords] = await Promise.all([
    prisma.careerRecord.groupBy({ by: ['interviewStatus'], where: { recordType: 'INTERVIEW', verification: 'VERIFIED' }, _count: { _all: true } }),
    prisma.careerRecord.groupBy({
      by: ['company'],
      where: { recordType: 'PLACEMENT', verification: 'VERIFIED' },
      _count: { _all: true },
      orderBy: { _count: { company: 'desc' } },
      take: 5
    }),
    prisma.attendance.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.careerRecord.findMany({
      where: { recordType: 'INTERVIEW', verification: 'VERIFIED', createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    }),
    prisma.careerRecord.groupBy({
      by: ['profileId'],
      where: { recordType: 'INTERVIEW', interviewStatus: 'OFFER_ACCEPTED', verification: 'VERIFIED' }
    }),
    prisma.careerRecord.count({ where: { recordType: 'PLACEMENT', placementStatus: 'WORKING', verification: 'VERIFIED' } }),
    prisma.careerRecord.aggregate({ where: { verification: 'VERIFIED' }, _avg: { salary: true } }),
    prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
    prisma.careerRecord.findMany({
      where: { recordType: 'PLACEMENT', verification: 'VERIFIED' },
      select: { profileId: true, startDate: true, createdAt: true }
    })
  ])

  const STATUS_ORDER = [
    'APPLIED', 'SCHEDULED', 'ATTENDED', 'NO_SHOW',
    'OFFER_EXTENDED', 'OFFER_ACCEPTED', 'OFFER_REJECTED_BY_STUDENT', 'REJECTED_BY_COMPANY'
  ]
  const funnel = STATUS_ORDER
    .map(status => ({
      status: status.replaceAll('_', ' '),
      count: funnelRaw.find((f: any) => f.interviewStatus === status)?._count._all ?? 0
    }))
    .filter((f: any) => f.count > 0)

  const topEmployers = employersRaw.map((e: any) => ({ company: e.company, placements: e._count._all }))
  const attendance = attendanceRaw.map((a: any) => ({ status: a.status, count: a._count._all }))

  const monthly: { month: string; applications: number }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo)
    d.setMonth(d.getMonth() + i)
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    monthly.push({
      month: label,
      applications: recentApps.filter((a: any) =>
        a.createdAt.getMonth() === d.getMonth() && a.createdAt.getFullYear() === d.getFullYear()
      ).length
    })
  }

  const placementRate = totalStudents > 0 ? Math.round((placedStudents.length / totalStudents) * 100) : 0
  const avgSalary = salaryAgg._avg.salary

  // Overall attendance %: Present + Late over all non-leave records.
  const attCount = (status: string) => attendanceRaw.find((a: any) => a.status === status)?._count._all ?? 0
  const attTotal = attendanceRaw.reduce((sum: number, a: any) => sum + a._count._all, 0)
  const attDenominator = attTotal - attCount('LEAVE')
  const attendancePct = attDenominator > 0
    ? Math.round(((attCount('PRESENT') + attCount('LATE')) / attDenominator) * 1000) / 10
    : null

  // Alumni employed year-wise: distinct students placed, by placement start year.
  const alumniYearMap = new Map<string, Set<string>>()
  for (const p of placementRecords) {
    const year = String(new Date(p.startDate ?? p.createdAt).getFullYear())
    if (!alumniYearMap.has(year)) alumniYearMap.set(year, new Set())
    alumniYearMap.get(year)!.add(p.profileId)
  }
  const alumniByYear = [...alumniYearMap.entries()]
    .map(([year, profiles]) => ({ year, count: profiles.size }))
    .sort((a, b) => a.year.localeCompare(b.year))

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b border-[#E1D8C9] pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-serif text-[#2C241B] mb-2">Management Dashboard</h1>
            <p className="text-[#6B5E4C]">Spotless Record & Platform Analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin/staff" className="text-sm px-4 py-2 border border-[#E1D8C9] rounded hover:bg-white text-[#2C241B] font-medium">
              Teacher Records
            </a>
            <a href="/syllabus" className="text-sm px-4 py-2 border border-[#E1D8C9] rounded hover:bg-white text-[#2C241B] font-medium">
              Syllabus Tracker
            </a>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard title="Total Students" value={totalStudents} />
          <StatCard title="Active Students" value={activeStudents} />
          <StatCard title="Attendance %" value={attendancePct != null ? `${attendancePct}%` : '—'} />
          <StatCard title="Active Recruiters" value={totalRecruiters} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard title="Jobs Posted" value={totalJobs} />
          <StatCard title="Applications Logged" value={totalApplications} />
          <StatCard title="Placement Rate" value={`${placementRate}%`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard title="Students Placed" value={placedStudents.length} />
          <StatCard title="Currently Employed" value={workingNow} />
          <StatCard title="Avg. Placement Salary" value={avgSalary != null ? `₹${Math.round(avgSalary).toLocaleString('en-IN')}` : '—'} />
        </div>

        <ChartsSection funnel={funnel} topEmployers={topEmployers} attendance={attendance} monthly={monthly} alumni={alumniByYear} />

        <section className="bg-white p-8 rounded shadow-sm border border-[#E1D8C9]">
          <h2 className="text-2xl font-serif text-[#2C241B] mb-6">Recent Applications Record</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#E1D8C9] text-[#6B5E4C]">
                  <th className="py-3 px-4 font-semibold">Student</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Company</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#8B7D6B] italic">No applications on record yet.</td>
                  </tr>
                ) : (
                  recentApplications.map((app: any) => (
                    <tr key={app.id} className="border-b border-[#F5F0E6] hover:bg-[#FAF8F3] transition-colors">
                      <td className="py-4 px-4">{app.profile?.user?.name || 'Unknown'}</td>
                      <td className="py-4 px-4 font-medium">{app.role}</td>
                      <td className="py-4 px-4">{app.company}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F0E5] text-[#2D4A22]">
                          {app.interviewStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-[#6B5E4C]">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white p-8 rounded shadow-sm border border-[#E1D8C9] mt-12 mb-12">
          <CohortManagementTab />
        </section>

        <UserManagementTable />
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9] flex flex-col justify-center items-center">
      <h3 className="text-[#6B5E4C] text-sm uppercase tracking-wider mb-2">{title}</h3>
      <p className="text-4xl font-serif text-[#2C241B]">{value}</p>
    </div>
  )
}
