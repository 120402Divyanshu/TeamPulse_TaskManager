import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

const statusLabels = {
  todo: "To do",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
};

function StatCard({ title, value, hint }) {
  return (
    <div className="glass rounded-2xl p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-white">{value}</p>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: d } = await api.get("/api/dashboard");
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || "Failed to load dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-300">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  const { summary, overdue, recentActivity } = data;
  const totalTasks = Object.values(summary.tasksByStatus).reduce((a, b) => a + b, 0);

  return (
    <div className="animate-fade-in space-y-10">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-slate-500">
          Overview of your projects, workload, and deadlines.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Projects" value={summary.totalProjects} />
        <StatCard title="Total tasks" value={totalTasks} />
        <StatCard
          title="Overdue"
          value={summary.overdueCount}
          hint="Open tasks past due date"
        />
        <StatCard title="Completed" value={summary.tasksByStatus.done} hint="Marked done" />
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-semibold text-white">Tasks by status</h2>
          <div className="mt-6 space-y-4">
            {Object.entries(summary.tasksByStatus).map(([key, count]) => (
              <div key={key} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{statusLabels[key]}</span>
                    <span className="font-medium text-white">{count}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-850">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent-dim to-accent transition-all"
                      style={{
                        width: `${totalTasks ? Math.max(8, (count / totalTasks) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Overdue</h2>
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-medium text-red-300">
              {overdue.length} items
            </span>
          </div>
          <ul className="mt-6 space-y-3">
            {overdue.length === 0 && (
              <li className="rounded-xl border border-white/5 bg-surface-850/40 px-4 py-8 text-center text-sm text-slate-500">
                Nothing overdue — nice work.
              </li>
            )}
            {overdue.map((t) => (
              <li
                key={t.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-surface-850/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-100">{t.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t.project?.name}
                    {t.assignedTo?.name ? ` · ${t.assignedTo.name}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium text-red-300">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "—"}
                  </p>
                  {t.project && (
                    <Link
                      to={`/projects/${t.project.id}`}
                      className="mt-1 block text-xs text-accent hover:text-accent-glow"
                    >
                      Open
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="glass rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold text-white">Recent activity</h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 font-medium">Task</th>
                <th className="pb-3 font-medium">Project</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Assignee</th>
                <th className="pb-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentActivity.map((t) => (
                <tr key={t.id} className="text-slate-300">
                  <td className="py-3 font-medium text-white">
                    <Link
                      to={t.project ? `/projects/${t.project.id}` : "#"}
                      className="hover:text-accent"
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td className="py-3">{t.project?.name ?? "—"}</td>
                  <td className="py-3">
                    <span className="rounded-lg bg-white/5 px-2 py-1 text-xs">
                      {statusLabels[t.status]}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">{t.assignedTo?.name ?? "—"}</td>
                  <td className="py-3 text-slate-500">
                    {new Date(t.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {recentActivity.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No tasks yet.{" "}
                    <Link to="/projects" className="text-accent hover:underline">
                      Create a project
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
