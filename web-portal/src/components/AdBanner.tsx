"use client";

import { useState } from "react";

type AdBannerProps = {
  // You will replace this with actual AdSense client IDs or script logic later.
  adNetwork?: "adsense" | "custom";
};

export default function AdBanner({ adNetwork = "custom" }: AdBannerProps) {
  const [closed, setClosed] = useState(false);

  if (closed) return null;

  return (
    <div className="w-full bg-[#FAF8F3] border-t border-[#E1D8C9] py-3 px-4 text-center relative flex items-center justify-center gap-4 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest absolute left-4">Advertisement</span>
      
      {/* Placeholder for the actual Ad unit (e.g., Google AdSense <ins> tag) */}
      <div className="text-sm text-stone-600 font-medium">
        Support Deeds Connect — <a href="#" className="text-[#2D4A22] hover:underline">Click here to learn more</a>
      </div>

      <button 
        onClick={() => setClosed(true)}
        className="absolute right-4 text-stone-400 hover:text-stone-700 font-bold px-2"
        aria-label="Close ad"
      >
        &times;
      </button>
    </div>
  );
}
