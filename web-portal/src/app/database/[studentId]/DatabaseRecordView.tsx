"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

const parseVerifiedField = (val: string | null) => {
  if (!val) return { value: "", status: "NONE" };
  try {
    const parsed = JSON.parse(val);
    if (parsed.value !== undefined && parsed.status) return parsed;
    return { value: val, status: "NONE" };
  } catch (e) {
    return { value: val, status: "NONE" };
  }
};

const StatusBadge = ({ status, onVerify, role }: { status: string, onVerify?: (s: string) => void, role?: string }) => {
  if (status === "VERIFIED") return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3"/> Verified</span>;
  if (status === "SELF_REPORTED") return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800"><Clock className="w-3 h-3"/> Pending Verification</span>
      {role !== "STUDENT" && onVerify && (
        <>
          <button onClick={() => onVerify("VERIFIED")} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded">Verify</button>
          <button onClick={() => onVerify("REJECTED")} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">Reject</button>
        </>
      )}
    </span>
  );
  if (status === "REJECTED") return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-800"><AlertCircle className="w-3 h-3"/> Rejected</span>;
  return null;
};

export default function DatabaseRecordView({ studentId, role }: { studentId: string, role?: string }) {
  const [state, setState] = useState<any>({ status: "loading" });
  const [activeTab, setActiveTab] = useState<"transcripts" | "tracker">("transcripts");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  
  const [trackerForm, setTrackerForm] = useState({
    recordType: "INTERVIEW",
    company: "",
    role: "",
    interviewStatus: "APPLIED",
    placementStatus: "WORKING",
    salary: "",
    startDate: new Date().toISOString().split("T")[0],
    nextMove: ""
  });

  const load = useCallback(async () => {
    try {
      // The API now expects ?overrideReason if we are a teacher out of cohort
      const res = await fetch(`/api/ngo/students/${encodeURIComponent(studentId)}?full=true&overrideReason=Reviewing+Record`);
      const data = await res.json();
      
      if (res.ok) {
        setState({ status: "success", data });
        setEditForm({
          headline: data.personalDetails.headline || "",
          address: data.personalDetails.address || "",
          languages: data.personalDetails.languages || "",
          hobbies: data.personalDetails.hobbies || "",
          vocation: data.personalDetails.vocation || "",
          disabilityInfo: data.personalDetails.disabilityInfo === '[REDACTED]' ? '' : (data.personalDetails.disabilityInfo || ""),
          skills: data.professionalBackground.skills || "",
          education: parseVerifiedField(data.professionalBackground.education).value,
          experience: data.professionalBackground.experience || "",
          courseworks: data.professionalBackground.courseworks || "",
          internships: data.professionalBackground.internships || "",
          certifications: parseVerifiedField(data.professionalBackground.certifications).value,
          transcripts: parseVerifiedField(data.professionalBackground.transcripts).value,
          expectedSalary: data.jobPreferences.expectedSalary === '[REDACTED]' ? '' : (data.jobPreferences.expectedSalary || ""),
          availability: data.jobPreferences.availability || "",
        });
      } else {
        setState({ status: "error", message: data.message || data.error });
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
    setTrackerForm({ ...trackerForm, company: "", role: "", salary: "" });
    load();
  };

  const verifyField = async (target: string, status: string, recordId?: string) => {
    await fetch(`/api/ngo/students/${encodeURIComponent(studentId)}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, status, recordId })
    });
    load();
  };

  if (state.status === "loading") return <div className="min-h-screen p-10 bg-[#FDFBF7]">Loading...</div>;
  if (state.status === "error") return <div className="min-h-screen p-10 bg-[#FDFBF7]">Error: {state.message}</div>;

  const d = state.data;
  
  const eduParsed = parseVerifiedField(d.professionalBackground.education);
  const certParsed = parseVerifiedField(d.professionalBackground.certifications);
  const transParsed = parseVerifiedField(d.professionalBackground.transcripts);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3E362E] p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 border-b border-[#E1D8C9] pb-6 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-serif text-[#2C241B]">{d.name || "Unknown Student"}</h1>
            <p className="text-[#6B5E4C] mt-1 font-mono text-sm">Universal ID: {d.studentId}</p>
            {d.isRedacted && (
              <p className="mt-2 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block border border-amber-200">
                <AlertCircle className="w-3 h-3 inline mr-1" /> Out of Cohort View (Sensitive fields redacted)
              </p>
            )}
          </div>
          {role !== "STUDENT" && (
            <a href="/database" className="px-4 py-2 border border-[#E1D8C9] rounded text-sm hover:bg-white transition-colors">
              Back to Search
            </a>
          )}
        </header>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[#E1D8C9]">
          <button 
            onClick={() => setActiveTab("transcripts")}
            className={`px-6 py-3 font-semibold text-lg border-b-2 ${activeTab === "transcripts" ? "border-[#2C241B] text-[#2C241B]" : "border-transparent text-[#8B7D6B] hover:text-[#2C241B]"}`}
          >
            Transcripts & Information
          </button>
          {role !== "STUDENT" && (
            <button 
              onClick={() => setActiveTab("tracker")}
              className={`px-6 py-3 font-semibold text-lg border-b-2 ${activeTab === "tracker" ? "border-[#2C241B] text-[#2C241B]" : "border-transparent text-[#8B7D6B] hover:text-[#2C241B]"}`}
            >
              Placement Tracker
            </button>
          )}
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
              {/* Unverified / Free Text Fields */}
              {[
                { key: 'headline', label: 'Headline' },
                { key: 'address', label: 'Address' },
                { key: 'languages', label: 'Languages' },
                { key: 'hobbies', label: 'Hobbies' },
                { key: 'vocation', label: 'Vocation' },
                { key: 'disabilityInfo', label: 'Accommodations / Disability Info' },
                { key: 'skills', label: 'Skills' },
                { key: 'experience', label: 'Experience' },
                { key: 'courseworks', label: 'Courseworks' },
                { key: 'internships', label: 'Internships' },
                { key: 'expectedSalary', label: 'Expected Salary' },
                { key: 'availability', label: 'Availability' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">
                    {label}
                  </label>
                  {isEditing ? (
                    <textarea 
                      value={editForm[key]} 
                      onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                      className="w-full border border-[#E1D8C9] rounded p-2 text-[#3E362E] min-h-[60px]"
                    />
                  ) : (
                    <div className="text-[#3E362E] min-h-[60px] p-2 bg-[#FAF8F3] rounded border border-transparent whitespace-pre-wrap">
                      {editForm[key] || <span className="text-gray-400 italic">Not provided</span>}
                    </div>
                  )}
                </div>
              ))}

              {/* Verified Fields */}
              <div className="md:col-span-2 border-t border-[#E1D8C9] pt-6 mt-4">
                <h3 className="text-lg font-serif text-[#2C241B] mb-4">Official Records</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { key: 'education', label: 'Education', parsed: eduParsed },
                    { key: 'certifications', label: 'Certifications', parsed: certParsed },
                    { key: 'transcripts', label: 'Transcripts', parsed: transParsed },
                  ].map(({ key, label, parsed }) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#8B7D6B]">
                          {label}
                        </label>
                        {!isEditing && <StatusBadge status={parsed.status} role={role} onVerify={(s) => verifyField(key, s)} />}
                      </div>
                      {isEditing ? (
                        <textarea 
                          value={editForm[key]} 
                          onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                          className="w-full border border-[#E1D8C9] rounded p-2 text-[#3E362E] min-h-[60px]"
                        />
                      ) : (
                        <div className="text-[#3E362E] min-h-[60px] p-2 bg-[#FAF8F3] rounded border border-transparent whitespace-pre-wrap">
                          {parsed.value || <span className="text-gray-400 italic">Not provided</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tracker" && (
          <div className="space-y-8">
            <form onSubmit={saveTracker} className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
              <h2 className="text-xl font-serif text-[#2C241B] mb-4">Add Timeline Event</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#6B5E4C]">Event Type</label>
                  <select 
                    value={trackerForm.recordType} 
                    onChange={e => setTrackerForm({...trackerForm, recordType: e.target.value})}
                    className="w-full border p-2 rounded"
                  >
                    <option value="INTERVIEW">Interview / Application</option>
                    <option value="PLACEMENT">Career Placement (Hired)</option>
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
                  {trackerForm.recordType === "INTERVIEW" ? (
                    <select value={trackerForm.interviewStatus} onChange={e => setTrackerForm({...trackerForm, interviewStatus: e.target.value})} className="w-full border p-2 rounded">
                      <option value="APPLIED">Applied</option>
                      <option value="SCHEDULED">Interview Scheduled</option>
                      <option value="ATTENDED">Interview Attended</option>
                      <option value="NO_SHOW">No Show</option>
                      <option value="OFFER_EXTENDED">Offer Extended</option>
                      <option value="OFFER_ACCEPTED">Offer Accepted</option>
                      <option value="OFFER_REJECTED_BY_STUDENT">Offer Rejected by Student</option>
                      <option value="REJECTED_BY_COMPANY">Rejected by Company</option>
                    </select>
                  ) : (
                    <select value={trackerForm.placementStatus} onChange={e => setTrackerForm({...trackerForm, placementStatus: e.target.value})} className="w-full border p-2 rounded">
                      <option value="WORKING">Working (Current)</option>
                      <option value="RESIGNED">Resigned</option>
                      <option value="TERMINATED">Terminated</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[#6B5E4C]">Salary / Offer (Optional)</label>
                  <input type="number" value={trackerForm.salary} onChange={e => setTrackerForm({...trackerForm, salary: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                {trackerForm.recordType === "PLACEMENT" && trackerForm.placementStatus !== "WORKING" && (
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
              <h2 className="text-xl font-serif text-[#2C241B] mb-6">Career Timeline</h2>
              
              <div className="relative border-l border-stone-200 ml-4 space-y-8 pb-4">
                {d.careerTrack?.length === 0 ? (
                  <p className="ml-6 text-stone-500">No career records found.</p>
                ) : d.careerTrack?.map((ct: any) => (
                  <div key={ct.id} className="relative ml-6">
                    <span className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white"></span>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-stone-800 text-lg">{ct.role} <span className="font-normal text-stone-500">at</span> {ct.company}</h3>
                        <p className="text-sm text-stone-500">{new Date(ct.createdAt).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={ct.verification} role={role} onVerify={(s) => verifyField("careerTrack", s, ct.id)} />
                    </div>
                    
                    <div className="bg-[#FAF8F3] p-4 rounded border border-[#E1D8C9] mt-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-stone-500 uppercase text-xs font-semibold tracking-wider block">Type</span>
                          {ct.recordType}
                        </div>
                        <div>
                          <span className="text-stone-500 uppercase text-xs font-semibold tracking-wider block">Status</span>
                          <span className="font-medium text-stone-800">{ct.recordType === 'INTERVIEW' ? ct.interviewStatus : ct.placementStatus}</span>
                        </div>
                        {ct.salary && (
                          <div>
                            <span className="text-stone-500 uppercase text-xs font-semibold tracking-wider block">Salary</span>
                            {ct.salary}
                          </div>
                        )}
                        {ct.nextMove && (
                          <div className="col-span-2">
                            <span className="text-stone-500 uppercase text-xs font-semibold tracking-wider block">Next Move</span>
                            {ct.nextMove}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
