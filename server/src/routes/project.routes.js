import { Router } from "express";
import {
  listMyProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  updateMemberRole,
  removeMember,
  leaveProject,
} from "../controllers/project.controller.js";
import { requireAuth } from "../middleware/auth.js";
import {
  loadProjectMembership,
  requireProjectRole,
} from "../middleware/project.js";
import {
  createProjectRules,
  updateProjectRules,
  addMemberRules,
  updateMemberRoleRules,
} from "../validators/project.validators.js";

const r = Router();

r.use(requireAuth);

r.get("/", listMyProjects);
r.post("/", createProjectRules, createProject);

r.get("/:id", loadProjectMembership, getProject);
r.patch(
  "/:id",
  loadProjectMembership,
  requireProjectRole("admin"),
  updateProjectRules,
  updateProject
);
r.delete(
  "/:id",
  loadProjectMembership,
  requireProjectRole("admin"),
  deleteProject
);

r.post(
  "/:id/members",
  loadProjectMembership,
  requireProjectRole("admin"),
  addMemberRules,
  addMember
);
r.patch(
  "/:id/members/:userId",
  loadProjectMembership,
  requireProjectRole("admin"),
  updateMemberRoleRules,
  updateMemberRole
);
r.delete(
  "/:id/members/:userId",
  loadProjectMembership,
  requireProjectRole("admin"),
  removeMember
);
r.post("/:id/leave", loadProjectMembership, leaveProject);

export default r;
