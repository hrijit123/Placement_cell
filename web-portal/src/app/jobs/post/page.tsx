"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PostJob() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        router.push("/jobs");
      } else {
        alert("Failed to post job");
      }
    } catch (error) {
      alert("Error submitting job");
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] p-10 font-sans">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 border-b border-[#E1D8C9] pb-6">
          <h1 className="text-4xl font-serif text-[#2C241B] mb-2">Post a New Opportunity</h1>
          <p className="text-[#6B5E4C]">Publish a job to the Deaf Empowerment portal.</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-sm border border-[#E1D8C9]">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#6B5E4C] mb-2 uppercase tracking-wider">Job Title</label>
              <input 
                type="text" 
                name="title" 
                required
                value={formData.title} 
                onChange={handleChange} 
                className="w-full p-3 border border-[#E1D8C9] rounded bg-[#FAF8F3] focus:outline-none focus:border-[#8B7D6B] transition-colors"
                placeholder="Senior ISL UI Engineer"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#6B5E4C] mb-2 uppercase tracking-wider">Company Name</label>
                <input 
                  type="text" 
                  name="company" 
                  required
                  value={formData.company} 
                  onChange={handleChange} 
                  className="w-full p-3 border border-[#E1D8C9] rounded bg-[#FAF8F3] focus:outline-none focus:border-[#8B7D6B] transition-colors"
                  placeholder="Tech Corp India"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#6B5E4C] mb-2 uppercase tracking-wider">Location</label>
                <input 
                  type="text" 
                  name="location" 
                  required
                  value={formData.location} 
                  onChange={handleChange} 
                  className="w-full p-3 border border-[#E1D8C9] rounded bg-[#FAF8F3] focus:outline-none focus:border-[#8B7D6B] transition-colors"
                  placeholder="Mumbai (Hybrid)"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#6B5E4C] mb-2 uppercase tracking-wider">Job Description</label>
              <textarea 
                name="description" 
                required
                value={formData.description} 
                onChange={handleChange} 
                rows={8}
                className="w-full p-3 border border-[#E1D8C9] rounded bg-[#FAF8F3] focus:outline-none focus:border-[#8B7D6B] transition-colors"
                placeholder="Describe the responsibilities, requirements, and benefits..."
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-[#2D4A22] text-[#FDFBF7] font-semibold rounded hover:bg-[#3C5A31] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Publishing..." : "Publish Job Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
