import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-center p-10 font-sans">
      <p className="text-7xl font-serif text-[#E1D8C9] font-bold mb-4">404</p>
      <h1 className="text-3xl font-serif text-[#2C241B] mb-3">Page not found</h1>
      <p className="text-[#6B5E4C] max-w-md mb-8">
        The page you are looking for doesn&apos;t exist or may have been moved.
        Check the address, or head back to the portal.
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
