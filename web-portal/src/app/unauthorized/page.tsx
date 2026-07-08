import Link from "next/link";

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-center p-10 font-sans">
      <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-amber-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
      <h1 className="text-3xl font-serif text-[#2C241B] mb-3">Access Restricted</h1>
      <p className="text-[#6B5E4C] max-w-md mb-8">
        You don&apos;t have permission to view this record. Students can only
        view their own dossier; staff access is limited to assigned cohorts.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-[#2D4A22] text-white rounded-full font-semibold hover:bg-[#1f3418] transition-colors shadow-sm"
      >
        Return Home
      </Link>
    </div>
  );
}
