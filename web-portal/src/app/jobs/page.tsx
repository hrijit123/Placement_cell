import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function JobFeed() {
  const jobs = await prisma.job.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      recruiter: true
    }
  })

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 border-b border-[#E1D8C9] pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-serif text-[#2C241B] mb-2">Professional Job Board</h1>
            <p className="text-[#6B5E4C]">Discover opportunities and advance your career.</p>
          </div>
          <div>
            <Link 
              href="/jobs/post" 
              className="px-4 py-2 border border-[#8B7D6B] text-[#4A3F35] rounded hover:bg-[#E1D8C9] transition-colors text-sm font-semibold"
            >
              Recruiter? Post a Job
            </Link>
          </div>
        </header>

        <div className="space-y-6">
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-[#8B7D6B] italic border border-[#E1D8C9] rounded bg-white">
              No active job postings at the moment. Please check back later.
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="bg-white p-8 rounded shadow-sm border border-[#E1D8C9] flex justify-between items-start hover:shadow-md transition-shadow">
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-serif text-[#2C241B] mb-1">{job.title}</h2>
                  <p className="text-[#6B5E4C] font-semibold mb-4">{job.company} • {job.location}</p>
                  
                  <p className="text-[#4A3F35] leading-relaxed mb-6 whitespace-pre-wrap">
                    {job.description}
                  </p>

                  <div className="flex gap-4 text-xs font-semibold uppercase tracking-wider text-[#8B7D6B]">
                    <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                    <span>Posted by: {job.recruiter.name}</span>
                  </div>
                </div>
                
                <div>
                  <button className="px-8 py-3 bg-[#2D4A22] text-[#FDFBF7] font-semibold rounded hover:bg-[#3C5A31] transition-colors shadow-sm">
                    Apply Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
