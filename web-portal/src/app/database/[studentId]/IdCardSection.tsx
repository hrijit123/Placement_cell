"use client";

import { useRef, useState } from "react";

type IdData = {
  name: string | null;
  className: string | null;
  phone: string | null;
  address: string | null;
  photoData: string | null;
  email: string | null;
};

// Downscale the chosen image to a small passport-style JPEG data URI so it
// stays well under the API's size cap.
async function fileToResizedDataUri(file: File, maxDim = 320): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = document.createElement("img");
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function IdCardSection({
  studentId,
  data,
  canEdit,
  onSaved,
}: {
  studentId: string;
  data: IdData;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    phone: data.phone || "",
    className: data.className || "",
    address: data.address || "",
  });
  const [photo, setPhoto] = useState<string | null>(data.photoData);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const choosePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg("Error: please choose an image file.");
      return;
    }
    try {
      const resized = await fileToResizedDataUri(file);
      setPhoto(resized);
      setMsg(null);
    } catch {
      setMsg("Error: could not read that image.");
    }
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/ngo/students/${encodeURIComponent(studentId)}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: form.phone,
          className: form.className,
          address: form.address,
          photoData: photo,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Save failed");
      setMsg("ID card details saved.");
      onSaved();
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #id-card-print, #id-card-print * { visibility: visible; }
          #id-card-print { position: absolute; left: 0; top: 0; }
        }
      `}</style>

      {canEdit && (
        <div className="bg-white p-6 rounded shadow-sm border border-[#E1D8C9]">
          <h2 className="text-xl font-serif text-[#2C241B] mb-4">ID Card Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Class</label>
              <input
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                placeholder="e.g. Class 10"
                className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Phone Number</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 98XXXXXXXX"
                className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Photo (passport style)</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={choosePhoto} className="w-full text-sm" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8B7D6B] mb-1">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-[#E1D8C9] rounded px-3 py-2 bg-[#FDFBF7] min-h-[60px]"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={save}
              disabled={saving}
              className="px-6 py-2.5 bg-[#2D4A22] text-white rounded font-semibold text-sm hover:bg-[#1f3418] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save ID Details"}
            </button>
            {msg && <span className={`text-sm ${msg.startsWith("Error") ? "text-red-700" : "text-emerald-700"}`}>{msg}</span>}
          </div>
        </div>
      )}

      {/* Generated card */}
      <div className="bg-white p-8 rounded shadow-sm border border-[#E1D8C9]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif text-[#2C241B]">Generated ID Card</h2>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-[#E1D8C9] rounded text-sm hover:bg-[#FAF8F3] font-medium"
          >
            🖨 Print ID Card
          </button>
        </div>

        <div id="id-card-print" className="inline-block">
          <div className="w-[360px] rounded-xl overflow-hidden border border-stone-300 shadow-md bg-white">
            <div className="bg-[#2D4A22] text-white px-4 py-3 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">🌱</span>
              <div className="leading-tight">
                <p className="font-serif font-bold">Deeds Connect</p>
                <p className="text-[10px] text-emerald-100">DEEDS Public Charitable Trust · Student ID</p>
              </div>
            </div>
            <div className="p-4 flex gap-4">
              <div className="w-[90px] h-[110px] bg-stone-100 border border-stone-200 rounded overflow-hidden flex items-center justify-center shrink-0">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-stone-300">👤</span>
                )}
              </div>
              <div className="text-sm min-w-0">
                <p className="font-bold text-stone-900 text-base leading-tight mb-1">{data.name || "—"}</p>
                <CardRow label="ID" value={studentId} mono />
                <CardRow label="Class" value={form.className || data.className} />
                <CardRow label="Phone" value={form.phone || data.phone} />
                <CardRow label="Address" value={form.address || data.address} clamp />
              </div>
            </div>
            <div className="bg-[#FAF8F3] border-t border-stone-200 px-4 py-2 flex justify-between items-center">
              <p className="text-[10px] text-stone-500">If found, please return to DEEDS Public Charitable Trust.</p>
              <p className="text-[10px] text-stone-400">{new Date().getFullYear()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardRow({ label, value, mono, clamp }: { label: string; value: string | null | undefined; mono?: boolean; clamp?: boolean }) {
  return (
    <p className={`text-xs text-stone-600 leading-snug mb-0.5 ${clamp ? "line-clamp-2" : ""}`}>
      <span className="text-stone-400 uppercase text-[10px] font-semibold mr-1">{label}</span>
      <span className={mono ? "font-mono" : ""}>{value || "—"}</span>
    </p>
  );
}
