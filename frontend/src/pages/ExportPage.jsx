import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api/v1";

const Card = ({ children, className = "" }) => (
  <article className={`rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-xl backdrop-blur-xl ${className}`}>
    {children}
  </article>
);

function ExportPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

      // We need user profile data and all history arrays to parse and build the doc.
      // We will pretend we have a /auth/me or just use a generic 'Patient' flag.
      const [cycleRes, moodRes, waterRes] = await Promise.all([
        fetch(`${API_BASE}/cycle/history`, { headers }),
        fetch(`${API_BASE}/mood/history`, { headers }),
        fetch(`${API_BASE}/hydration/history`, { headers }),
      ]);

      if (cycleRes.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const cycleJson = await cycleRes.json();
      const moodJson = await moodRes.json();
      const waterJson = await waterRes.json();

      const startMs = new Date(startDate).getTime();
      const endMs = new Date(endDate).getTime();
      endMs && (new Date(endMs).setHours(23, 59, 59, 999)); // end of day

      const filterByDate = (item, dateKey) => {
        const t = new Date(item[dateKey]).getTime();
        return t >= startMs && t <= endMs;
      };

      const filteredCycle = (cycleJson.data || []).filter(c => filterByDate(c, "startDate"));
      const filteredMood = (moodJson.data || []).filter(m => filterByDate(m, "date"));
      const filteredWater = (waterJson.data || []).filter(w => filterByDate(w, "date"));

      // Analytics computation matching Doctor expectations
      const totalWater = filteredWater.reduce((sum, log) => sum + log.intake, 0);
      const avgWater = filteredWater.length > 0 ? (totalWater / filteredWater.length).toFixed(1) : 0;

      const symptomTracker = {};
      filteredCycle.forEach(c => {
         if (c.symptoms) {
             c.symptoms.forEach(s => {
                 symptomTracker[s] = (symptomTracker[s] || 0) + 1;
             });
         }
      });

      setReportData({
        bounds: { start: startDate, end: endDate },
        cycleLogs: filteredCycle,
        moodLogs: filteredMood,
        waterLogs: filteredWater,
        analytics: {
            avgWater,
            totalWater,
            symptoms: Object.entries(symptomTracker).sort((a, b) => b[1] - a[1]) // sorting descending
        }
      });

    } catch (err) {
      setErrorMsg("Failed to generate report parameters. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const executePrint = () => {
    window.print();
  };

  return (
    <>
      {/* -------------------- UI SCREEN VIEW (Hidden inside PDFs) -------------------- */}
      <section className="print:hidden space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/60 to-emerald-900/20 p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-600/20 blur-[80px]"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/30">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </span>
              Export PDF Reports
            </h2>
            <p className="mt-2 text-slate-400">
              Compile your tracked analytics into a clean, strictly formatted document for medical review.
            </p>
          </div>
        </div>

        <Card className="border-emerald-500/30 shadow-[0_15px_40px_rgba(16,185,129,0.1)]">
           <form onSubmit={handleGenerateReport} className="grid md:grid-cols-3 gap-6 items-end">
             <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Range Start Date</label>
                <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-black/40 focus:ring-2 focus:ring-emerald-500/20" />
             </div>
             <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Range End Date</label>
                <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:border-emerald-500/50 focus:bg-black/40 focus:ring-2 focus:ring-emerald-500/20" />
             </div>
             <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 font-semibold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-transform">
               {loading ? "Compiling..." : "Compile Data"}
             </button>
           </form>
           {errorMsg && <p className="text-red-400 text-sm mt-4">{errorMsg}</p>}
        </Card>

        {reportData && (
           <Card className="border-white/10 text-center py-10">
              <div className="h-20 w-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Report Compiled Successfully</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                {reportData.cycleLogs.length} Cycles, {reportData.moodLogs.length} Moods, and {reportData.waterLogs.length} Hydration logs mapped. 
              </p>
              
              <button onClick={executePrint} className="px-8 py-3 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors shadow-lg">
                Download PDF Document
              </button>
              <p className="text-xs text-slate-500 mt-4 italic">The system browser will isolate the data into a strict white-background print grid.</p>
           </Card>
        )}
      </section>

      {/* -------------------- PDF DOM RENDER (Hidden on Monitors) -------------------- */}
      {reportData && (
        <div className="hidden print:block w-full max-w-none bg-white text-black p-8 font-sans">
          
          <div className="border-b-2 border-black pb-4 mb-8">
            <h1 className="text-4xl font-bold uppercase tracking-tight">Patient Health Export</h1>
            <p className="text-base font-semibold mt-2">Report Boundaries: {reportData.bounds.start} to {reportData.bounds.end}</p>
            <p className="text-sm mt-1">Generated electronically.</p>
          </div>

          {/* Section 1: Cycle Logs */}
          <div className="mb-10 page-break-inside-avoid">
             <h2 className="text-2xl font-bold uppercase border-b border-gray-300 pb-2 mb-4">Menstrual Cycle History</h2>
             {reportData.cycleLogs.length === 0 ? (
                <p className="text-base text-gray-500 italic">No cycles recorded in this timeframe.</p>
             ) : (
                <table className="w-full text-base border-collapse border border-gray-300">
                  <thead className="bg-gray-100 font-bold border-b-2 border-gray-400">
                    <tr>
                      <th className="border border-gray-300 p-3 text-left">Start Date</th>
                      <th className="border border-gray-300 p-3 text-left">End Date</th>
                      <th className="border border-gray-300 p-3 text-center">Duration</th>
                      <th className="border border-gray-300 p-3 text-left">Symptoms</th>
                      <th className="border border-gray-300 p-3 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.cycleLogs.map((log, i) => {
                       const s = new Date(log.startDate);
                       const e = log.endDate ? new Date(log.endDate) : null;
                       const dur = e ? Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1) + " Days" : "Ongoing";
                       return (
                         <tr key={i} className="even:bg-gray-50">
                           <td className="border border-gray-300 p-3 whitespace-nowrap">{s.toLocaleDateString()}</td>
                           <td className="border border-gray-300 p-3 whitespace-nowrap">{e ? e.toLocaleDateString() : "Active"}</td>
                           <td className="border border-gray-300 p-3 text-center font-medium whitespace-nowrap">{dur}</td>
                           <td className="border border-gray-300 p-3">{(log.symptoms || []).join(", ") || "-"}</td>
                           <td className="border border-gray-300 p-3 italic">{log.notes || "-"}</td>
                         </tr>
                       )
                    })}
                  </tbody>
                </table>
             )}
          </div>

          {/* Section 2: Full Mood Logs */}
          <div className="mb-10 page-break-inside-avoid">
             <h2 className="text-2xl font-bold uppercase border-b border-gray-300 pb-2 mb-4">Daily Mood Logs</h2>
             {reportData.moodLogs.length === 0 ? (
                <p className="text-base text-gray-500 italic">No moods recorded in this timeframe.</p>
             ) : (
                <table className="w-full text-base border-collapse border border-gray-300">
                  <thead className="bg-gray-100 font-bold border-b-2 border-gray-400">
                    <tr>
                      <th className="border border-gray-300 p-3 text-left w-32">Date</th>
                      <th className="border border-gray-300 p-3 text-left w-32">Mood State</th>
                      <th className="border border-gray-300 p-3 text-left">Patient Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.moodLogs.map((log, i) => {
                       const d = new Date(log.date).toLocaleDateString();
                       return (
                         <tr key={i} className="even:bg-gray-50">
                           <td className="border border-gray-300 p-3 font-medium whitespace-nowrap">{d}</td>
                           <td className="border border-gray-300 p-3 capitalize font-semibold">{log.mood.replace("_", " ")}</td>
                           <td className="border border-gray-300 p-3 italic text-gray-700">{log.note || "-"}</td>
                         </tr>
                       )
                    })}
                  </tbody>
                </table>
             )}
          </div>

          <div className="text-center text-sm font-semibold text-gray-400 mt-12 pt-4 border-t-2 border-black">
            ** End of Clinical Export **
          </div>

        </div>
      )}

    </>
  );
}

export default ExportPage;
