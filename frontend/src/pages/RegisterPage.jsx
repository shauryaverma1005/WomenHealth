import { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const API_BASE = "/api/v1";
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to register");
      }
      localStorage.setItem("token", data.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center animate-in fade-in duration-700">
      <section className="w-full max-w-md rounded-3xl border border-white/5 bg-white/[0.02] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-violet-600/20 blur-[80px]"></div>
        
        <div className="relative z-10">
          <h2 className="mb-2 text-3xl font-bold tracking-tight text-white drop-shadow-md">Create Account</h2>
          <p className="mb-6 text-slate-400">Join us to start tracking your health</p>
          
          {error && <div className="mb-6 rounded-lg bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-400 border border-rose-500/20">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:border-violet-500/50 focus:bg-black/40 focus:ring-2 focus:ring-violet-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:border-violet-500/50 focus:bg-black/40 focus:ring-2 focus:ring-violet-500/20"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Password</label>
              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:border-violet-500/50 focus:bg-black/40 focus:ring-2 focus:ring-violet-500/20"
                required
              />
            </div>
            <button
              type="submit"
              className="mt-6 w-full rounded-xl bg-violet-600/90 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] backdrop-blur-md transition-all hover:bg-violet-500 hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] active:scale-[0.98]"
            >
              Create Account
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default RegisterPage;
