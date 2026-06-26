import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import UserManagementTable from "./UserManagementTable"

export default async function AdminDashboard() {
  // In a real app, we would verify the user is logged in and has the ADMIN role here.
  // const session = await getServerSession(authOptions)
  // if (!session || session.user.role !== 'ADMIN') redirect('/')

  // Fetch critical statistics for the management dashboard
  const totalCandidates = await prisma.user.count({ where: { role: 'CANDIDATE' } })
  const totalRecruiters = await prisma.user.count({ where: { role: 'RECRUITER' } })
  const totalJobs = await prisma.job.count()
  const totalApplications = await prisma.application.count()

  // Fetch recent applications for the spotless record
  const recentApplications = await prisma.application.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      candidate: true,
      job: { include: { recruiter: true } }
    }
  })

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b border-[#E1D8C9] pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-serif text-[#2C241B] mb-2">Management Dashboard</h1>
            <p className="text-[#6B5E4C]">Spotless Record & Platform Analytics</p>
          </div>
          <div className="text-sm text-[#8B7D6B]">
            Data updated in real-time
          </div>
        </header>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Candidates" value={totalCandidates} />
          <StatCard title="Active Recruiters" value={totalRecruiters} />
          <StatCard title="Jobs Posted" value={totalJobs} />
          <StatCard title="Applications Submitted" value={totalApplications} />
        </div>

        {/* Spotless Record: Recent Activity */}
        <section className="bg-white p-8 rounded shadow-sm border border-[#E1D8C9]">
          <h2 className="text-2xl font-serif text-[#2C241B] mb-6">Recent Applications Record</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#E1D8C9] text-[#6B5E4C]">
                  <th className="py-3 px-4 font-semibold">Candidate</th>
                  <th className="py-3 px-4 font-semibold">Job Title</th>
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
                  recentApplications.map((app) => (
                    <tr key={app.id} className="border-b border-[#F5F0E6] hover:bg-[#FAF8F3] transition-colors">
                      <td className="py-4 px-4">{app.candidate.name}</td>
                      <td className="py-4 px-4 font-medium">{app.job.title}</td>
                      <td className="py-4 px-4">{app.job.company}</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F0E5] text-[#2D4A22]">
                          {app.status}
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

        {/* User Management Section */}
        <UserManagementTable />
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9] flex flex-col justify-center items-center">
      <h3 className="text-[#6B5E4C] text-sm uppercase tracking-wider mb-2">{title}</h3>
      <p className="text-4xl font-serif text-[#2C241B]">{value}</p>
    </div>
  )
}
