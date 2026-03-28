import { BriefcaseBusiness, Gauge, History, LogOut, Settings } from "lucide-react";

const links = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "resume", label: "Resume AI", icon: BriefcaseBusiness },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ activeView, onChangeView, username, onLogout }) {
  return (
    <aside className="w-full md:w-64 rounded-2xl border border-white/10 bg-panel/80 backdrop-blur-xl shadow-glass p-5 flex flex-col">
      <h1 className="text-xl font-semibold tracking-wide mb-6">EthicalGuard AI</h1>
      <div className="mb-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Logged in</p>
        <p className="mt-2 font-medium">{username}</p>
      </div>
      <nav className="space-y-2 flex-1">
        {links.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              className={`w-full text-left px-3 py-3 rounded-lg transition flex items-center gap-3 border ${
                isActive
                  ? "bg-electric/15 border-electric/40 text-white"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
              type="button"
              onClick={() => onChangeView(item.id)}
            >
              <Icon size={18} className="text-electric" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={onLogout}
        className="mt-4 w-full text-left px-3 py-3 rounded-lg transition flex items-center gap-3 border bg-white/5 border-white/5 hover:bg-white/10"
      >
        <LogOut size={18} className="text-electric" />
        <span>Logout</span>
      </button>
    </aside>
  );
}
