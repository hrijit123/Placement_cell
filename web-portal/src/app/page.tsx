import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] font-sans selection:bg-[#2D4A22] selection:text-white flex flex-col">
      {/* Navigation */}
      <nav className="w-full p-6 flex justify-between items-center border-b border-[#E1D8C9] bg-[#FAF8F3]">
        <div className="text-2xl font-serif text-[#2C241B] font-semibold tracking-wide">ISL Connect</div>
        <div className="flex gap-6 text-sm font-semibold tracking-wider uppercase text-[#6B5E4C]">
          <Link href="/jobs" className="hover:text-[#2D4A22] transition-colors">Jobs</Link>
          <Link href="/resume" className="hover:text-[#2D4A22] transition-colors">Resume AI</Link>
          <Link href="/interview" className="hover:text-[#2D4A22] transition-colors">Interview Room</Link>
          <Link href="/admin" className="hover:text-[#2D4A22] transition-colors">Admin</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-10 max-w-5xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-serif text-[#2C241B] mb-6 leading-tight">
          Empowering <br/> <span className="text-[#2D4A22]">Deaf Talent.</span>
        </h1>
        <p className="text-xl text-[#6B5E4C] max-w-2xl mb-12 leading-relaxed">
          The premier portal connecting exceptional deaf professionals with inclusive organizations. Featuring real-time Indian Sign Language AI translation for seamless interviews.
        </p>

        <div className="flex flex-col sm:flex-row gap-6">
          <Link href="/jobs" className="px-8 py-4 bg-[#2C241B] text-[#FDFBF7] font-semibold rounded shadow-lg hover:bg-[#1A1510] transition-transform hover:-translate-y-1 text-lg">
            Find Opportunities
          </Link>
          <Link href="/jobs/post" className="px-8 py-4 bg-[#FDFBF7] text-[#2C241B] border-2 border-[#2C241B] font-semibold rounded shadow-sm hover:bg-[#FAF8F3] transition-transform hover:-translate-y-1 text-lg">
            Post a Job
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left w-full border-t border-[#E1D8C9] pt-16">
          <div>
            <h3 className="text-2xl font-serif text-[#2C241B] mb-3">AI Resume Builder</h3>
            <p className="text-[#6B5E4C]">Our Gemini AI improves your text and formats it into a professional LaTeX PDF, ready for top-tier companies.</p>
          </div>
          <div>
            <h3 className="text-2xl font-serif text-[#2C241B] mb-3">Live ISL Translation</h3>
            <p className="text-[#6B5E4C]">Seamlessly interview with recruiters using our live computer vision AI that translates Indian Sign Language to text in real-time.</p>
          </div>
          <div>
            <h3 className="text-2xl font-serif text-[#2C241B] mb-3">Inclusive Network</h3>
            <p className="text-[#6B5E4C]">Discover institutes and companies dedicated to accessibility, fostering a truly equitable workplace.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full p-8 text-center text-[#8B7D6B] border-t border-[#E1D8C9] bg-[#FAF8F3] text-sm">
        &copy; {new Date().getFullYear()} ISL Connect. All rights reserved. Earth-toned aesthetic.
      </footer>
    </div>
  );
}
