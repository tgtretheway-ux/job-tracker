/* eslint-disable */
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

const STATUSES = ["Saved", "Applied", "Phone Screen", "Interview", "Aptitude Test Scheduled", "Offer", "Rejected", "Withdrawn", "Position Closed", "Pending", "Received", "Submitted"];

const STATUS_COLORS = {
  "Saved": { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" },
  "Applied": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  "Phone Screen": { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  "Interview": { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  "Aptitude Test Scheduled": { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-400" },
  "Offer": { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  "Rejected": { bg: "bg-red-100", text: "text-red-600", dot: "bg-red-400" },
  "Withdrawn": { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-400" },
  "Position Closed": { bg: "bg-red-100", text: "text-red-600", dot: "bg-red-400" },
  "Pending": { bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  "Received": { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  "Submitted": { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500" },
};

const DEFAULT_COLOR = { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" };

const EMPTY_FORM = {
  company: "", role: "", location: "", salary: "", url: "",
  status: "Saved", applied_date: "", notes: "", contact: "",
};

export default function JobTracker() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("board");
  const [showModal, setShowModal] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [detailJob, setDetailJob] = useState(null);
  const [importMsg, setImportMsg] = useState("");

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (error) console.error(error);
    else setJobs(data || []);
    setLoading(false);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        const imported = rows
          .filter(r => r["Company"] || r["Position"])
          .map(r => ({
            company: r["Company"] || "",
            role: r["Position"] || "",
            applied_date: r["Date Applied"] || "",
            status: STATUSES.includes(r["Status"]) ? r["Status"] : "Applied",
            notes: STATUSES.includes(r["Status"]) ? "" : (r["Status"] || ""),
            location: "", salary: "", url: "", contact: "",
          }));
        const { error } = await supabase.from("jobs").insert(imported);
        if (error) { setImportMsg("❌ Import failed: " + error.message); }
        else { setImportMsg(`✅ Imported ${imported.length} job(s)!`); fetchJobs(); }
        setTimeout(() => setImportMsg(""), 3000);
      } catch { setImportMsg("❌ Error reading file."); setTimeout(() => setImportMsg(""), 3000); }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const filtered = jobs.filter(j => {
    const matchStatus = filterStatus === "All" || j.status === filterStatus;
    const matchSearch = !search || j.company.toLowerCase().includes(search.toLowerCase()) || j.role.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const openAdd = () => { setForm(EMPTY_FORM); setEditJob(null); setShowModal(true); };
  const openEdit = (job) => { setForm({ ...job }); setEditJob(job.id); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditJob(null); };

  const saveJob = async () => {
    if (!form.company || !form.role) return;
    if (editJob) {
      const { error } = await supabase.from("jobs").update({ ...form }).eq("id", editJob);
      if (error) console.error(error);
    } else {
      const { error } = await supabase.from("jobs").insert([{ ...form }]);
      if (error) console.error(error);
    }
    fetchJobs();
    closeModal();
  };

  const deleteJob = async (id) => {
    await supabase.from("jobs").delete().eq("id", id);
    setJobs(prev => prev.filter(j => j.id !== id));
    if (detailJob?.id === id) setDetailJob(null);
  };

  const updateStatus = async (id, status) => {
    await supabase.from("jobs").update({ status }).eq("id", id);
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
  };

  const getColor = (status) => STATUS_COLORS[status] || DEFAULT_COLOR;

  const stats = STATUSES.reduce((acc, s) => { acc[s] = jobs.filter(j => j.status === s).length; return acc; }, {});
  const activeCount = jobs.filter(j => !["Rejected", "Withdrawn", "Position Closed"].includes(j.status)).length;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", minHeight: "100vh", background: "#f8f9fc" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 16 }}>💼</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#111" }}>JobTrack</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {importMsg && <span style={{ fontSize: 13, color: importMsg.startsWith("✅") ? "#10b981" : "#ef4444" }}>{importMsg}</span>}
            <label style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontWeight: 500, cursor: "pointer", fontSize: 13 }}>
              📂 Import Excel
              <input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: "none" }} />
            </label>
            <button onClick={() => setView("board")} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid", borderColor: view === "board" ? "#6366f1" : "#e5e7eb", background: view === "board" ? "#eef2ff" : "#fff", color: view === "board" ? "#6366f1" : "#6b7280", fontWeight: 500, cursor: "pointer", fontSize: 13 }}>Board</button>
            <button onClick={() => setView("table")} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid", borderColor: view === "table" ? "#6366f1" : "#e5e7eb", background: view === "table" ? "#eef2ff" : "#fff", color: view === "table" ? "#6366f1" : "#6b7280", fontWeight: 500, cursor: "pointer", fontSize: 13 }}>Table</button>
            <button onClick={openAdd} style={{ padding: "6px 16px", borderRadius: 6, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>+ Add Job</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Applications", value: jobs.length, color: "#6366f1" },
            { label: "Active", value: activeCount, color: "#8b5cf6" },
            { label: "Interviews", value: stats["Interview"] || 0, color: "#a855f7" },
            { label: "Offers", value: stats["Offer"] || 0, color: "#10b981" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company or role…"
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", width: 220, background: "#fff" }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["All", ...STATUSES].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid", borderColor: filterStatus === s ? "#6366f1" : "#e5e7eb", background: filterStatus === s ? "#eef2ff" : "#fff", color: filterStatus === s ? "#6366f1" : "#6b7280", fontWeight: filterStatus === s ? 600 : 400, cursor: "pointer", fontSize: 12 }}>
                {s} {s !== "All" && <span style={{ color: "#9ca3af" }}>({stats[s] || 0})</span>}
              </button>
            ))}
          </div>
        </div>

        {loading && <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Loading jobs...</div>}

        {!loading && view === "board" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {STATUSES.map(status => {
              const cols = filtered.filter(j => j.status === status);
              const c = getColor(status);
              return (
                <div key={status} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#374151" }}>{status}</span>
                    <span style={{ marginLeft: "auto", background: "#f3f4f6", color: "#6b7280", borderRadius: 10, padding: "1px 8px", fontSize: 12 }}>{cols.length}</span>
                  </div>
                  <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, minHeight: 60 }}>
                    {cols.length === 0 && <div style={{ color: "#d1d5db", fontSize: 12, textAlign: "center", padding: "12px 0" }}>No applications</div>}
                    {cols.map(job => (
                      <div key={job.id} onClick={() => setDetailJob(job)} style={{ background: "#fafafa", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "#111" }}>{job.company}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{job.role}</div>
                        {job.location && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>📍 {job.location}</div>}
                        {job.applied_date && <div style={{ fontSize: 11, color: "#9ca3af" }}>📅 {job.applied_date}</div>}
                        {job.notes && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontStyle: "italic" }}>{job.notes.substring(0, 60)}{job.notes.length > 60 ? "…" : ""}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && view === "table" && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Company", "Role", "Location", "Salary", "Status", "Applied", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>No applications found.</td></tr>
                )}
                {filtered.map((job, i) => {
                  const c = getColor(job.status);
                  return (
                    <tr key={job.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13, color: "#111", cursor: "pointer" }} onClick={() => setDetailJob(job)}>{job.company}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{job.role}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280" }}>{job.location || "—"}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#10b981", fontWeight: 500 }}>{job.salary || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <select value={job.status} onChange={e => updateStatus(job.id, e.target.value)}
                          style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: c.bg, fontSize: 12, fontWeight: 600, cursor: "pointer", outline: "none" }}>
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#9ca3af" }}>{job.applied_date || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => openEdit(job)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 12, cursor: "pointer" }}>Edit</button>
                          <button onClick={() => deleteJob(job.id)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #fee2e2", background: "#fff", color: "#ef4444", fontSize: 12, cursor: "pointer" }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailJob && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 360, background: "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)", zIndex: 50, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: "#111" }}>{detailJob.company}</div>
              <div style={{ color: "#6b7280", fontSize: 14, marginTop: 2 }}>{detailJob.role}</div>
            </div>
            <button onClick={() => setDetailJob(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>
          </div>
          <div style={{ padding: "20px 24px", flex: 1 }}>
            {[
              { label: "Status", value: <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: getColor(detailJob.status).bg }}>{detailJob.status}</span> },
              { label: "Location", value: detailJob.location },
              { label: "Salary", value: detailJob.salary },
              { label: "Applied", value: detailJob.applied_date },
              { label: "Contact", value: detailJob.contact },
              { label: "URL", value: detailJob.url ? <a href={detailJob.url} target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1" }}>{detailJob.url}</a> : null },
              { label: "Notes", value: detailJob.notes },
            ].map(row => row.value ? (
              <div key={row.label} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{row.label}</div>
                <div style={{ fontSize: 14, color: "#374151" }}>{row.value}</div>
              </div>
            ) : null)}
          </div>
          <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
            <button onClick={() => { openEdit(detailJob); setDetailJob(null); }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Edit</button>
            <button onClick={() => deleteJob(detailJob.id)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#ef4444", fontWeight: 600, cursor: "pointer" }}>Delete</button>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{editJob ? "Edit Application" : "Add Application"}</span>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>
            <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { key: "company", label: "Company *", full: false },
                { key: "role", label: "Role *", full: false },
                { key: "location", label: "Location", full: false },
                { key: "salary", label: "Salary Range", full: false },
                { key: "applied_date", label: "Applied Date", full: false },
                { key: "contact", label: "Contact Email", full: false },
                { key: "url", label: "Job URL", full: true },
                { key: "notes", label: "Notes", full: true, multiline: true },
              ].map(field => (
                <div key={field.key} style={{ gridColumn: field.full ? "1 / -1" : "auto" }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>{field.label}</label>
                  {field.multiline ? (
                    <textarea value={form[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      rows={3} style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                  ) : (
                    <input type="text" value={form[field.key] || ""} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  )}
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", background: "#fff" }}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={closeModal} style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveJob} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                {editJob ? "Save Changes" : "Add Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}