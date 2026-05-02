/**
 * Integration smoke test — starts nothing; expects API at API_URL (default http://127.0.0.1:5055).
 * Run: set PORT=5055 && node src/index.js (other terminal) && node scripts/smoke-api.mjs
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const BASE = process.env.API_URL || "http://127.0.0.1:5055";
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const emailA = `smoke-a-${suffix}@example.test`;
const emailB = `smoke-b-${suffix}@example.test`;
const password = "SmokeTest123!";

let failures = 0;
function ok(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failures++;
  } else {
    console.log("OK:", msg);
  }
}

async function req(method, pathname, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json, raw: text };
}

async function main() {
  console.log("Smoke test →", BASE);

  let r = await req("POST", "/api/auth/register", {
    body: { name: "Smoke A", email: emailA, password },
  });
  ok(r.status === 201 && r.json?.token, `register A (${r.status})`);
  const tokenA = r.json?.token;
  const userIdA = r.json?.user?.id;

  r = await req("GET", "/api/auth/me", { token: tokenA });
  ok(r.status === 200 && r.json?.user?.email === emailA, `GET /api/auth/me (${r.status})`);

  r = await req("POST", "/api/auth/login", {
    body: { email: emailA, password },
  });
  ok(r.status === 200 && r.json?.token, `login A (${r.status})`);

  r = await req("POST", "/api/projects", {
    token: tokenA,
    body: { name: `Project ${suffix}`, description: "smoke" },
  });
  ok(r.status === 201 && r.json?.project?.id, `create project (${r.status})`);
  const projectId = r.json.project.id;

  r = await req("GET", "/api/projects", { token: tokenA });
  ok(
    r.status === 200 && Array.isArray(r.json?.projects) && r.json.projects.some((p) => p.id === projectId),
    `list projects (${r.status})`
  );

  r = await req("GET", `/api/projects/${projectId}`, { token: tokenA });
  ok(
    r.status === 200 && r.json?.project?.members?.some((m) => m.userId === userIdA && m.role === "admin"),
    `get project (${r.status})`
  );

  r = await req("POST", "/api/auth/register", {
    body: { name: "Smoke B", email: emailB, password },
  });
  ok(r.status === 201, `register B (${r.status})`);
  const tokenB = r.json.token;
  const userIdB = r.json.user.id;

  r = await req("POST", `/api/projects/${projectId}/members`, {
    token: tokenA,
    body: { email: emailB, role: "member" },
  });
  ok(r.status === 201, `add member B (${r.status})`);

  r = await req("GET", `/api/projects/${projectId}`, { token: tokenB });
  ok(r.status === 200 && r.json?.project?.role === "member", `B sees project as member (${r.status})`);

  r = await req("POST", `/api/projects/${projectId}/tasks`, {
    token: tokenA,
    body: {
      title: "Task one",
      description: "desc",
      status: "todo",
      priority: "high",
      assignedTo: userIdB,
    },
  });
  if (r.status !== 201) console.error("create task body:", r.json);
  ok(r.status === 201 && r.json?.task?.id, `create task (${r.status})`);
  const taskId = r.json?.task?.id;
  if (!taskId) {
    console.error("Abort: no task id");
    process.exit(1);
  }

  r = await req("GET", `/api/projects/${projectId}/tasks`, { token: tokenB });
  ok(r.status === 200 && r.json?.tasks?.some((t) => t.id === taskId), `list tasks (${r.status})`);

  r = await req("PATCH", `/api/tasks/${taskId}`, {
    token: tokenB,
    body: { status: "in_progress" },
  });
  ok(r.status === 200 && r.json?.task?.status === "in_progress", `B updates status (${r.status})`);

  r = await req("PATCH", `/api/tasks/${taskId}`, {
    token: tokenB,
    body: { assignedTo: userIdA },
  });
  ok(r.status === 403, `B cannot reassign task (${r.status})`);

  r = await req("PATCH", `/api/tasks/${taskId}`, {
    token: tokenA,
    body: { assignedTo: userIdA },
  });
  ok(r.status === 200, `admin reassigns task (${r.status})`);

  r = await req("GET", "/api/dashboard", { token: tokenA });
  ok(
    r.status === 200 && r.json?.summary?.tasksByStatus && typeof r.json.summary.totalProjects === "number",
    `dashboard (${r.status})`
  );

  r = await req("DELETE", `/api/tasks/${taskId}`, { token: tokenB });
  ok(r.status === 403, `B cannot delete task (${r.status})`);

  r = await req("DELETE", `/api/tasks/${taskId}`, { token: tokenA });
  ok(r.status === 204, `admin deletes task (${r.status})`);

  r = await req("POST", `/api/projects/${projectId}/tasks`, {
    token: tokenA,
    body: { title: "Task two", status: "todo" },
  });
  ok(r.status === 201, `create task 2 (${r.status})`);
  const taskId2 = r.json.task.id;

  r = await req("PATCH", `/api/projects/${projectId}`, {
    token: tokenB,
    body: { name: "hacked" },
  });
  ok(r.status === 403, `member cannot PATCH project (${r.status})`);

  r = await req("PATCH", `/api/projects/${projectId}`, {
    token: tokenA,
    body: { name: `Project ${suffix} updated`, description: "patched" },
  });
  ok(r.status === 200, `admin PATCH project (${r.status})`);

  r = await req("POST", `/api/projects/${projectId}/leave`, { token: tokenB });
  ok(r.status === 204, `B leaves project (${r.status})`);

  r = await req("GET", `/api/projects/${projectId}`, { token: tokenA });
  ok(
    r.status === 200 && !r.json?.project?.members?.some((m) => m.userId === userIdB),
    `B removed from members (${r.status})`
  );

  r = await req("DELETE", `/api/projects/${projectId}`, { token: tokenA });
  ok(r.status === 204, `delete project (${r.status})`);

  r = await req("GET", `/api/projects/${projectId}`, { token: tokenA });
  ok(r.status === 404, `project gone (${r.status})`);

  // SPA fallback (only if client/dist exists)
  r = await req("GET", "/", {});
  ok(r.status === 200 && String(r.raw).includes("root"), `GET / SPA shell (${r.status})`);

  console.log(failures === 0 ? "\nAll smoke checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
