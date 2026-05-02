import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const nav = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/projects", label: "Projects" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <aside className="glass fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/5">
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-dim to-accent shadow-glow">
            <span className="font-display text-lg font-bold text-surface-950">P</span>
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-white">TeamPulse</p>
            <p className="text-xs text-slate-500">Ship work together</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "rounded-xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-accent/15 text-accent-glow shadow-inner"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/5 p-4">
          <div className="mb-3 rounded-xl bg-surface-850/50 px-3 py-2">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            className="btn-ghost w-full justify-center text-slate-400"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="relative flex-1 pl-64">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 top-32 h-72 w-72 rounded-full bg-accent/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
