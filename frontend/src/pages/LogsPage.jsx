import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api/v1";

const moodColorMap = {
  very_sad: "bg-slate-700 shadow-[0_0_10px_rgba(51,65,85,0.7)] text-white/90",
  sad: "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.7)] text-white/90",
  anxious: "bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.7)] text-white/90",
  stressed: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)] text-white/90",
  neutral: "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.7)] text-indigo-950",
  calm: "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)] text-cyan-950",
  happy: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)] text-emerald-950",
  very_happy: "bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.7)] text-green-950",
};

const Card = ({ children, className = "" }) => (
  <article className={`rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-xl backdrop-blur-xl ${className}`}>
    {children}
  </article>
);

function LogsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cycle"); // 'cycle' or 'mood'
  
  const [cycleLogs, setCycleLogs] = useState([]);
  const [moodLogs, setMoodLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      };

      try {
        const [cycleRes, moodRes] = await Promise.all([
          fetch(`${API_BASE}/cycle/history`, { headers }),
          fetch(`${API_BASE}/mood/history`, { headers })
        ]);

        if (cycleRes.status === 401 || moodRes.status === 401) {
             localStorage.removeItem("token");
             navigate("/login");
             return;
        }
        
        const cycleJson = await cycleRes.json();
        const moodJson = await moodRes.json();
        
        if (cycleJson.data) setCycleLogs(cycleJson.data || []);
        if (moodJson.data) setMoodLogs(moodJson.data || []);
        
      } catch (err) {
         console.error("Failed to fetch logs.", err);
      } finally {
         setLoading(false);
      }
    };
    fetchLogs();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/30 blur-[80px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
              Historical Logs
            </h2>
            <p className="mt-2 text-slate-400">
              Review all your tracked data securely.
            </p>
          </div>
          
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setActiveTab('cycle')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'cycle' 
                ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              Cycle Logs
            </button>
            <button 
              onClick={() => setActiveTab('mood')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'mood' 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              Mood Logs
            </button>
          </div>
        </div>
      </div>

      <Card className="min-h-[500px]">
        {activeTab === 'cycle' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {cycleLogs.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-slate-500">No cycle logs recorded yet.</div>
            ) : (
              <div className="grid gap-4">
                {cycleLogs.map((log) => {
                  const start = new Date(log.startDate);
                  const end = log.endDate ? new Date(log.endDate) : null;
                  const duration = end ? Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1) : null;

                  return (
                    <div key={log._id} className="rounded-xl border border-white/5 bg-black/20 p-5 hover:bg-black/40 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-rose-500/20 flex flex-col items-center justify-center text-rose-400 border border-rose-500/30">
                            <span className="text-xs font-bold leading-none">{start.toLocaleString("en-US", { month: "short" }).toUpperCase()}</span>
                            <span className="text-lg font-black leading-none">{start.getDate()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-white">Period Started</p>
                            <p className="text-sm text-slate-400">{start.getFullYear()}</p>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 items-center text-right">
                          {duration && (
                            <div className="text-center px-4 py-1.5 rounded-lg bg-white/5 border border-white/10">
                              <p className="text-xs text-slate-400 uppercase tracking-wider">Duration</p>
                              <p className="font-bold text-rose-300">{duration} Days</p>
                            </div>
                          )}
                          <div className="text-center px-4 py-1.5 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Status</p>
                            <p className="font-bold text-white">{end ? 'Completed' : 'Active'}</p>
                          </div>
                        </div>
                      </div>
                      
                      {(log.symptoms && log.symptoms.length > 0) && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {log.symptoms.map((symp, i) => (
                            <span key={i} className="px-2 py-1 bg-white/5 text-slate-300 text-xs rounded-md border border-white/10">
                              {symp}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {log.notes && (
                        <div className="mt-3 p-3 rounded-lg bg-black/30 border-l-2 border-slate-600 text-sm text-slate-300 italic">
                          "{log.notes}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'mood' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {moodLogs.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-slate-500">No mood logs recorded yet.</div>
            ) : (
              <div className="relative border-l border-white/10 ml-6 pl-6 py-2 space-y-8">
                {moodLogs.map((log) => {
                  const dateInfo = new Date(log.date);
                  return (
                    <div key={log._id} className="relative group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[30px] top-1 h-3 w-3 rounded-full border-[3px] border-slate-950 ${moodColorMap[log.mood] ? moodColorMap[log.mood].split(' ')[0] : 'bg-slate-400'} shadow-[0_0_0_2px_rgba(255,255,255,0.1)] group-hover:scale-150 transition-transform`} />
                      
                      <div className="mb-1 text-sm font-semibold text-slate-400">
                        {dateInfo.toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
                      </div>
                      
                      <div className="rounded-xl border border-white/5 bg-black/20 p-4 inline-block min-w-[250px] max-w-full">
                        <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md mb-2 ${moodColorMap[log.mood] || 'bg-slate-700 text-white'}`}>
                          {log.mood.replace('_', ' ')}
                        </span>
                        
                        {log.note ? (
                          <p className="text-slate-200 text-sm mt-1">{log.note}</p>
                        ) : (
                          <p className="text-slate-500 text-xs italic mt-1">No notes provided.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Card>
      
    </section>
  );
}

export default LogsPage;
