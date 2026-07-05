"use client";

import { useCallback, useEffect, useState } from "react";

export default function DatabaseRecordView({ studentId }: { studentId: string }) {
  const [state, setState] = useState<any>({ status: "loading" });
  const [activeTab, setActiveTab] = useState<"transcripts" | "tracker">("transcripts");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  
  const [trackerForm, setTrackerForm] = useState({
    type: "INTERVIEW",
    company: "",
    role: "",
    status: "APPLIED",
    salary: "",
    startDate: new Date().toISOString().split("T")[0],
    rejectionReason: "",
    nextMove: ""
  });

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/ngo/students/${encodeURIComponent(studentId)}?full=true`);
      const data = await res.json();
      if (res.ok) {
        setState({ status: "success", data });
        setEditForm({
          headline: data.personalDetails.headline || "",
          address: data.personalDetails.address || "",
          languages: data.personalDetails.languages || "",
          hobbies: data.personalDetails.hobbies || "",
          vocation: data.personalDetails.vocation || "",
          disabilityInfo: data.personalDetails.disabilityInfo || "",
          skills: data.professionalBackground.skills || "",
          education: data.professionalBackground.education || "",
          experience: data.professionalBackground.experience || "",
          courseworks: data.professionalBackground.courseworks || "",
          internships: data.professionalBackground.internships || "",
          certifications: data.professionalBackground.certifications || "",
        });
      } else {
        setState({ status: "error", message: data.error });
      }
    } catch {
      setState({ status: "error", message: "Network error" });
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const saveTranscripts = async () => {
    await fetch(`/api/ngo/students/${encodeURIComponent(studentId)}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm)
    });
    setIsEditing(false);
    load();
  };

  const saveTracker = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/ngo/students/${encodeURIComponent(studentId)}/tracker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trackerForm)
    });
    setTrackerForm({ ...trackerForm, company: "", role: "", salary: "", rejectionReason: "" });
    load();
  };

  if (state.status === "loading") return <div className="min-h-screen p-10 bg-[#FDFBF7]">Loading...</div>;
  if (state.status === "error") return <div className="min-h-screen p-10 bg-[#FDFBF7]">Error: {state.message}</div>;

  const d = state.data;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 border-b border-[#E1D8C9] pb-6 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-serif text-[#2C241B]">{d.name || "Unknown Student"}</h1>
            <p className="text-[#6B5E4C] mt-1 font-mono text-sm">Universal ID: {d.studentId}</p>
          </div>
          <a href="/database" className="px-4 py-2 border border-[#E1D8C9] rounded text-sm hover:bg-white transition-colors">
            Back to Search
          </a>
        </header>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[#E1D8C9]">
          <button 
            onClick={() => setActiveTab("transcripts")}
            className={`px-6 py-3 font-semibold text-lg border-b-2 ${activeTab === "transcripts" ? "border-[#2C241B] text-[#2C241B]" : "border-transparent text-[#8B7D6B] hover:text-[#2C241B]"}`}
          >
            Transcripts & Information
          </button>
          <button 
            onClick={() => setActiveTab("tracker")}
            className={`px-6 py-3 font-semibold text-lg border-b-2 ${activeTab === "tracker" ? "border-[#2C241B] text-[#2C241B]" : "border-transparent text-[#8B7D6B] hover:text-[#2C241B]"}`}
          >
            Placement Tracker
          </button>
        </div>

        {activeTab === "transcripts" && (
          <div className="bg-white p-8 rounded shadow-sm border border-[#E1D8C9]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-serif text-[#2C241B]">Student Database Record</h2>
              <button 
                onClick={() => isEditing ? saveTranscripts() : setIsEditing(true)}
                className="px-4 py-2 bg-[#2D4A22] text-white rounded text-sm font-semibold hover:bg-[#1f3418]"
              >
                {isEditing ? "Save Changes" : "Edit Data"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {Object.keys(editForm).map((key) => (
                <div key={key}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  {isEditing ? (
                    <textarea 
                      value={editForm[key]} 
                      onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                      className="w-full border border-[#E1D8C9] rounded p-2 text-[#3E362E] min-h-[60px]"
                    />
                  ) : (
                    <div className="text-[#3E362E] min-h-[60px] p-2 bg-[#FAF8F3] rounded border border-transparent">
                      {editForm[key] || <span className="text-gray-400 italic">Not provided</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tracker" && (
          <div className="space-y-8">
            <form onSubmit={saveTracker} className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
              <h2 className="text-xl font-serif text-[#2C241B] mb-4">Add Tracker Record</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#6B5E4C]">Record Type</label>
                  <select 
                    value={trackerForm.type} 
                    onChange={e => setTrackerForm({...trackerForm, type: e.target.value})}
                    className="w-full border p-2 rounded"
                  >
                    <option value="INTERVIEW">Interview / Application</option>
                    <option value="CAREER">Career Placement (Hired)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#6B5E4C]">Company Name</label>
                  <input required value={trackerForm.company} onChange={e => setTrackerForm({...trackerForm, company: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#6B5E4C]">Role / Position</label>
                  <input required value={trackerForm.role} onChange={e => setTrackerForm({...trackerForm, role: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#6B5E4C]">Status</label>
                  <select value={trackerForm.status} onChange={e => setTrackerForm({...trackerForm, status: e.target.value})} className="w-full border p-2 rounded">
                    {trackerForm.type === "INTERVIEW" ? (
                      <>
                        <option value="APPLIED">Applied</option>
                        <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                        <option value="INTERVIEW_ATTENDED">Interview Attended</option>
                        <option value="REJECTED_BY_COMPANY">Rejected by Company</option>
                        <option value="OFFER_REJECTED_BY_STUDENT">Offer Rejected by Student</option>
                      </>
                    ) : (
                      <>
                        <option value="WORKING">Working (Current)</option>
                        <option value="RESIGNED">Resigned</option>
                        <option value="TERMINATED">Terminated</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#6B5E4C]">Salary / Offer (Optional)</label>
                  <input type="number" value={trackerForm.salary} onChange={e => setTrackerForm({...trackerForm, salary: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                {trackerForm.status.includes("REJECTED") && (
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#6B5E4C]">Rejection Reason</label>
                    <input value={trackerForm.rejectionReason} onChange={e => setTrackerForm({...trackerForm, rejectionReason: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                )}
                {trackerForm.type === "CAREER" && trackerForm.status !== "WORKING" && (
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#6B5E4C]">Next Move (Where are they now?)</label>
                    <input value={trackerForm.nextMove} onChange={e => setTrackerForm({...trackerForm, nextMove: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                )}
              </div>
              <button type="submit" className="bg-[#2C241B] text-white px-6 py-2 rounded text-sm font-semibold hover:bg-black">
                Save Record
              </button>
            </form>

            <div className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
              <h2 className="text-xl font-serif text-[#2C241B] mb-4">Historical Tracker</h2>
              
              <h3 className="text-sm font-semibold uppercase text-[#8B7D6B] mb-2 mt-6">Interviews & Applications</h3>
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-[#FAF8F3]"><th className="p-2">Role</th><th className="p-2">Company</th><th className="p-2">Status</th><th className="p-2">Rejection Reason</th></tr></thead>
                <tbody>
                  {d.jobApplications.map((app: any) => (
                    <tr key={app.id} className="border-b"><td className="p-2">{app.jobTitle}</td><td className="p-2">{app.company}</td><td className="p-2">{app.status}</td><td className="p-2">{app.rejectionReason || "—"}</td></tr>
                  ))}
                </tbody>
              </table>

              <h3 className="text-sm font-semibold uppercase text-[#8B7D6B] mb-2 mt-8">Career Placements</h3>
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-[#FAF8F3]"><th className="p-2">Role</th><th className="p-2">Company</th><th className="p-2">Status</th><th className="p-2">Next Move</th></tr></thead>
                <tbody>
                  {d.careerHistory.map((c: any) => (
                    <tr key={c.id} className="border-b"><td className="p-2">{c.role}</td><td className="p-2">{c.company}</td><td className="p-2">{c.status}</td><td className="p-2">{c.nextMove || "—"}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
