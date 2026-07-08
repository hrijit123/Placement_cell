import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import UserManagementTable from "./UserManagementTable"
import AuditLogsTable from "./AuditLogsTable"
import ChartsSection from "./ChartsSection"
import { Users, UserCheck, CalendarCheck, Briefcase, Building, GraduationCap, CheckCircle } from "lucide-react"

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect('/')
  const adminUser = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!adminUser || adminUser.role !== 'ADMIN' || adminUser.status !== 'ACTIVE') redirect('/')

  const [
    totalStudents,
    activeStudents,
    allAttendance,
    eligibleStudents,
    allCareers,
    auditLogs
  ] = await Promise.all([
    prisma.profile.count(),
    prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
    prisma.attendance.findMany(),
    prisma.profile.count({ where: { isEligibleForPlacement: true } }),
    prisma.careerRecord.findMany(),
    prisma.recordAuditLog.findMany({
      take: 50,
      orderBy: { timestamp: 'desc' },
      include: {
        actor: true,
        profile: { include: { user: true } }
      }
    })
  ])

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const [funnelRaw, employersRaw, recentApps] = await Promise.all([
    prisma.careerRecord.groupBy({ by: ['interviewStatus'], where: { recordType: 'INTERVIEW' }, _count: { _all: true } }),
    prisma.careerRecord.groupBy({
      by: ['company'],
      where: { recordType: 'PLACEMENT' },
      _count: { _all: true },
      orderBy: { _count: { company: 'desc' } },
      take: 5
    }),
    prisma.careerRecord.findMany({
      where: { recordType: 'INTERVIEW', createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true }
    })
  ])

  const presentCount = allAttendance.filter(a => a.status === "PRESENT").length;
  const attendancePct = allAttendance.length ? ((presentCount / allAttendance.length) * 100).toFixed(1) : 0;

  const placedStudentsProfiles = new Set(allCareers.filter(c => c.recordType === "PLACEMENT" && c.placementStatus === "WORKING").map(c => c.profileId));
  const studentsPlaced = placedStudentsProfiles.size;

  const activeEmployers = new Set(allCareers.map(c => c.company)).size;

  const alumniByYearRaw = allCareers.filter(c => c.recordType === "PLACEMENT" && c.placementStatus === "WORKING" && c.startDate);
  
  const alumniByYear = alumniByYearRaw.reduce((acc: any, curr) => {
    const year = new Date(curr.startDate!).getFullYear();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {});

  const alumniYearList = Object.keys(alumniByYear).map(year => ({
    year,
    count: alumniByYear[year]
  })).sort((a, b) => Number(b.year) - Number(a.year));

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
  
  // Create attendance pie chart format directly from allAttendance
  let present = 0;
  let absent = 0;
  let late = 0;
  let leave = 0;
  allAttendance.forEach(a => {
    if (a.status === 'PRESENT') present++;
    if (a.status === 'ABSENT') absent++;
    if (a.status === 'LATE') late++;
    if (a.status === 'LEAVE') leave++;
  });
  const attendance = [
    { status: 'PRESENT', count: present },
    { status: 'ABSENT', count: absent },
    { status: 'LATE', count: late },
    { status: 'LEAVE', count: leave },
  ].filter(a => a.count > 0);

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

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 border-b border-[#E1D8C9] pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-serif text-[#2C241B] mb-2 font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-[#6B5E4C]">Platform Analytics & Global Management</p>
          </div>
          <div className="text-sm text-[#8B7D6B] font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-stone-200">
            Data updated in real-time
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-12">
          <StatCard title="Total Students" value={totalStudents} icon={<Users className="w-5 h-5 text-blue-600" />} />
          <StatCard title="Active Students" value={activeStudents} icon={<UserCheck className="w-5 h-5 text-green-600" />} />
          <StatCard title="Attendance %" value={`${attendancePct}%`} icon={<CalendarCheck className="w-5 h-5 text-purple-600" />} />
          <StatCard title="Eligible for Placement" value={eligibleStudents} icon={<CheckCircle className="w-5 h-5 text-amber-600" />} />
          <StatCard title="Students Placed" value={studentsPlaced} icon={<Briefcase className="w-5 h-5 text-emerald-600" />} />
          <StatCard title="Active Employers" value={activeEmployers} icon={<Building className="w-5 h-5 text-indigo-600" />} />
        </div>

        <ChartsSection funnel={funnel} topEmployers={topEmployers} attendance={attendance} monthly={monthly} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-[#E1D8C9]">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-serif text-[#2C241B] font-semibold">Alumni Employed</h2>
            </div>
            
            {alumniYearList.length === 0 ? (
              <p className="text-stone-500 text-sm text-center py-8">No alumni placement data available yet.</p>
            ) : (
              <div className="space-y-4">
                {alumniYearList.map((item) => (
                  <div key={item.year} className="flex justify-between items-center p-3 hover:bg-stone-50 rounded-lg transition-colors border border-transparent hover:border-stone-100">
                    <span className="font-semibold text-stone-700 text-lg">{item.year}</span>
                    <span className="bg-[#2D4A22] text-white font-bold px-4 py-1 rounded-full text-sm">
                      {item.count} {item.count === 1 ? 'Student' : 'Students'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="lg:col-span-2 space-y-8">
            <UserManagementTable />
          </div>
        </div>

        <AuditLogsTable logs={auditLogs} />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number | string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E1D8C9] flex flex-col hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-stone-500 text-xs font-bold uppercase tracking-wider leading-tight w-2/3">{title}</h3>
        <div className="p-2 bg-stone-50 rounded-lg border border-stone-100">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-serif text-[#2C241B] font-bold mt-auto">{value}</p>
    </div>
  )
}
