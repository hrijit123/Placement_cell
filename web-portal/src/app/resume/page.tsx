"use client";

import { useState } from "react";

export default function ResumeBuilder() {
  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    education: "",
    experience: "",
    skills: ""
  });
  const [isImproving, setIsImproving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const improveText = async () => {
    if (!formData.experience) return alert("Please enter some experience first.");
    setIsImproving(true);
    try {
      const res = await fetch("/api/improve-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: formData.experience })
      });
      const data = await res.json();
      if (data.improvedText) {
        setFormData({ ...formData, experience: data.improvedText });
      } else {
        alert("Failed to improve text.");
      }
    } catch (e) {
      alert("Error improving text.");
    }
    setIsImproving(false);
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${formData.name.replace(/\s+/g, "_")}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      alert("Error generating PDF.");
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 border-b border-[#E1D8C9] pb-6">
          <h1 className="text-4xl font-serif text-[#2C241B] mb-2">Resume Builder & Improver</h1>
          <p className="text-[#6B5E4C]">Craft a flawless, professional resume backed by AI and exported via LaTeX.</p>
        </header>

        <div className="bg-white p-8 rounded shadow-sm border border-[#E1D8C9]">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#6B5E4C] mb-2 uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className="w-full p-3 border border-[#E1D8C9] rounded bg-[#FAF8F3] focus:outline-none focus:border-[#8B7D6B] transition-colors"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#6B5E4C] mb-2 uppercase tracking-wider">Professional Headline</label>
              <input 
                type="text" 
                name="headline" 
                value={formData.headline} 
                onChange={handleChange} 
                className="w-full p-3 border border-[#E1D8C9] rounded bg-[#FAF8F3] focus:outline-none focus:border-[#8B7D6B] transition-colors"
                placeholder="Software Engineer | ISL Translator Specialist"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#6B5E4C] mb-2 uppercase tracking-wider">Education</label>
              <textarea 
                name="education" 
                value={formData.education} 
                onChange={handleChange} 
                rows={3}
                className="w-full p-3 border border-[#E1D8C9] rounded bg-[#FAF8F3] focus:outline-none focus:border-[#8B7D6B] transition-colors"
                placeholder="B.Tech in Computer Science, University Name (2020 - 2024)"
              />
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-semibold text-[#6B5E4C] uppercase tracking-wider">Experience</label>
                <button 
                  onClick={improveText} 
                  disabled={isImproving}
                  className="text-xs font-semibold px-3 py-1 bg-[#2C241B] text-[#FDFBF7] rounded hover:bg-[#4A3F35] transition-colors disabled:opacity-50"
                >
                  {isImproving ? "Improving..." : "✨ Improve with AI"}
                </button>
              </div>
              <textarea 
                name="experience" 
                value={formData.experience} 
                onChange={handleChange} 
                rows={6}
                className="w-full p-3 border border-[#E1D8C9] rounded bg-[#FAF8F3] focus:outline-none focus:border-[#8B7D6B] transition-colors"
                placeholder="Describe your work experience here. Don't worry about perfect grammar—the AI will fix it."
              />
              <p className="text-xs text-[#8B7D6B] mt-2">The AI will restructure your experience into powerful, action-oriented bullet points.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#6B5E4C] mb-2 uppercase tracking-wider">Skills</label>
              <input 
                type="text" 
                name="skills" 
                value={formData.skills} 
                onChange={handleChange} 
                className="w-full p-3 border border-[#E1D8C9] rounded bg-[#FAF8F3] focus:outline-none focus:border-[#8B7D6B] transition-colors"
                placeholder="Python, Next.js, OpenCV, Machine Learning..."
              />
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#E1D8C9] flex justify-end">
            <button 
              onClick={generatePDF}
              disabled={isGenerating || !formData.name}
              className="px-6 py-3 bg-[#2D4A22] text-[#FDFBF7] font-semibold rounded hover:bg-[#3C5A31] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? "Compiling LaTeX PDF..." : "Generate Professional PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
