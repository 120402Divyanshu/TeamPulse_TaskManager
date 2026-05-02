import { Router } from "express";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  loadProjectFromTask,
} from "../controllers/task.controller.js";
import { requireAuth } from "../middleware/auth.js";
import {
  loadProjectMembership,
} from "../middleware/project.js";
import { createTaskRules, updateTaskRules, taskIdParam } from "../validators/task.validators.js";

const r = Router();

r.use(requireAuth);

r.get(
  "/projects/:projectId/tasks",
  loadProjectMembership,
  listTasks
);
r.post(
  "/projects/:projectId/tasks",
  loadProjectMembership,
  createTaskRules,
  createTask
);

r.patch(
  "/tasks/:taskId",
  taskIdParam,
  loadProjectFromTask,
  updateTaskRules,
  updateTask
);
r.delete(
  "/tasks/:taskId",
  taskIdParam,
  loadProjectFromTask,
  deleteTask
);

export default r;
