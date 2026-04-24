import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE = "/api/v1";

const moodColorMap = {
  very_sad: "bg-slate-700 shadow-[0_0_15px_rgba(51,65,85,0.7)]",
  sad: "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.7)]",
  anxious: "bg-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.7)]",
  stressed: "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.7)]",
  neutral: "bg-violet-400 shadow-[0_0_15px_rgba(167,139,250,0.7)]",
  calm: "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.7)]",
  happy: "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.7)]",
  very_happy: "bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.7)]",
};

const moodScoreMap = {
  very_sad: 1, sad: 2, anxious: 2, stressed: 2,
  neutral: 3, calm: 4, happy: 4, very_happy: 5,
};

const getEmptyDates = () => {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-sm font-bold text-violet-300">
          {payload[0].name === "score" ? "Mood Score" : payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const Card = ({ children, className = "", style = {} }) => (
  <article style={style} className={`relative rounded-2xl border border-white/5 bg-white/[0.02] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition-all hover:bg-white/[0.04] hover:border-white/10 overflow-hidden ${className}`}>
    {children}
  </article>
);

const Input = ({ label, ...props }) => (
  <div className="mb-4">
    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">{label}</label>
    {props.type === 'select' ? (
      <select
        {...props}
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:border-violet-500/50 focus:bg-black/40 focus:ring-2 focus:ring-violet-500/20"
      >
        {props.children}
      </select>
    ) : props.type === 'textarea' ? (
      <textarea
        {...props}
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:border-violet-500/50 focus:bg-black/40 focus:ring-2 focus:ring-violet-500/20"
      />
    ) : (
      <input
        {...props}
        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:border-violet-500/50 focus:bg-black/40 focus:ring-2 focus:ring-violet-500/20"
      />
    )}
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
    {children}
  </h3>
);

function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitMsg, setSubmitMsg] = useState(null);

  // Forms
  const availableSymptoms = ["Cramps", "Headache", "Fatigue", "Bloating", "Nausea", "Backache", "Mood Swings"];
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const [periodNotes, setPeriodNotes] = useState("");
  
  const [selectedMood, setSelectedMood] = useState("neutral");
  const [moodNote, setMoodNote] = useState("");
  const [waterIntake, setWaterIntake] = useState(0);
  const dailyGoal = 8;

  // Data
  const [nextPeriod, setNextPeriod] = useState("Need more data");
  const [predictionData, setPredictionData] = useState(null);
  const [moodInsight, setMoodInsight] = useState(null);
  const [currentMood, setCurrentMood] = useState("Not set");
  const [moodTrend, setMoodTrend] = useState([]);
  const [cycleData, setCycleData] = useState([]);
  const [hydrationTrend, setHydrationTrend] = useState([]);
  
  const [dailyTips, setDailyTips] = useState(null);
  const [activeTipTab, setActiveTipTab] = useState("diet");

  const hydrationPercent = useMemo(
    () => Math.min(100, Math.round((waterIntake / dailyGoal) * 100)),
    [waterIntake, dailyGoal]
  );

  const showMsg = (msg) => {
    setSubmitMsg(msg);
    setTimeout(() => setSubmitMsg(null), 3000);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const handleSymptomToggle = (symp) => {
    setSymptoms(prev => prev.includes(symp) ? prev.filter(s => s !== symp) : [...prev, symp]);
  };

  const fetchData = async () => {
    try {
      const headers = getAuthHeaders();
      const [moodRes, cycleHistRes, predRes, hydroRes, moodInsightRes, tipsRes] = await Promise.all([
        fetch(`${API_BASE}/mood/history`, { headers }),
        fetch(`${API_BASE}/cycle/history`, { headers }),
        fetch(`${API_BASE}/cycle/predict`, { headers }),
        fetch(`${API_BASE}/hydration/stats`, { headers }),
        fetch(`${API_BASE}/prediction/next-day-mood`, { headers }),
        fetch(`${API_BASE}/prediction/tips`, { headers }),
      ]);

      if (moodRes.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const moodJson = await moodRes.json();
      const cycleHistJson = await cycleHistRes.json();
      const predJson = await predRes.json();
      const hydroJson = await hydroRes.json();
      const moodInsightJson = await moodInsightRes.json();
      const tipsJson = await tipsRes.json();

      // Process Mood
      if (moodJson.data && moodJson.data.length > 0) {
        const today = new Date().toDateString();
        const todaysMood = moodJson.data.find(m => new Date(m.date).toDateString() === today);
        if (todaysMood) {
          setCurrentMood(todaysMood.mood);
          setSelectedMood(todaysMood.mood);
        }

        const recentMoods = moodJson.data.slice(0, 7).reverse();
        const mappedMood = recentMoods.map(m => ({
          day: new Date(m.date).toLocaleDateString("en-US", { weekday: "short" }),
          score: moodScoreMap[m.mood] || 3
        }));
        setMoodTrend(mappedMood.length ? mappedMood : getEmptyDates().map(d => ({day: d, score: 0})));
      } else {
        setMoodTrend(getEmptyDates().map(d => ({day: d, score: 0})));
      }

      // Process Cycle
      if (cycleHistJson.data && cycleHistJson.data.length > 0) {
        const mappedCycle = cycleHistJson.data
          .slice(0, 5)
          .reverse()
          .map((c, i) => {
            const start = new Date(c.startDate).getTime();
            const end = c.endDate ? new Date(c.endDate).getTime() : start + (5 * 24 * 60 * 60 * 1000);
            return {
              cycle: `Log ${i + 1}`,
              length: Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1)
            };
          });
        setCycleData(mappedCycle);
      } else {
        setCycleData([]);
      }

      // Predict Next Period and Ovulation
      if (predJson.data) {
        setPredictionData(predJson.data);
        if (predJson.data.predictedNextStartDate) {
          setNextPeriod(new Date(predJson.data.predictedNextStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
        }
      }

      // Process Hydration
      if (hydroJson.data) {
        setWaterIntake(hydroJson.data.dailyIntake || 0);
        if (hydroJson.data.weeklyLogs) {
          const dict = {};
          hydroJson.data.weeklyLogs.forEach(l => {
            const d = new Date(l.date).toLocaleDateString("en-US", { weekday: "short" });
            dict[d] = l.intake;
          });
          
          const mappedHydro = getEmptyDates().map(day => ({
             day,
             intake: dict[day] || 0
          }));
          setHydrationTrend(mappedHydro);
        }
      }
      
      // Mood Insight
      if (moodInsightJson.data) {
        setMoodInsight(moodInsightJson.data);
      }
      
      // Daily Tips
      if (tipsJson.data) {
        setDailyTips(tipsJson.data);
      }

    } catch (err) {
      console.error(err);
      if (err.message === "No token") navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handlePeriodSubmit = async (e) => {
    e.preventDefault();
    if (!periodStart) return showMsg("Period Start Date is missing.");
    try {
      const res = await fetch(`${API_BASE}/cycle/logs`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          startDate: periodStart,
          endDate: periodEnd || null,
          symptoms: symptoms,
          notes: periodNotes
        }),
      });
      if (res.ok) {
        showMsg("Cycle logged successfully!");
        setSymptoms([]);
        setPeriodNotes("");
        fetchData();
      }
    } catch (err) {
      showMsg("Failed to save period.");
    }
  };

  const handleMoodSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/mood/logs`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ date: new Date().toISOString(), mood: selectedMood, note: moodNote }),
      });
      if (res.ok) {
        showMsg("Mood recorded!");
        fetchData();
      }
    } catch (err) {
      showMsg("Failed to save mood.");
    }
  };

  const handleHydrationSubmit = async (amount = 1) => {
    if (waterIntake + amount < 0) return;
    try {
      const res = await fetch(`${API_BASE}/hydration/logs`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ intake: amount, date: new Date().toISOString() })
      });
      if (res.ok) {
        showMsg(amount > 0 ? "Added 1 glass of water!" : "Removed 1 glass of water!");
        fetchData();
      }
    } catch (err) {
      showMsg("Failed to save hydration.");
    }
  };

  const handlePartnerPing = async (status) => {
    try {
      const res = await fetch(`${API_BASE}/partner/quick-status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showMsg(`Partner Ping sent: "${status}"`);
      }
    } catch(err) {
      showMsg("Failed to send partner ping.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      {/* Toast Notification */}
      {submitMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-violet-600 px-6 py-3 text-white shadow-xl shadow-violet-500/30 border border-violet-400/50 flex items-center gap-2 animate-in slide-in-from-right-4">
          <span className="h-2 w-2 rounded-full bg-white opacity-80" />
          {submitMsg}
        </div>
      )}

      {/* Quick Partner Boundary Ping */}
      <Card className="relative overflow-hidden border-indigo-500/10 shadow-[0_15px_40px_rgba(99,102,241,0.05)]! p-2! md:p-3!">
         <div className="flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-2 pl-2">
             <span className="relative flex h-2.5 w-2.5">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
             </span>
             <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Partner Ping</span>
           </div>
           
           <div className="flex gap-2 w-full md:w-auto">
             <button onClick={() => handlePartnerPing("Need space")} className="flex-1 md:flex-none px-3 py-1.5 md:py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-300 text-xs font-medium transition-all">
               Need space
             </button>
             <button onClick={() => handlePartnerPing("Feeling low")} className="flex-1 md:flex-none px-3 py-1.5 md:py-1 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500 hover:text-white text-purple-300 text-xs font-medium transition-all">
               Feeling low
             </button>
             <button onClick={() => handlePartnerPing("All good 😊")} className="flex-1 md:flex-none px-3 py-1.5 md:py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-300 text-xs font-medium transition-all">
               All good 😊
             </button>
           </div>
         </div>
      </Card>

      {/* Cycle Predictive Insights Section */}
      {(predictionData?.predictedOvulationDate || moodInsight?.factors?.cyclePhase !== 'unknown') && (
        <Card className="mb-6 relative overflow-hidden border-fuchsia-500/20 shadow-[0_15px_40px_rgba(217,70,239,0.15)]">
          <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-fuchsia-600/20 blur-[80px]"></div>
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-violet-600/10 to-transparent pointer-events-none"></div>
          
          <SectionTitle>
             <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.9)] animate-pulse"></span>
             Predictive Cycle Insights
          </SectionTitle>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 relative z-10">
            {predictionData?.predictedOvulationDate && (
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Ovulation Prediction</p>
                <p className="text-xl font-bold tracking-tight text-fuchsia-300 drop-shadow-md">
                  {new Date(predictionData.predictedOvulationDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            )}
            
            {predictionData?.predictedFertileWindowStart && (
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Fertile Window</p>
                <p className="text-lg font-bold tracking-tight text-white drop-shadow-md">
                  {new Date(predictionData.predictedFertileWindowStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(predictionData.predictedFertileWindowEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            )}
            
            {moodInsight && moodInsight.factors.cyclePhase !== "unknown" && (
               <div className="lg:col-span-2">
                 <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Tomorrow's Phase & Predicted Mood</p>
                 <div className="flex items-center gap-3 mb-2">
                   <p className="text-xl font-bold tracking-tight text-white capitalize drop-shadow-md">
                     {moodInsight.factors.cyclePhase} Phase
                   </p>
                   <span className="px-2.5 py-1 rounded-md bg-white/10 text-xs font-semibold text-slate-200 border border-white/5 box-shadow-sm capitalize">
                     Mood: {moodInsight.predictedMood.replace("_", " ")}
                   </span>
                 </div>
                 {moodInsight.suggestions && moodInsight.suggestions.length > 0 && (
                   <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside mt-3 marker:text-fuchsia-500">
                     {moodInsight.suggestions.map((s, i) => <li key={i} className="leading-relaxed">{s}</li>)}
                   </ul>
                 )}
               </div>
            )}
          </div>
        </Card>
      )}

      {/* Daily Categorized Tips */}
      {dailyTips && dailyTips.tips && (
        <Card className="mb-6 relative overflow-hidden border-cyan-500/20 shadow-[0_15px_40px_rgba(6,182,212,0.1)]">
          <SectionTitle>
             <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.7)]"></span>
             Daily Recommended Tips
             <span className="capitalize text-slate-400 ml-2 text-sm bg-white/5 px-2 py-0.5 rounded-md border border-white/10 font-medium">{dailyTips.cyclePhase} Phase</span>
          </SectionTitle>
          
          <div className="flex flex-wrap gap-2 mb-4 border-b border-white/5 pb-4">
            {[
              { id: 'diet', label: 'Diet', icon: '🍎' },
              { id: 'exercise', label: 'Exercise', icon: '🏃‍♀️' },
              { id: 'mentalHealth', label: 'Mental Health', icon: '🧠' },
              { id: 'pmsRelief', label: 'PMS Relief', icon: '💊' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTipTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all duration-300 ${
                  activeTipTab === tab.id 
                  ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-200 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-black/20 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-slate-200'
                }`}
              >
                <span className="opacity-80">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div key={activeTipTab} className="min-h-[4rem] px-5 py-4 rounded-xl bg-black/30 border border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all text-slate-300 text-sm leading-relaxed border-l-2 border-l-cyan-500">
             {dailyTips.tips[activeTipTab]}
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next Predicted Period</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{nextPeriod}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Mood</p>
          <div className="mt-2 flex items-center gap-3">
            <span className={`h-3.5 w-3.5 rounded-full ${moodColorMap[currentMood] || "bg-slate-700"} transition-all duration-500`} />
            <p className="text-2xl font-bold capitalize tracking-tight text-white">
              {currentMood.replace("_", " ")}
            </p>
          </div>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hydration Progress</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-2xl font-bold tracking-tight text-white">
              {waterIntake}<span className="text-base text-slate-500 opacity-70">/{dailyGoal}</span>
            </p>
            <p className="text-sm font-medium text-cyan-400">{hydrationPercent}%</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1 border-t-[var(--card-accent)]" style={{ "--card-accent": "#f43f5e" }}>
          <SectionTitle>
            <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]"></span>
            Cycle Tracker
          </SectionTitle>
          <form onSubmit={handlePeriodSubmit} className="space-y-4 relative z-10">
            <Input label="Start Date" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
            <Input label="End Date" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Symptoms</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableSymptoms.map(symp => (
                  <button
                    key={symp}
                    type="button"
                    onClick={() => handleSymptomToggle(symp)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 border ${symptoms.includes(symp) ? 'bg-rose-500 border-rose-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-black/20 border-white/10 text-slate-300 hover:bg-white/10'}`}
                  >
                    {symp}
                  </button>
                ))}
              </div>
            </div>
            
            <Input label="Cycle Notes" type="textarea" rows={3} placeholder="Add any details about this cycle..." value={periodNotes} onChange={(e) => setPeriodNotes(e.target.value)} />
            
            <button type="submit" className="mt-2 w-full rounded-xl bg-violet-600/90 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] backdrop-blur-md transition-all hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] active:scale-[0.98]">
              Log Cycle
            </button>
          </form>
        </Card>

        <Card className="xl:col-span-1">
          <SectionTitle>
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]"></span>
            Mood Logger
          </SectionTitle>
          <form onSubmit={handleMoodSubmit} className="space-y-4">
            <Input label="How are you feeling?" type="select" value={selectedMood} onChange={(e) => setSelectedMood(e.target.value)}>
              <option value="very_sad" className="bg-slate-900">Very Sad</option>
              <option value="sad" className="bg-slate-900">Sad</option>
              <option value="anxious" className="bg-slate-900">Anxious</option>
              <option value="stressed" className="bg-slate-900">Stressed</option>
              <option value="neutral" className="bg-slate-900">Neutral</option>
              <option value="calm" className="bg-slate-900">Calm</option>
              <option value="happy" className="bg-slate-900">Happy</option>
              <option value="very_happy" className="bg-slate-900">Very Happy</option>
            </Input>
            <Input label="Notes" type="textarea" rows={4} placeholder="What's making you feel this way?" value={moodNote} onChange={(e) => setMoodNote(e.target.value)} />
            <button type="submit" className="mt-2 w-full rounded-xl bg-violet-600/90 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] backdrop-blur-md transition-all hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] active:scale-[0.98]">
              Record Mood
            </button>
          </form>
        </Card>

        <Card className="xl:col-span-1 flex flex-col">
          <SectionTitle>
            <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.7)]"></span>
            Hydration
          </SectionTitle>
          <div className="space-y-6 flex-grow flex flex-col justify-center">
            <div>
              <div className="mb-3 flex items-end justify-between font-medium">
                <span className="text-xs uppercase tracking-wider text-slate-400">Daily Goal</span>
                <span className="text-sm text-cyan-400">{hydrationPercent}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-black/40 border border-white/5 shadow-inner relative">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-700 ease-out relative"
                  style={{ width: `${hydrationPercent}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] -translate-x-full animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-slate-400 mb-6">Update your water intake.</p>
              <div className="flex items-center justify-center gap-6">
                <button onClick={() => handleHydrationSubmit(-1)} type="button" disabled={waterIntake <= 0} className="h-16 w-16 rounded-full bg-slate-800/80 border border-white/5 flex items-center justify-center text-slate-400 shadow-[0_0_15px_rgba(0,0,0,0.2)] backdrop-blur-md transition-all hover:bg-slate-700 hover:text-white active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800/80 disabled:hover:text-slate-400 group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                  </svg>
                </button>
                <button onClick={() => handleHydrationSubmit(1)} type="button" className="h-24 w-24 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(6,182,212,0.5)] backdrop-blur-md transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] active:scale-95 group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-80 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <SectionTitle>Mood Trend</SectionTitle>
          <div className="h-64 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Area type="monotone" name="score" dataKey="score" stroke="#a855f7" strokeWidth={3} fill="url(#moodFill)" activeDot={{ r: 6, strokeWidth: 0, fill: '#d8b4fe', className: "drop-shadow-[0_0_8px_rgba(216,180,254,0.8)]" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="xl:col-span-1">
          <SectionTitle>Period Duration</SectionTitle>
          <div className="h-64 -mx-2">
            {cycleData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cycleData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cycleFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#c026d3" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="cycle" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="length" fill="url(#cycleFill)" radius={[6, 6, 0, 0]} name="Days" maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
            ) : (
               <div className="w-full h-full flex items-center justify-center text-slate-500 italic text-sm">No cycle logs yet.</div>
            )}
          </div>
        </Card>

        <Card className="xl:col-span-1">
          <SectionTitle>Hydration History</SectionTitle>
          <div className="h-64 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hydrationTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Line type="monotone" name="Glasses" dataKey="intake" stroke="#06b6d4" strokeWidth={3} dot={{ strokeWidth: 3, r: 4, stroke: '#06b6d4', fill: '#0f172a' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#67e8f9', className: "drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </section>
  );
}

export default DashboardPage;
