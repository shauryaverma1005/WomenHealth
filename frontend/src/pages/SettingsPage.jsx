import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api/v1";

const Card = ({ children, className = "" }) => (
  <article className={`rounded-2xl border border-white/5 bg-white/[0.02] p-6 shadow-xl backdrop-blur-xl ${className}`}>
    {children}
  </article>
);

const Toggle = ({ label, description, checked, onChange, disabled }) => (
  <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-black/20 hover:bg-black/30 transition-colors">
    <div>
      <p className="font-semibold text-white">{label}</p>
      <p className="text-xs text-slate-400 mt-1">{description}</p>
    </div>
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]" : "bg-slate-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

function SettingsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitMsg, setSubmitMsg] = useState(null);

  const [requests, setRequests] = useState([]);
  const [myAccess, setMyAccess] = useState(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePerms, setInvitePerms] = useState({ cycle: true, mood: true, hydration: true });

  const showMsg = (msg) => {
    setSubmitMsg(msg);
    setTimeout(() => setSubmitMsg(null), 3000);
  };

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const headers = getHeaders();
      const [reqRes, accRes] = await Promise.all([
        fetch(`${API_BASE}/partner/requests/incoming`, { headers }),
        fetch(`${API_BASE}/partner/my-access`, { headers })
      ]);

      if (reqRes.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const reqJson = await reqRes.json();
      const accJson = await accRes.json();

      setRequests(reqJson.data || []);
      setMyAccess(accJson.data || null);

    } catch (err) {
      if (err.message === "No token") navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [navigate]);

  const handleRespondRequest = async (requestId, action) => {
    try {
      const res = await fetch(`${API_BASE}/partner/request/${requestId}/respond`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        showMsg(`Partner request ${action}ed!`);
        fetchSettings(); // refresh to show the new connection
      }
    } catch (err) {
      showMsg("Failed to respond to request.");
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      const res = await fetch(`${API_BASE}/partner/request`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          partnerEmail: inviteEmail,
          permissions: invitePerms
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      showMsg("Invite sent successfully!");
      setInviteEmail("");
    } catch (err) {
      showMsg(err.message || "Error sending invite.");
    }
  };

  const handleUpdatePermissions = async (updatedPerms) => {
    if (!myAccess) return;
    try {
      // Optimistic UI update
      setMyAccess(prev => ({ ...prev, permissions: updatedPerms }));
      const res = await fetch(`${API_BASE}/partner/permissions`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          partnerId: myAccess.partnerId._id,
          permissions: updatedPerms
        })
      });
      if (res.ok) {
        showMsg("Permissions updated.");
      }
    } catch (err) {
      showMsg("Failed to update permissions");
      fetchSettings(); // rollback
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to completely remove this partner connection?")) return;
    try {
      const res = await fetch(`${API_BASE}/partner/disconnect`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (res.ok) {
        showMsg("Partner connection removed.");
        setMyAccess(null);
      } else {
        const err = await res.json();
        showMsg(err.message || "Failed to disconnect.");
      }
    } catch (err) {
      showMsg("Failed to disconnect partner.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-fuchsia-500/30 border-t-fuchsia-500" />
      </div>
    );
  }

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 relative max-w-4xl mx-auto">
      {submitMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-violet-600 px-6 py-3 text-white shadow-xl shadow-fuchsia-500/30 border border-fuchsia-400/50 flex items-center gap-2 animate-in slide-in-from-right-4">
          <span className="h-2 w-2 rounded-full bg-white opacity-80" />
          {submitMsg}
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-slate-900/40 to-fuchsia-900/20 p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-fuchsia-600/20 blur-[80px]"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
            Privacy & Settings
          </h2>
          <p className="mt-2 text-slate-400">
            Control exactly what your partner is allowed to see.
          </p>
        </div>
      </div>

      {requests.length > 0 && (
        <Card className="border-cyan-500/30 shadow-[0_10px_30px_rgba(6,182,212,0.1)]">
          <h3 className="mb-4 text-xl font-semibold text-white">Incoming Requests</h3>
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req._id} className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border border-white/10 bg-black/30">
                <div className="mb-4 md:mb-0">
                  <p className="font-bold text-lg text-white">{req.fromUserId.name}</p>
                  <p className="text-sm text-cyan-400">{req.fromUserId.email}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleRespondRequest(req._id, "reject")} className="px-5 py-2 rounded-lg font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition">
                    Reject
                  </button>
                  <button onClick={() => handleRespondRequest(req._id, "accept")} className="px-5 py-2 rounded-lg font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:scale-105 transition">
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {myAccess ? (
        <Card className="border-fuchsia-500/20">
          <div className="flex flex-col md:flex-row justify-between md:items-start mb-6">
            <div>
              <h3 className="mb-2 text-xl font-semibold text-white flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                Active Connection
              </h3>
              <p className="text-slate-400 text-sm">
                You are sharing data with <strong className="text-fuchsia-300">{myAccess.partnerId.email}</strong>.
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              className="mt-4 md:mt-0 px-4 py-2 rounded-lg text-sm font-semibold text-rose-400 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all shadow-sm shadow-rose-500/20"
            >
              Remove Connection
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Toggle 
              label="Share Cycle Logs" 
              description="Allow partner to view your period lengths and symptoms." 
              checked={myAccess.permissions.cycle}
              onChange={(val) => handleUpdatePermissions({ ...myAccess.permissions, cycle: val })}
            />
            <Toggle 
              label="Share Mood Logs" 
              description="Allow partner to view your mood trends and notes." 
              checked={myAccess.permissions.mood}
              onChange={(val) => handleUpdatePermissions({ ...myAccess.permissions, mood: val })}
            />
            <Toggle 
              label="Share Hydration" 
              description="Allow partner to monitor your water intake." 
              checked={myAccess.permissions.hydration}
              onChange={(val) => handleUpdatePermissions({ ...myAccess.permissions, hydration: val })}
            />
            <Toggle 
              label="Share Predictions" 
              description="Allow partner to see ovulation window and mood tips." 
              checked={myAccess.permissions.predictions}
              onChange={(val) => handleUpdatePermissions({ ...myAccess.permissions, predictions: val })}
            />
          </div>
        </Card>
      ) : (
        <Card className="border-white/10">
          <h3 className="mb-2 text-xl font-semibold text-white text-center">Connect a Partner</h3>
          <p className="text-slate-400 mb-6 text-sm text-center">
            Link your accounts to display your insights securely on their dashboard.
          </p>
          
          <form onSubmit={handleSendInvite} className="max-w-md mx-auto space-y-6">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">Partner Email</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:border-fuchsia-500/50 focus:bg-black/40 focus:ring-2 focus:ring-fuchsia-500/20"
                placeholder="partner@example.com"
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Initial Permissions</p>
              <div className="grid grid-cols-3 gap-2">
                {['cycle', 'mood', 'hydration'].map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setInvitePerms(p => ({ ...p, [key]: !p[key] }))}
                    className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                       invitePerms[key] ? 'bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-300' : 'bg-white/5 border border-transparent text-slate-500'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-[1.02] transition-transform">
              Send Secure Request
            </button>
          </form>
        </Card>
      )}

    </section>
  );
}

export default SettingsPage;
