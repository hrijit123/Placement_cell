"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-center p-10 font-sans">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-red-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <h1 className="text-3xl font-serif text-[#2C241B] mb-3">Something went wrong</h1>
      <p className="text-[#6B5E4C] max-w-md mb-2">
        An unexpected error occurred while loading this page. Your data is safe — this is usually temporary.
      </p>
      {error.digest && (
        <p className="text-xs text-[#8B7D6B] font-mono mb-6">Error reference: {error.digest}</p>
      )}
      <div className="flex gap-4 mt-4">
        <button
          onClick={() => unstable_retry()}
          className="px-6 py-3 bg-[#2D4A22] text-white rounded-full font-semibold hover:bg-[#1f3418] transition-colors shadow-sm"
        >
          Try Again
        </button>
        <a
          href="/"
          className="px-6 py-3 border border-[#E1D8C9] text-[#2C241B] rounded-full font-semibold hover:bg-white transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
