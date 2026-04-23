import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE = "/api/v1";

const moodScoreMap = {
  very_sad: 1, sad: 2, anxious: 2, stressed: 2,
  neutral: 3, calm: 4, happy: 4, very_happy: 5,
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-sm font-bold text-cyan-300">
          {payload[0].name === "score" ? "Mood Score" : payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const Card = ({ children, className = "" }) => (
  <article className={`relative rounded-2xl border border-white/5 bg-white/[0.02] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl ${className}`}>
    {children}
  </article>
);

const SectionTitle = ({ children }) => (
  <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
    {children}
  </h3>
);

function PartnerDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [sharedData, setSharedData] = useState(null);

  const [moodTrend, setMoodTrend] = useState([]);
  const [cycleData, setCycleData] = useState([]);
  const [hydrationTrend, setHydrationTrend] = useState([]);

  useEffect(() => {
    const fetchSharedData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/partner/shared-data`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const json = await res.json();
        
        if (!res.ok) {
          throw new Error(json.message || "Failed to load shared data");
        }

        const data = json.data;
        setSharedData(data);

        // Map Moods
        if (data.permissions.mood && data.moodLogs.length > 0) {
          const recent = [...data.moodLogs].reverse().slice(-7);
          const mapped = recent.map(m => ({
            day: new Date(m.date).toLocaleDateString("en-US", { weekday: "short" }),
            score: moodScoreMap[m.mood] || 3
          }));
          setMoodTrend(mapped);
        }

        // Map Cycles
        if (data.permissions.cycle && data.periodLogs.length > 0) {
          const mappedCycle = [...data.periodLogs].reverse().map((c, i) => {
            const start = new Date(c.startDate).getTime();
            const end = c.endDate ? new Date(c.endDate).getTime() : start + (5 * 24 * 60 * 60 * 1000);
            return {
              cycle: `Log ${i + 1}`,
              length: Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1)
            };
          }).slice(-5);
          setCycleData(mappedCycle);
        }

        // Map Hydration
        if (data.permissions.hydration && data.waterLogs.length > 0) {
          const mappedHydro = [...data.waterLogs].reverse().map(w => ({
            day: new Date(w.date).toLocaleDateString("en-US", { weekday: "short" }),
            intake: w.intake
          })).slice(-7);
          setHydrationTrend(mappedHydro);
        }

      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSharedData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col h-96 w-full items-center justify-center text-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
          <span className="text-3xl">🔒</span>
        </div>
        <h2 className="text-2xl font-bold text-white">No Shared Dashboard</h2>
        <p className="text-slate-400 max-w-md">
          {errorMsg}. If your partner wants to share their tracking insights, they need to invite you via the Settings page!
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/60 to-cyan-900/30 p-8 shadow-2xl backdrop-blur-xl mb-8">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-600/20 blur-[80px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
              {sharedData.sharedBy.name}'s Insights
            </h2>
            <p className="mt-2 text-cyan-200/80">
              Shared partner dashboard. Viewing permitted analytics.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            {!sharedData.permissions.cycle && <span className="px-3 py-1 bg-rose-500/10 text-rose-400 text-xs font-bold uppercase rounded-md border border-rose-500/20">Cycle Hidden</span>}
            {!sharedData.permissions.mood && <span className="px-3 py-1 bg-fuchsia-500/10 text-fuchsia-400 text-xs font-bold uppercase rounded-md border border-fuchsia-500/20">Mood Hidden</span>}
            {!sharedData.permissions.hydration && <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase rounded-md border border-blue-500/20">Hydration Hidden</span>}
          </div>
        </div>
      </div>

      {(sharedData.sharedBy && sharedData.sharedBy.quickStatus && sharedData.sharedBy.quickStatus.text) && (
        <Card className="mb-6 relative overflow-hidden border-indigo-500/30 bg-indigo-900/10 shadow-[0_15px_40px_rgba(99,102,241,0.1)]">
           <div className="absolute top-0 right-0 h-full w-2 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"></div>
           <div className="flex flex-col md:flex-row items-center justify-between">
             <div className="flex flex-col">
               <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Direct Partner Ping</span>
               <span className="text-2xl font-black text-white italic tracking-tight">"{sharedData.sharedBy.quickStatus.text}"</span>
             </div>
             <div className="mt-4 md:mt-0 text-right">
               <span className="block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                 Updated: {new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(Math.round((new Date(sharedData.sharedBy.quickStatus.updatedAt) - new Date()) / 60000), 'minute').replace('in 0 minutes', 'Just now')}
               </span>
             </div>
           </div>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {sharedData.permissions.mood && (
          <Card className="xl:col-span-1 border-fuchsia-500/20">
            <SectionTitle>
              <span className="h-2 w-2 rounded-full bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.7)]"></span>
              Mood Trends
            </SectionTitle>
            <div className="h-64 -mx-2">
              {moodTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={moodTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="partnerMoodFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d946ef" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Area type="monotone" name="score" dataKey="score" stroke="#d946ef" strokeWidth={3} fill="url(#partnerMoodFill)" activeDot={{ r: 6, fill: '#fdf4ff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No mood data logged.</div>
              )}
            </div>
          </Card>
        )}

        {sharedData.permissions.cycle && (
          <Card className="xl:col-span-1 border-rose-500/20">
            <SectionTitle>
              <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]"></span>
              Cycle Length Pattern
            </SectionTitle>
            <div className="h-64 -mx-2">
              {cycleData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cycleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="partnerCycleFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#881337" stopOpacity={0.4} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="cycle" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="length" fill="url(#partnerCycleFill)" radius={[6, 6, 0, 0]} name="Days" maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No cycle data logged.</div>
              )}
            </div>
          </Card>
        )}

        {sharedData.permissions.hydration && (
          <Card className="xl:col-span-1 border-cyan-500/20 md:col-span-2 lg:col-span-1">
            <SectionTitle>
              <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.7)]"></span>
              Hydration Monitoring
            </SectionTitle>
            <div className="h-64 -mx-2">
              {hydrationTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hydrationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Line type="monotone" name="Glasses" dataKey="intake" stroke="#06b6d4" strokeWidth={3} dot={{ strokeWidth: 3, r: 4, stroke: '#06b6d4', fill: '#0f172a' }} activeDot={{ r: 6, fill: '#cffafe' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No hydration data logged.</div>
              )}
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}

export default PartnerDashboardPage;
