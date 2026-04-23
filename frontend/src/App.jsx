import { Link, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import LogsPage from "./pages/LogsPage";
import SettingsPage from "./pages/SettingsPage";
import PartnerDashboardPage from "./pages/PartnerDashboardPage";
import ExportPage from "./pages/ExportPage";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-violet-500/30 font-sans relative overflow-hidden print:bg-white print:text-black print:overflow-visible">
      {/* Background ambient light effects */}
      <div className="print:hidden pointer-events-none absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[120px] transition-all" />
      <div className="print:hidden pointer-events-none absolute top-[20%] -right-[10%] w-[40%] h-[50%] rounded-full bg-fuchsia-600/10 blur-[120px] transition-all" />
      
      <header className="print:hidden relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="flex items-center gap-3 text-xl font-bold tracking-tight text-white drop-shadow-md">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 shadow-lg shadow-violet-500/30">
              <span className="h-3 w-3 rounded-full bg-white opacity-80 mix-blend-overlay"></span>
            </span>
            Health Tracker
          </h1>
          <nav className="flex gap-6 text-sm font-medium">
            <Link className="text-slate-400 transition-colors hover:text-violet-400 hover:drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" to="/login">
              Login
            </Link>
            <Link className="text-slate-400 transition-colors hover:text-violet-400 hover:drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" to="/register">
              Register
            </Link>
            <Link className="text-slate-400 transition-colors hover:text-violet-400 hover:drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" to="/dashboard">
              Dashboard
            </Link>
            <Link className="text-slate-400 transition-colors hover:text-violet-400 hover:drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" to="/logs">
              History
            </Link>
            <Link className="text-slate-400 transition-colors hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" to="/partner-dashboard">
              Partner View
            </Link>
            <Link className="text-slate-400 transition-colors hover:text-emerald-400 hover:drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" to="/export">
              Export
            </Link>
            <Link className="text-slate-400 transition-colors hover:text-fuchsia-400 hover:drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" to="/settings">
              Settings
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-6 py-8 md:py-12 print:p-0 print:m-0 print:max-w-none">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/partner-dashboard" element={<PartnerDashboardPage />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
