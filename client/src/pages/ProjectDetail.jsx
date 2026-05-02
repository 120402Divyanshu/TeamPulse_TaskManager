import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext.jsx";

const STATUSES = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

const PRIORITIES = ["low", "medium", "high", "urgent"];

function priorityClass(p) {
  if (p === "urgent") return "text-red-300 bg-red-500/15";
  if (p === "high") return "text-amber-300 bg-amber-500/15";
  if (p === "medium") return "text-cyan-300 bg-cyan-500/10";
  return "text-slate-400 bg-white/5";
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [taskModal, setTaskModal] = useState(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");

  const loadAll = useCallback(async () => {
    setError("");
    try {
      const [pRes, tRes] = await Promise.all([
        api.get(`/api/projects/${id}`),
        api.get(`/api/projects/${id}/tasks`),
      ]);
      setProject(pRes.data.project);
      setTasks(tRes.data.tasks);
      setProjName(pRes.data.project.name);
      setProjDesc(pRes.data.project.description || "");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    loadAll();
  }, [loadAll]);

  const isAdmin = project?.role === "admin";

  const tasksByStatus = useMemo(() => {
    const map = Object.fromEntries(STATUSES.map((s) => [s.key, []]));
    tasks.forEach((t) => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [tasks]);

  async function patchTask(taskId, payload) {
    const { data } = await api.patch(`/api/tasks/${taskId}`, payload);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
  }

  async function deleteTask(taskId) {
    if (!confirm("Delete this task?")) return;
    await api.delete(`/api/tasks/${taskId}`);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  async function saveProject(e) {
    e.preventDefault();
    await api.patch(`/api/projects/${id}`, { name: projName, description: projDesc });
    setEditProjectOpen(false);
    await loadAll();
  }

  async function addMember(e) {
    e.preventDefault();
    await api.post(`/api/projects/${id}/members`, {
      email: memberEmail,
      role: memberRole,
    });
    setMemberEmail("");
    setMemberRole("member");
    await loadAll();
  }

  async function changeRole(userId, role) {
    await api.patch(`/api/projects/${id}/members/${userId}`, { role });
    await loadAll();
  }

  async function removeMember(userId) {
    if (!confirm("Remove this member?")) return;
    await api.delete(`/api/projects/${id}/members/${userId}`);
    await loadAll();
  }

  async function leave() {
    if (!confirm("Leave this project?")) return;
    await api.post(`/api/projects/${id}/leave`);
    window.location.href = "/projects";
  }

  async function deleteProject() {
    if (!confirm("Delete project and all tasks? This cannot be undone.")) return;
    await api.delete(`/api/projects/${id}`);
    window.location.href = "/projects";
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-300">
        {error || "Not found"}{" "}
        <Link to="/projects" className="text-accent underline">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-10 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <Link to="/projects" className="text-sm text-accent hover:text-accent-glow">
            ← Projects
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white">
            {project.name}
          </h1>
          <p className="mt-2 max-w-2xl text-slate-400">{project.description || "—"}</p>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-600">
            You are <span className="text-accent-glow">{project.role}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => setTaskModal({})}>
            Add task
          </button>
          {isAdmin && (
            <button type="button" className="btn-ghost" onClick={() => setEditProjectOpen(true)}>
              Edit project
            </button>
          )}
          <button type="button" className="btn-ghost text-slate-400" onClick={leave}>
            Leave
          </button>
          {isAdmin && (
            <button
              type="button"
              className="rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
              onClick={deleteProject}
            >
              Delete project
            </button>
          )}
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-white">Board</h2>
          <div className="grid gap-4 lg:grid-cols-4">
            {STATUSES.map((col) => (
              <div key={col.key} className="glass flex flex-col rounded-2xl border border-white/5">
                <div className="border-b border-white/5 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {col.label}
                  </p>
                  <p className="text-lg font-semibold text-white">{tasksByStatus[col.key].length}</p>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-3">
                  {tasksByStatus[col.key].map((t) => (
                    <article
                      key={t.id}
                      className="rounded-xl border border-white/5 bg-surface-850/60 p-4 shadow-inner"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-slate-100">{t.title}</h3>
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityClass(t.priority)}`}
                        >
                          {t.priority}
                        </span>
                      </div>
                      {t.description && (
                        <p className="mt-2 line-clamp-3 text-xs text-slate-500">{t.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {t.dueDate && (
                          <span
                            className={
                              new Date(t.dueDate) < new Date() && t.status !== "done"
                                ? "text-red-300"
                                : ""
                            }
                          >
                            Due {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {t.assignedTo && <span>→ {t.assignedTo.name}</span>}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <select
                          className="input-field max-w-[140px] py-1.5 text-xs"
                          value={t.status}
                          onChange={(e) => patchTask(t.id, { status: e.target.value })}
                        >
                          {STATUSES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn-ghost py-1.5 text-xs"
                          onClick={() => setTaskModal(t)}
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            className="rounded-lg px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                            onClick={() => deleteTask(t.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-semibold text-white">Team</h2>
            <ul className="mt-4 space-y-3">
              {project.members.map((m) => (
                <li
                  key={m.userId}
                  className="flex flex-col gap-2 rounded-xl border border-white/5 bg-surface-850/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-100">{m.name}</p>
                    <p className="truncate text-xs text-slate-500">{m.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isAdmin && m.userId !== user?.id ? (
                      <>
                        <select
                          className="input-field max-w-[110px] py-1 text-xs"
                          value={m.role}
                          onChange={(e) => changeRole(m.userId, e.target.value)}
                        >
                          <option value="member">member</option>
                          <option value="admin">admin</option>
                        </select>
                        <button
                          type="button"
                          className="text-xs text-red-400 hover:underline"
                          onClick={() => removeMember(m.userId)}
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <span className="rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-400">
                        {m.role}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {isAdmin && (
              <form onSubmit={addMember} className="mt-6 space-y-3 border-t border-white/5 pt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Invite by email
                </p>
                <input
                  className="input-field text-sm"
                  type="email"
                  placeholder="colleague@company.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  required
                />
                <select
                  className="input-field text-sm"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn-primary w-full text-sm">
                  Add member
                </button>
              </form>
            )}
          </div>
        </aside>
      </section>

      {taskModal && (
        <TaskModal
          projectId={id}
          members={project.members}
          initial={taskModal.id ? taskModal : null}
          isAdmin={isAdmin}
          onClose={() => setTaskModal(null)}
          onSaved={(task, isNew) => {
            if (isNew) setTasks((p) => [...p, task]);
            else setTasks((p) => p.map((x) => (x.id === task.id ? task : x)));
            setTaskModal(null);
          }}
        />
      )}

      {editProjectOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={saveProject}
            className="glass w-full max-w-lg rounded-2xl p-8"
            role="dialog"
          >
            <h2 className="font-display text-xl font-semibold text-white">Edit project</h2>
            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Name</label>
                <input
                  className="input-field"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Description
                </label>
                <textarea
                  className="input-field min-h-[100px]"
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setEditProjectOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function TaskModal({ projectId, members, initial, isAdmin, onClose, onSaved }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [status, setStatus] = useState(initial?.status || "todo");
  const [priority, setPriority] = useState(initial?.priority || "medium");
  const [dueDate, setDueDate] = useState(
    initial?.dueDate ? initial.dueDate.slice(0, 10) : ""
  );
  const [assignedTo, setAssignedTo] = useState(initial?.assignedTo?.id || "");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title,
        description,
        status,
        priority,
        dueDate: dueDate || null,
        assignedTo: assignedTo || null,
      };
      if (initial?.id) {
        const { data } = await api.patch(`/api/tasks/${initial.id}`, payload);
        onSaved(data.task, false);
      } else {
        const { data } = await api.post(`/api/projects/${projectId}/tasks`, payload);
        onSaved(data.task, true);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Could not save task");
    } finally {
      setSaving(false);
    }
  }

  const canReassign = isAdmin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="glass max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-8"
      >
        <h2 className="font-display text-xl font-semibold text-white">
          {initial ? "Edit task" : "New task"}
        </h2>
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">Title</label>
            <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">Description</label>
            <textarea
              className="input-field min-h-[88px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Status</label>
              <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-500">Priority</label>
              <select
                className="input-field"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">Due date</label>
            <input
              className="input-field"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-slate-500">Assignee</label>
            <select
              className="input-field"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={!canReassign && !!initial}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name}
                </option>
              ))}
            </select>
            {!canReassign && (
              <p className="mt-1 text-xs text-slate-600">
                Only project admins can reassign tasks. You can still edit other fields if you are
                assignee or creator.
              </p>
            )}
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
