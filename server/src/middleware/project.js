import { Project } from "../models/Project.js";

function roleRank(role) {
  return role === "admin" ? 2 : 1;
}

export async function loadProjectMembership(req, res, next) {
  try {
    const projectId = req.params.projectId || req.params.id;
    if (!projectId) {
      return res.status(400).json({ message: "projectId required" });
    }
    const project = await Project.findById(projectId)
      .populate("members.user", "name email")
      .lean();
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const membership = project.members.find((m) => {
      const u = m.user;
      const id = u && typeof u === "object" && u._id != null ? u._id : u;
      return id && id.toString() === req.user.id;
    });
    if (!membership) {
      return res.status(403).json({ message: "Not a member of this project" });
    }
    req.project = project;
    req.membership = {
      role: membership.role,
      userId: req.user.id,
    };
    next();
  } catch (e) {
    next(e);
  }
}

export function requireProjectRole(minRole) {
  return (req, res, next) => {
    const need = roleRank(minRole);
    const have = roleRank(req.membership.role);
    if (have < need) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}
