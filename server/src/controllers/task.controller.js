import { validationResult } from "express-validator";
import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";

/** Works for ObjectId or populated { _id, name, email } from .lean() */
function memberUserId(m) {
  const u = m?.user;
  if (u == null) return null;
  const id = u._id ?? u;
  return id.toString();
}

function isProjectMember(project, userId) {
  if (!userId) return false;
  return project.members.some((m) => memberUserId(m) === userId);
}

export async function listTasks(req, res, next) {
  try {
    const { status, overdue } = req.query;
    const filter = { project: req.project._id };
    if (status) filter.status = status;
    if (overdue === "true") {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: "done" };
    }
    const tasks = await Task.find(filter)
      .sort({ dueDate: 1, createdAt: -1 })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .lean();
    res.json({
      tasks: tasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        assignedTo: t.assignedTo,
        createdBy: t.createdBy,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (e) {
    next(e);
  }
}

export async function createTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { title, description, status, priority, dueDate, assignedTo } = req.body;
    if (assignedTo && !isProjectMember(req.project, assignedTo)) {
      return res.status(400).json({ message: "Assignee must be a project member" });
    }
    const task = await Task.create({
      title,
      description: description || "",
      project: req.project._id,
      status: status || "todo",
      priority: priority || "medium",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedTo: assignedTo || null,
      createdBy: req.user.id,
    });
    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .lean();
    res.status(201).json({
      task: {
        id: populated._id.toString(),
        title: populated.title,
        description: populated.description,
        status: populated.status,
        priority: populated.priority,
        dueDate: populated.dueDate,
        assignedTo: populated.assignedTo,
        createdBy: populated.createdBy,
        createdAt: populated.createdAt,
        updatedAt: populated.updatedAt,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function updateTask(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const task = await Task.findById(req.params.taskId);
    if (!task || task.project.toString() !== req.project._id.toString()) {
      return res.status(404).json({ message: "Task not found" });
    }
    const isAdmin = req.membership.role === "admin";
    const isAssignee =
      task.assignedTo && task.assignedTo.toString() === req.user.id;
    const isCreator = task.createdBy.toString() === req.user.id;
    if (!isAdmin && !isAssignee && !isCreator) {
      return res
        .status(403)
        .json({ message: "Only admins, assignee, or creator can update this task" });
    }
    const { title, description, status, priority, dueDate, assignedTo } = req.body;
    if (assignedTo !== undefined && assignedTo && !isProjectMember(req.project, assignedTo)) {
      return res.status(400).json({ message: "Assignee must be a project member" });
    }
    if (!isAdmin && assignedTo !== undefined && task.assignedTo?.toString() !== assignedTo) {
      return res.status(403).json({ message: "Only admins can reassign tasks" });
    }
    Object.assign(task, {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(assignedTo !== undefined && { assignedTo: assignedTo || null }),
    });
    await task.save();
    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .lean();
    res.json({
      task: {
        id: populated._id.toString(),
        title: populated.title,
        description: populated.description,
        status: populated.status,
        priority: populated.priority,
        dueDate: populated.dueDate,
        assignedTo: populated.assignedTo,
        createdBy: populated.createdBy,
        createdAt: populated.createdAt,
        updatedAt: populated.updatedAt,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task || task.project.toString() !== req.project._id.toString()) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (req.membership.role !== "admin") {
      return res.status(403).json({ message: "Only project admins can delete tasks" });
    }
    await Task.findByIdAndDelete(task._id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

/** Resolve project from task id for PATCH/DELETE without projectId in URL */
export async function loadProjectFromTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.taskId).lean();
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const project = await Project.findById(task.project)
      .populate("members.user", "name email")
      .lean();
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const membership = project.members.find(
      (m) => memberUserId(m) === req.user.id
    );
    if (!membership) {
      return res.status(403).json({ message: "Not a member of this project" });
    }
    req.project = project;
    req.membership = { role: membership.role, userId: req.user.id };
    next();
  } catch (e) {
    next(e);
  }
}
