import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setError("");
    try {
      const { data } = await api.get("/api/projects");
      setProjects(data.projects);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createProject(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/api/projects", { name, description });
      setModal(false);
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white">
            Projects
          </h1>
          <p className="mt-1 text-slate-500">Spaces for your team and tasks.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModal(true)}>
          New project
        </button>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="glass group rounded-2xl p-6 transition hover:border-accent/20 hover:shadow-glow"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-white group-hover:text-accent-glow">
                  {p.name}
                </h2>
                <span
                  className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium ${
                    p.role === "admin"
                      ? "bg-accent/15 text-accent-glow"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  {p.role}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                {p.description || "No description"}
              </p>
              <p className="mt-4 text-xs text-slate-600">
                {p.memberCount} members · Updated {new Date(p.updatedAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
          {projects.length === 0 && (
            <div className="glass col-span-full rounded-2xl py-16 text-center text-slate-500">
              No projects yet. Create one to get started.
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className="glass max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-8"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="font-display text-xl font-semibold text-white">New project</h2>
            <form onSubmit={createProject} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Name
                </label>
                <input
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Description
                </label>
                <textarea
                  className="input-field min-h-[100px] resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
