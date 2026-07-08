"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Clock, Plus, Trash2, Upload, ExternalLink, UserSquare } from "lucide-react";

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

const IdCardModal = ({ onClose, profile, user }: { onClose: () => void, profile: any, user: any }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded p-6 max-w-sm w-full">
        <div className="flex justify-end mb-4">
          <button onClick={onClose} className="text-stone-500 hover:text-stone-800">Close</button>
        </div>
        
        <div id="id-card-print" className="border-2 border-[#2D4A22] rounded-xl overflow-hidden bg-white shadow-lg w-[300px] mx-auto h-[450px] flex flex-col">
          <div className="bg-[#2D4A22] text-white p-4 text-center">
            <h2 className="font-serif font-bold text-xl tracking-tight">DEEDS Connect</h2>
            <p className="text-[10px] opacity-80 uppercase tracking-wider">Empowering Specially Abled</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-32 h-32 bg-stone-200 rounded border-2 border-[#E1D8C9] mb-4 overflow-hidden flex items-center justify-center">
              {profile.imageUrl ? (
                <img src={profile.imageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-stone-400 text-xs">No Photo</span>
              )}
            </div>
            
            <h3 className="font-bold text-lg text-center text-[#2C241B]">{user.name}</h3>
            <p className="text-sm font-mono text-[#6B5E4C] mb-2">{profile.studentId}</p>
            
            <div className="w-full text-xs text-[#3E362E] space-y-1 bg-[#FAF8F3] p-3 rounded">
              <p><span className="font-semibold">Class:</span> {profile.cohorts?.[0]?.name || "Not Assigned"}</p>
              <p><span className="font-semibold">Phone:</span> {profile.phone || "N/A"}</p>
              <p><span className="font-semibold">Address:</span> {profile.address || "N/A"}</p>
            </div>
          </div>
          
          <div className="bg-[#E1D8C9] p-2 text-center text-[10px] text-[#2C241B] font-semibold">
            Student Identity Card
          </div>
        </div>
        
        <div className="mt-6 flex justify-center">
          <button onClick={() => window.print()} className="bg-[#2D4A22] text-white px-4 py-2 rounded font-semibold w-full hover:bg-[#1f3418]">
            Print ID Card
          </button>
        </div>
      </div>
    </div>
  );
};

const parseList = (val: any) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const arr = JSON.parse(val);
      if (Array.isArray(arr)) return arr;
      return [{ name: val }];
    } catch {
      return [{ name: val }];
    }
  }
  return [];
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

const FileUploader = ({ onUpload, label }: { onUpload: (url: string) => void, label: string }) => {
  const [uploading, setUploading] = useState(false);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file,
      });
      const data = await res.json();
      if (data.url) onUpload(data.url);
      else alert("Upload failed");
    } catch (err) {
      alert("Error uploading file");
    }
    setUploading(false);
  };
  return (
    <div className="flex items-center gap-2">
      <label className="cursor-pointer bg-stone-200 hover:bg-stone-300 text-stone-800 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1">
        <Upload className="w-3 h-3" />
        {uploading ? "Uploading..." : label}
        <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} disabled={uploading} />
      </label>
    </div>
  );
};

export default function DatabaseRecordView({ studentId, role }: { studentId: string, role?: string }) {
  const [state, setState] = useState<any>({ status: "loading" });
  const [activeTab, setActiveTab] = useState<"transcripts" | "tracker" | "reports">("transcripts");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  
  const [educationList, setEducationList] = useState<any[]>([]);
  const [certList, setCertList] = useState<any[]>([]);
  const [courseworkList, setCourseworkList] = useState<any[]>([]);

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
  const [isSavingTracker, setIsSavingTracker] = useState(false);

  const [reportForm, setReportForm] = useState({
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    academicPerformance: "",
    behavioralNotes: ""
  });
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/ngo/students/${encodeURIComponent(studentId)}?full=true&overrideReason=Reviewing+Record`);
      const data = await res.json();
      
      if (res.ok) {
        setState({ status: "success", data });
        
        const parsedEdu = parseVerifiedField(data.professionalBackground.education);
        const parsedCert = parseVerifiedField(data.professionalBackground.certifications);
        
        setEducationList(parseList(parsedEdu.value));
        setCertList(parseList(parsedCert.value));
        setCourseworkList(parseList(data.professionalBackground.courseworks));

        setEditForm({
          headline: data.personalDetails.headline || "",
          address: data.personalDetails.address || "",
          phone: data.personalDetails.phone || "",
          languages: data.personalDetails.languages || "",
          hobbies: data.personalDetails.hobbies || "",
          vocation: data.personalDetails.vocation || "",
          disabilityInfo: data.personalDetails.disabilityInfo === '[REDACTED]' ? '' : (data.personalDetails.disabilityInfo || ""),
          skills: data.professionalBackground.skills || "",
          experience: data.professionalBackground.experience || "",
          internships: data.professionalBackground.internships || "",
          expectedSalary: data.jobPreferences.expectedSalary === '[REDACTED]' ? '' : (data.jobPreferences.expectedSalary || ""),
          availability: data.jobPreferences.availability || "",
          imageUrl: data.personalDetails.imageUrl || "",
          isEligibleForPlacement: data.jobPreferences.isEligibleForPlacement ?? false,
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
    const finalForm = {
      ...editForm,
      education: JSON.stringify(educationList),
      certifications: JSON.stringify(certList),
      courseworks: JSON.stringify(courseworkList)
    };
    await fetch(`/api/ngo/students/${encodeURIComponent(studentId)}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(finalForm)
    });
    setIsEditing(false);
    load();
  };

  const saveTracker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingTracker) return;
    setIsSavingTracker(true);
    await fetch(`/api/ngo/students/${encodeURIComponent(studentId)}/tracker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trackerForm)
    });
    setTrackerForm({ ...trackerForm, company: "", role: "", salary: "" });
    await load();
    setIsSavingTracker(false);
  };

  const saveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingReport) return;
    setIsSavingReport(true);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...reportForm, profileId: state.data?.id })
    });
    setReportForm({ ...reportForm, academicPerformance: "", behavioralNotes: "" });
    await load();
    setIsSavingReport(false);
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
  const eduParsedStatus = parseVerifiedField(d.professionalBackground.education).status;
  const certParsedStatus = parseVerifiedField(d.professionalBackground.certifications).status;

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
          <div className="flex gap-2">
            {!isEditing && (
              <button 
                onClick={() => { setActiveTab("transcripts"); setIsEditing(true); }} 
                className="px-4 py-2 bg-stone-100 border border-stone-200 text-stone-700 rounded text-sm font-semibold hover:bg-stone-200 transition-colors"
              >
                Edit Profile
              </button>
            )}
            <button onClick={() => setShowIdCard(true)} className="px-4 py-2 bg-[#2D4A22] text-white rounded text-sm font-semibold hover:bg-[#1f3418] transition-colors flex items-center gap-2 shadow-sm">
              <UserSquare className="w-4 h-4" /> View ID Card
            </button>
            {role !== "STUDENT" && (
              <a href="/database" className="px-4 py-2 border border-[#E1D8C9] rounded text-sm hover:bg-white transition-colors">
                Back to Search
              </a>
            )}
          </div>
        </header>

        {showIdCard && (
          <IdCardModal 
            onClose={() => setShowIdCard(false)} 
            profile={{
              studentId: d.studentId,
              imageUrl: d.personalDetails?.imageUrl,
              address: d.personalDetails?.address,
              phone: d.personalDetails?.phone,
              cohorts: d.cohorts
            }} 
            user={{name: d.name}} 
          />
        )}

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
          <button 
            onClick={() => setActiveTab("reports")}
            className={`px-6 py-3 font-semibold text-lg border-b-2 ${activeTab === "reports" ? "border-[#2C241B] text-[#2C241B]" : "border-transparent text-[#8B7D6B] hover:text-[#2C241B]"}`}
          >
            Progress Reports
          </button>
        </div>

        {activeTab === "transcripts" && (
          <div className="bg-white p-8 rounded shadow-sm border border-[#E1D8C9] space-y-8">
            <div className="flex justify-between items-center pb-6 border-b border-[#E1D8C9]">
              <h2 className="text-2xl font-serif text-[#2C241B]">Student Database Record</h2>
              <button 
                onClick={() => isEditing ? saveTranscripts() : setIsEditing(true)}
                className="px-4 py-2 bg-[#2D4A22] text-white rounded text-sm font-semibold hover:bg-[#1f3418]"
              >
                {isEditing ? "Save Changes" : "Edit Data"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { key: 'headline', label: 'Headline' },
                { key: 'phone', label: 'Phone Number' },
                { key: 'address', label: 'Address' },
                { key: 'languages', label: 'Languages' },
                { key: 'hobbies', label: 'Hobbies' },
                { key: 'vocation', label: 'Vocation' },
                { key: 'disabilityInfo', label: 'Accommodations / Disability Info' },
                { key: 'skills', label: 'Skills' },
                { key: 'experience', label: 'Experience' },
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
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">
                  Eligible For Placement
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="checkbox" 
                      checked={editForm.isEligibleForPlacement} 
                      onChange={(e) => setEditForm({ ...editForm, isEligibleForPlacement: e.target.checked })}
                      className="w-4 h-4 text-[#2D4A22] focus:ring-[#2D4A22]"
                    />
                    <span className="text-sm">Yes, student is eligible</span>
                  </div>
                ) : (
                  <div className="text-[#3E362E] min-h-[60px] p-2 bg-[#FAF8F3] rounded border border-transparent whitespace-pre-wrap">
                    {editForm.isEligibleForPlacement ? "Yes" : "No"}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">
                  Profile Image URL (For ID Card)
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-4 mt-2">
                    {editForm.imageUrl && <img src={editForm.imageUrl} className="w-16 h-16 rounded object-cover border" />}
                    <FileUploader label="Upload Photo" onUpload={(url) => setEditForm({...editForm, imageUrl: url})} />
                  </div>
                ) : (
                  <div className="text-[#3E362E] min-h-[60px] p-2 bg-[#FAF8F3] rounded border border-transparent whitespace-pre-wrap flex items-center gap-2">
                    {editForm.imageUrl ? (
                      <img src={editForm.imageUrl} className="w-16 h-16 rounded object-cover border" />
                    ) : (
                      <span className="text-gray-400 italic">No image uploaded</span>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Structured Fields Section */}
            <div className="border-t border-[#E1D8C9] pt-8 space-y-8">
              
              {/* EDUCATION */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-serif text-[#2C241B]">Education</h3>
                  {!isEditing && <StatusBadge status={eduParsedStatus} role={role} onVerify={(s) => verifyField("education", s)} />}
                </div>
                
                <div className="space-y-4">
                  {educationList.length === 0 && !isEditing && <p className="text-stone-400 italic">No education records provided.</p>}
                  {educationList.map((edu, idx) => (
                    <div key={idx} className="p-4 border border-[#E1D8C9] rounded bg-[#FAF8F3] relative">
                      {isEditing && (
                        <button onClick={() => setEducationList(educationList.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-stone-500">Institution Name</label>
                          {isEditing ? (
                            <input value={edu.institution || edu.name || ""} onChange={e => { const n = [...educationList]; n[idx].institution = e.target.value; setEducationList(n); }} className="w-full border p-1 rounded" />
                          ) : <p className="font-semibold text-stone-800">{edu.institution || edu.name || "-"}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-stone-500">Degree / Standard</label>
                          {isEditing ? <input value={edu.degree || ""} onChange={e => { const n = [...educationList]; n[idx].degree = e.target.value; setEducationList(n); }} className="w-full border p-1 rounded" /> : <p>{edu.degree || "-"}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-stone-500">Duration</label>
                          {isEditing ? <input value={edu.duration || ""} onChange={e => { const n = [...educationList]; n[idx].duration = e.target.value; setEducationList(n); }} className="w-full border p-1 rounded" placeholder="e.g. 2018 - 2022" /> : <p>{edu.duration || "-"}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-stone-500">Marks / CGPA</label>
                          {isEditing ? <input value={edu.marks || ""} onChange={e => { const n = [...educationList]; n[idx].marks = e.target.value; setEducationList(n); }} className="w-full border p-1 rounded" /> : <p>{edu.marks || "-"}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-stone-500 mb-1 block">Transcript PDF</label>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              {edu.url ? <a href={edu.url} target="_blank" rel="noreferrer" className="text-emerald-600 underline text-sm">View File</a> : <span className="text-stone-400 text-sm">No file</span>}
                              <FileUploader label="Upload PDF" onUpload={(url) => { const n = [...educationList]; n[idx].url = url; setEducationList(n); }} />
                            </div>
                          ) : (
                            edu.url ? <a href={edu.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2D4A22] font-semibold text-sm hover:underline"><ExternalLink className="w-4 h-4"/> View Transcript</a> : <p className="text-stone-500 text-sm">Not provided</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isEditing && (
                    <button onClick={() => setEducationList([...educationList, {}])} className="w-full py-3 border-2 border-dashed border-[#E1D8C9] text-stone-500 font-semibold rounded hover:bg-stone-50 hover:text-stone-800 transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5"/> Add Education
                    </button>
                  )}
                </div>
              </div>

              {/* COURSEWORKS */}
              <div>
                <h3 className="text-xl font-serif text-[#2C241B] mb-4">Coursework</h3>
                <div className="space-y-4">
                  {courseworkList.length === 0 && !isEditing && <p className="text-stone-400 italic">No coursework records provided.</p>}
                  {courseworkList.map((course, idx) => (
                    <div key={idx} className="p-4 border border-[#E1D8C9] rounded bg-[#FAF8F3] relative">
                      {isEditing && (
                        <button onClick={() => setCourseworkList(courseworkList.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-stone-500">Course Name</label>
                          {isEditing ? <input value={course.name || ""} onChange={e => { const n = [...courseworkList]; n[idx].name = e.target.value; setCourseworkList(n); }} className="w-full border p-1 rounded" /> : <p className="font-semibold text-stone-800">{course.name || "-"}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isEditing && (
                    <button onClick={() => setCourseworkList([...courseworkList, {}])} className="w-full py-3 border-2 border-dashed border-[#E1D8C9] text-stone-500 font-semibold rounded hover:bg-stone-50 hover:text-stone-800 transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5"/> Add Coursework
                    </button>
                  )}
                </div>
              </div>

              {/* CERTIFICATIONS */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-serif text-[#2C241B]">Certifications</h3>
                  {!isEditing && <StatusBadge status={certParsedStatus} role={role} onVerify={(s) => verifyField("certifications", s)} />}
                </div>
                
                <div className="space-y-4">
                  {certList.length === 0 && !isEditing && <p className="text-stone-400 italic">No certifications provided.</p>}
                  {certList.map((cert, idx) => (
                    <div key={idx} className="p-4 border border-[#E1D8C9] rounded bg-[#FAF8F3] relative">
                      {isEditing && (
                        <button onClick={() => setCertList(certList.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-stone-500">Certificate Name</label>
                          {isEditing ? <input value={cert.name || ""} onChange={e => { const n = [...certList]; n[idx].name = e.target.value; setCertList(n); }} className="w-full border p-1 rounded" /> : <p className="font-semibold text-stone-800">{cert.name || "-"}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-stone-500">Issuing Organization</label>
                          {isEditing ? <input value={cert.organization || ""} onChange={e => { const n = [...certList]; n[idx].organization = e.target.value; setCertList(n); }} className="w-full border p-1 rounded" /> : <p>{cert.organization || "-"}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-stone-500">Year</label>
                          {isEditing ? <input value={cert.year || ""} onChange={e => { const n = [...certList]; n[idx].year = e.target.value; setCertList(n); }} className="w-full border p-1 rounded" /> : <p>{cert.year || "-"}</p>}
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs font-semibold text-stone-500 mb-1 block">Certificate PDF</label>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              {cert.url ? <a href={cert.url} target="_blank" rel="noreferrer" className="text-emerald-600 underline text-sm">View File</a> : <span className="text-stone-400 text-sm">No file</span>}
                              <FileUploader label="Upload PDF" onUpload={(url) => { const n = [...certList]; n[idx].url = url; setCertList(n); }} />
                            </div>
                          ) : (
                            cert.url ? <a href={cert.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#2D4A22] font-semibold text-sm hover:underline"><ExternalLink className="w-4 h-4"/> View Certificate</a> : <p className="text-stone-500 text-sm">Not provided</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isEditing && (
                    <button onClick={() => setCertList([...certList, {}])} className="w-full py-3 border-2 border-dashed border-[#E1D8C9] text-stone-500 font-semibold rounded hover:bg-stone-50 hover:text-stone-800 transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5"/> Add Certification
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TRACKER TAB REMAINS THE SAME */}
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
              <button disabled={isSavingTracker} type="submit" className="bg-[#2C241B] text-white px-6 py-2 rounded text-sm font-semibold hover:bg-black disabled:opacity-50">
                {isSavingTracker ? "Saving..." : "Save Record"}
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

        {/* PROGRESS REPORTS TAB */}
        {activeTab === "reports" && (
          <div className="space-y-8">
            {role === "TEACHER" && (
              <form onSubmit={saveReport} className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
                <h2 className="text-xl font-serif text-[#2C241B] mb-4">Add Progress Report</h2>
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#6B5E4C]">Month / Period</label>
                    <input required value={reportForm.month} onChange={e => setReportForm({...reportForm, month: e.target.value})} className="w-full border p-2 rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#6B5E4C]">Academic Performance</label>
                    <textarea required value={reportForm.academicPerformance} onChange={e => setReportForm({...reportForm, academicPerformance: e.target.value})} className="w-full border p-2 rounded" rows={3} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-[#6B5E4C]">Behavioral Notes</label>
                    <textarea required value={reportForm.behavioralNotes} onChange={e => setReportForm({...reportForm, behavioralNotes: e.target.value})} className="w-full border p-2 rounded" rows={3} />
                  </div>
                </div>
                <button disabled={isSavingReport} type="submit" className="bg-[#2C241B] text-white px-6 py-2 rounded text-sm font-semibold hover:bg-black disabled:opacity-50">
                  {isSavingReport ? "Saving..." : "Save Report"}
                </button>
              </form>
            )}

            <div className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
              <h2 className="text-xl font-serif text-[#2C241B] mb-6">Progress Reports History</h2>
              
              <div className="space-y-4">
                {d.progressReports?.length === 0 ? (
                  <p className="text-stone-500">No progress reports found.</p>
                ) : d.progressReports?.map((pr: any) => (
                  <div key={pr.id} className="border border-[#E1D8C9] p-4 rounded bg-[#FAF8F3]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-stone-800">{pr.month}</h3>
                        <p className="text-xs text-stone-500">By {pr.teacher?.name} on {new Date(pr.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-3">
                      <div>
                        <span className="block text-stone-500 uppercase text-[10px] font-semibold tracking-wider">Academic Performance</span>
                        <p className="text-sm text-stone-800 whitespace-pre-wrap">{pr.academicPerformance}</p>
                      </div>
                      <div>
                        <span className="block text-stone-500 uppercase text-[10px] font-semibold tracking-wider">Behavioral Notes</span>
                        <p className="text-sm text-stone-800 whitespace-pre-wrap">{pr.behavioralNotes}</p>
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
