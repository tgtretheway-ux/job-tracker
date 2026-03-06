/* eslint-disable */
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

const STATUSES = ["Saved", "Applied", "Received", "Pending", "Submitted", "Interview", "Aptitude Test Scheduled", "Offer", "Rejected", "Position Closed", "Withdrawn"];

const STATUS_COLORS = {
  "Saved": { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" },
  "Applied": { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
  "Interview": { bg: "#ede9fe", color: "#6d28d9", dot: "#8b5cf6" },
  "Aptitude Test Scheduled": { bg: "#ffedd5", color: "#c2410c", dot: "#f97316" },
  "Offer": { bg: "#dcfce7", color: "#15803d", dot: "#22c55e" },
  "Rejected": { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "Withdrawn": { bg: "#ffedd5", color: "#c2410c", dot: "#f97316" },
  "Position Closed": { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
  "Pending": { bg: "#fef9c3", color: "#a16207", dot: "#eab308" },
  "Received": { bg: "#dbeafe", color: "#1d4ed8", dot: "#3b82f6" },
  "Submitted": { bg: "#e0e7ff", color: "#4338ca", dot: "#6366f1" },
};

const DEFAULT_COLOR = { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" };
const getColor = (status) => STATUS_COLORS[status] || DEFAULT_COLOR;

const EMPTY_FORM = {
  company: "", role: "", location: "", salary: "", url: "",
  status: "Saved", applied_date: "", notes: "", contact: "",
};

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(""); setMessage(""); setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Check your email to confirm your account, then log in!");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <span style={{ fontSize: 26 }}>💼</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: 24, color: "#111" }}>JobTrack</div>
          <div style={{ color: "#9ca3af", fontSize: 14, marginTop: 4 }}>Track your job search in one place</div>
        </div>
        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: mode === m ? "#fff" : "transparent", color: mode === m ? "#111" : "#6b7280", fontWeight: mode === m ? 600 : 400, cursor: "pointer", fontSize: 14, boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          {error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 12px", borderRadius: 8, fontSize: 13 }}>{error}</div>}
          {message && <div style={{ background: "#dcfce7", color: "#15803d", padding: "10px 12px", borderRadius: 8, fontSize: 13 }}>{message}</div>}
          <button onClick={handleSubmit} disabled={loading}
            style={{ padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}>
            {loading ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobTracker() {
  const [session, setSession] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => localStorage.getItem("view") || "board");
  const [showModal, setShowModal] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [detailJob, setDetailJob] = useState(null);
  const [importMsg, setImportMsg] = useState("");
  const [resumeNotes, setResumeNotes] = useState("");
  const [resumeUploadMsg, setResumeUploadMsg] = useState("");
  const [collapsedColumns, setCollapsedColumns] = useState(() => {
    try { return JSON.parse(localStorage.getItem("collapsedColumns")) || {}; } catch { return {}; }
  });
  const [showAccount, setShowAccount] = useState(false);
  const [profile, setProfile] = useState({ full_name: "" });
  const [accountForm, setAccountForm] = useState({ full_name: "", email: "", newPassword: "" });
  const [accountMsg, setAccountMsg] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
    if (data) { setProfile(data); setAccountForm(f => ({ ...f, full_name: data.full_name || "" })); }
  };

  useEffect(() => {
    if (session) { fetchJobs(); fetchProfile(); }
    else { setJobs([]); setLoading(false); }
  }, [session]);

  const fetchJobs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (error) console.error(error);
    else setJobs(data || []);
    setLoading(false);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setSession(null); };

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
            user_id: session.user.id,
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
      await supabase.from("jobs").update({ ...form }).eq("id", editJob);
    } else {
      await supabase.from("jobs").insert([{ ...form, user_id: session.user.id }]);
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

  const handleResumeUpload = async (e, job) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeUploadMsg("Uploading...");
    const filePath = `${session.user.id}/${job.id}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("resumes").upload(filePath, file, { upsert: true });
    if (uploadError) { setResumeUploadMsg("❌ Upload failed: " + uploadError.message); return; }
    const { data: { publicUrl } } = supabase.storage.from("resumes").getPublicUrl(filePath);
    await supabase.from("jobs").update({ resume_url: publicUrl, resume_name: file.name, resume_notes: resumeNotes }).eq("id", job.id);
    setResumeUploadMsg("✅ Resume uploaded!");
    setResumeNotes("");
    fetchJobs();
    setDetailJob(prev => ({ ...prev, resume_url: publicUrl, resume_name: file.name, resume_notes: resumeNotes }));
    setTimeout(() => setResumeUploadMsg(""), 3000);
  };

  const removeResume = async (id) => {
    await supabase.from("jobs").update({ resume_url: null, resume_name: null, resume_notes: null }).eq("id", id);
    setDetailJob(prev => ({ ...prev, resume_url: null, resume_name: null, resume_notes: null }));
    fetchJobs();
  };

  const toggleColumn = (status) => {
    setCollapsedColumns(prev => {
      const updated = { ...prev, [status]: !prev[status] };
      localStorage.setItem("collapsedColumns", JSON.stringify(updated));
      return updated;
    });
  };

  const saveProfile = async () => {
    setAccountMsg("");
    const { error } = await supabase.from("profiles").upsert({ id: session.user.id, full_name: accountForm.full_name });
    if (error) { setAccountMsg("❌ " + error.message); return; }
    if (accountForm.email && accountForm.email !== session.user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: accountForm.email });
      if (emailError) { setAccountMsg("❌ " + emailError.message); return; }
    }
    if (accountForm.newPassword) {
      const { error: passError } = await supabase.auth.updateUser({ password: accountForm.newPassword });
      if (passError) { setAccountMsg("❌ " + passError.message); return; }
    }
    setProfile(p => ({ ...p, full_name: accountForm.full_name }));
    setAccountMsg("✅ Profile updated!");
    setTimeout(() => setAccountMsg(""), 3000);
  };

  const deleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    await supabase.from("jobs").delete().eq("user_id", session.user.id);
    await supabase.from("profiles").delete().eq("id", session.user.id);
    await supabase.auth.signOut();
  };

  const stats = STATUSES.reduce((acc, s) => { acc[s] = jobs.filter(j => j.status === s).length; return acc; }, {});
  const activeCount = jobs.filter(j => !["Rejected", "Withdrawn", "Position Closed"].includes(j.status)).length;

  if (!session) return <AuthScreen />;

  return (
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", minHeight: "100vh", background: darkMode ? "#111827" : "#f8f9fc", color: darkMode ? "#f9fafb" : "#111" }}>
      {/* HEADER */}
      <div style={{ background: darkMode ? "#1f2937" : "#fff", borderBottom: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 16 }}>💼</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: darkMode ? "#f9fafb" : "#111" }}>JobTrack</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {importMsg && <span style={{ fontSize: 13, color: importMsg.startsWith("✅") ? "#10b981" : "#ef4444" }}>{importMsg}</span>}
            <button onClick={() => setShowAccount(true)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontWeight: 500, cursor: "pointer", fontSize: 13 }}>
              👤 {profile.full_name || session.user.email}
            </button>
            <label style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontWeight: 500, cursor: "pointer", fontSize: 13 }}>
              📂 Import Excel
              <input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: "none" }} />
            </label>
            <button onClick={() => { setView("board"); localStorage.setItem("view", "board"); }} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid", borderColor: view === "board" ? "#6366f1" : "#e5e7eb", background: view === "board" ? "#eef2ff" : "#fff", color: view === "board" ? "#6366f1" : "#6b7280", fontWeight: 500, cursor: "pointer", fontSize: 13 }}>Board</button>
            <button onClick={() => { setView("table"); localStorage.setItem("view", "table"); }} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid", borderColor: view === "table" ? "#6366f1" : "#e5e7eb", background: view === "table" ? "#eef2ff" : "#fff", color: view === "table" ? "#6366f1" : "#6b7280", fontWeight: 500, cursor: "pointer", fontSize: 13 }}>Table</button>
            <button onClick={openAdd} style={{ padding: "6px 16px", borderRadius: 6, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 13 }}>+ Add Job</button>
            <button onClick={() => setDarkMode(d => { localStorage.setItem("darkMode", !d); return !d; })} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontWeight: 500, cursor: "pointer", fontSize: 13 }}>
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button onClick={handleLogout} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff", color: "#ef4444", fontWeight: 500, cursor: "pointer", fontSize: 13 }}>Log Out</button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 24px" }}>
        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Applications", value: jobs.length, color: "#6366f1" },
            { label: "Active", value: activeCount, color: "#8b5cf6" },
            { label: "Interviews", value: stats["Interview"] || 0, color: "#a855f7" },
            { label: "Offers", value: stats["Offer"] || 0, color: "#10b981" },
          ].map(s => (
            <div key={s.label} style={{ background: darkMode ? "#1f2937" : "#fff", borderRadius: 12, padding: "16px 20px", border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}` }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: darkMode ? "#d1d5db" : "#9ca3af", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* FILTERS */}
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

        {/* BOARD VIEW */}
        {!loading && view === "board" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
            {STATUSES.filter(status => filtered.some(j => j.status === status) || collapsedColumns[status]).map(status => {
              const cols = filtered.filter(j => j.status === status);
              const c = getColor(status);
              return (
                <div key={status} style={{ background: darkMode ? "#1f2937" : "#fff", borderRadius: 12, border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, overflow: "hidden" }}>
                  <div onClick={() => toggleColumn(status)} style={{ padding: "12px 16px", borderBottom: collapsedColumns[status] ? "none" : `1px solid ${darkMode ? "#374151" : "#f3f4f6"}`, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
                    <span style={{ fontWeight: 600, fontSize: 13, color: darkMode ? "#d1d5db" : "#374151" }}>{status}</span>
                    <span style={{ marginLeft: "auto", background: darkMode ? "#374151" : "#f3f4f6", color: darkMode ? "#d1d5db" : "#6b7280", borderRadius: 10, padding: "1px 8px", fontSize: 12 }}>{cols.length}</span>
                    <span style={{ fontSize: 10, color: "#9ca3af" }}>{collapsedColumns[status] ? "▶" : "▼"}</span>
                  </div>
                  {!collapsedColumns[status] && (
                    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, minHeight: 60 }}>
                      {cols.length === 0 && <div style={{ color: "#d1d5db", fontSize: 12, textAlign: "center", padding: "12px 0" }}>No applications</div>}
                      {cols.map(job => (
                        <div key={job.id} onClick={() => setDetailJob(job)} style={{ background: darkMode ? "#111827" : "#fafafa", border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, borderRadius: 8, padding: "10px 12px", cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: darkMode ? "#d1d5db" : "#111" }}>{job.company}</div>
                          <div style={{ fontSize: 12, color: darkMode ? "#9ca3af" : "#6b7280", marginTop: 2 }}>{job.role}</div>
                          {job.location && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>📍 {job.location}</div>}
                          {job.applied_date && <div style={{ fontSize: 11, color: "#9ca3af" }}>📅 {job.applied_date}</div>}
                          {job.notes && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontStyle: "italic" }}>{job.notes.substring(0, 60)}{job.notes.length > 60 ? "…" : ""}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TABLE VIEW */}
        {!loading && view === "table" && (
          <div style={{ background: darkMode ? "#1f2937" : "#fff", borderRadius: 12, border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: darkMode ? "#1f2937" : "#f9fafb" }}>
                  {["Company", "Role", "Location", "Salary", "Status", "Applied", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: darkMode ? "#d1d5db" : "#6b7280", borderBottom: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}` }}>{h}</th>
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
                    <tr key={job.id} style={{ borderBottom: `1px solid ${darkMode ? "#374151" : "#f3f4f6"}`, background: i % 2 === 0 ? (darkMode ? "#1f2937" : "#fff") : (darkMode ? "#111827" : "#fafafa") }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13, color: darkMode ? "#d1d5db" : "#111", cursor: "pointer" }} onClick={() => setDetailJob(job)}>{job.company}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: darkMode ? "#d1d5db" : "#374151" }}>{job.role}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: darkMode ? "#d1d5db" : "#6b7280" }}>{job.location || "—"}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#10b981", fontWeight: 500 }}>{job.salary || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <select value={job.status} onChange={e => updateStatus(job.id, e.target.value)}
                          style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: c.bg, color: c.color, fontSize: 12, fontWeight: 600, cursor: "pointer", outline: "none" }}>
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: darkMode ? "#d1d5db" : "#9ca3af" }}>{job.applied_date || "—"}</td>
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

      {/* JOB DETAIL DRAWER */}
      {detailJob && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 360, background: darkMode ? "#1f2937" : "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)", zIndex: 50, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: darkMode ? "#f9fafb" : "#111" }}>{detailJob.company}</div>
              <div style={{ color: "#6b7280", fontSize: 14, marginTop: 2 }}>{detailJob.role}</div>
            </div>
            <button onClick={() => setDetailJob(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>
          </div>
          <div style={{ padding: "20px 24px", flex: 1 }}>
            {[
              { label: "Status", value: <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, background: getColor(detailJob.status).bg, color: getColor(detailJob.status).color }}>{detailJob.status}</span> },
              { label: "Location", value: detailJob.location },
              { label: "Salary", value: detailJob.salary },
              { label: "Applied", value: detailJob.applied_date },
              { label: "Contact", value: detailJob.contact },
              { label: "URL", value: detailJob.url ? <a href={detailJob.url} target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1" }}>{detailJob.url}</a> : null },
              { label: "Notes", value: detailJob.notes },
            ].map(row => row.value ? (
              <div key={row.label} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{row.label}</div>
                <div style={{ fontSize: 14, color: darkMode ? "#d1d5db" : "#374151" }}>{row.value}</div>
              </div>
            ) : null)}
          </div>
          <div style={{ padding: "16px 24px", borderTop: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}` }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Resume</div>
              {detailJob.resume_url ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: darkMode ? "#111827" : "#f9fafb", borderRadius: 8, border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}` }}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: darkMode ? "#d1d5db" : "#111" }}>{detailJob.resume_name}</div>
                    {detailJob.resume_notes && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{detailJob.resume_notes}</div>}
                  </div>
                  <a href={detailJob.resume_url} target="_blank" rel="noopener noreferrer" style={{ padding: "4px 10px", borderRadius: 6, background: "#eef2ff", color: "#6366f1", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>View</a>
                  <button onClick={() => removeResume(detailJob.id)} style={{ padding: "4px 10px", borderRadius: 6, background: "#fee2e2", color: "#ef4444", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}>Remove</button>
                </div>
              ) : (
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: darkMode ? "#111827" : "#f9fafb", borderRadius: 8, border: `2px dashed ${darkMode ? "#374151" : "#e5e7eb"}`, cursor: "pointer" }}>
                    <span style={{ fontSize: 20 }}>📎</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: darkMode ? "#d1d5db" : "#374151" }}>Attach Resume</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>PDF files only</div>
                    </div>
                    <input type="file" accept=".pdf" onChange={(e) => handleResumeUpload(e, detailJob)} style={{ display: "none" }} />
                  </label>
                  <input placeholder="Notes about this resume version (optional)" value={resumeNotes} onChange={e => setResumeNotes(e.target.value)}
                    style={{ width: "100%", marginTop: 8, padding: "8px 10px", borderRadius: 7, border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, fontSize: 12, outline: "none", background: darkMode ? "#111827" : "#fff", color: darkMode ? "#d1d5db" : "#111", boxSizing: "border-box" }} />
                </div>
              )}
              {resumeUploadMsg && <div style={{ fontSize: 12, color: resumeUploadMsg.startsWith("✅") ? "#10b981" : "#ef4444", marginTop: 6 }}>{resumeUploadMsg}</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { openEdit(detailJob); setDetailJob(null); }} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, background: darkMode ? "#1f2937" : "#fff", color: darkMode ? "#d1d5db" : "#374151", fontWeight: 600, cursor: "pointer" }}>Edit</button>
              <button onClick={() => deleteJob(detailJob.id)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#ef4444", fontWeight: 600, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT DRAWER */}
      {showAccount && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 360, background: darkMode ? "#1f2937" : "#fff", boxShadow: "-4px 0 24px rgba(0,0,0,0.1)", zIndex: 50, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: darkMode ? "#f9fafb" : "#111" }}>Account</span>
            <button onClick={() => setShowAccount(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>
          </div>
          <div style={{ padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: "16px", background: darkMode ? "#111827" : "#f9fafb", borderRadius: 12, textAlign: "center" }}>
              <div style={{ width: 56, height: 56, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 24 }}>
                {profile.full_name ? profile.full_name[0].toUpperCase() : "👤"}
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: darkMode ? "#f9fafb" : "#111" }}>{profile.full_name || "No name set"}</div>
              <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2 }}>{session.user.email}</div>
            </div>
            {[
              { key: "full_name", label: "Full Name", type: "text", placeholder: "Your full name" },
              { key: "email", label: "New Email", type: "email", placeholder: session.user.email },
              { key: "newPassword", label: "New Password", type: "password", placeholder: "Leave blank to keep current" },
            ].map(field => (
              <div key={field.key}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: darkMode ? "#d1d5db" : "#374151", marginBottom: 5 }}>{field.label}</label>
                <input type={field.type} value={accountForm[field.key]} onChange={e => setAccountForm(f => ({ ...f, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, fontSize: 13, outline: "none", background: darkMode ? "#111827" : "#fff", color: darkMode ? "#d1d5db" : "#111", boxSizing: "border-box" }} />
              </div>
            ))}
            {accountMsg && <div style={{ padding: "10px 12px", borderRadius: 8, background: accountMsg.startsWith("✅") ? "#dcfce7" : "#fee2e2", color: accountMsg.startsWith("✅") ? "#15803d" : "#dc2626", fontSize: 13 }}>{accountMsg}</div>}
          </div>
          <div style={{ padding: "16px 24px", borderTop: `1px solid ${darkMode ? "#374151" : "#e5e7eb"}`, display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={saveProfile} style={{ padding: "10px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Save Changes</button>
            <button onClick={deleteAccount} style={{ padding: "10px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#ef4444", fontWeight: 600, cursor: "pointer" }}>Delete Account</button>
          </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
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