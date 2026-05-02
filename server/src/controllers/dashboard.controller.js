import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";

export async function dashboard(req, res, next) {
  try {
    const userId = req.user.id;
    const projects = await Project.find({ "members.user": userId }).select("_id").lean();
    const projectIds = projects.map((p) => p._id);

    const [byStatus, overdueTasks, recentTasks] = await Promise.all([
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Task.find({
        project: { $in: projectIds },
        dueDate: { $lt: new Date() },
        status: { $ne: "done" },
      })
        .sort({ dueDate: 1 })
        .limit(15)
        .populate("project", "name")
        .populate("assignedTo", "name")
        .lean(),
      Task.find({ project: { $in: projectIds } })
        .sort({ updatedAt: -1 })
        .limit(10)
        .populate("project", "name")
        .populate("assignedTo", "name email")
        .lean(),
    ]);

    const statusCounts = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };
    byStatus.forEach((row) => {
      if (row._id && statusCounts[row._id] !== undefined) {
        statusCounts[row._id] = row.count;
      }
    });

    res.json({
      summary: {
        totalProjects: projectIds.length,
        tasksByStatus: statusCounts,
        overdueCount: overdueTasks.length,
      },
      overdue: overdueTasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        dueDate: t.dueDate,
        status: t.status,
        project: t.project ? { id: t.project._id.toString(), name: t.project.name } : null,
        assignedTo: t.assignedTo,
      })),
      recentActivity: recentTasks.map((t) => ({
        id: t._id.toString(),
        title: t.title,
        status: t.status,
        project: t.project ? { id: t.project._id.toString(), name: t.project.name } : null,
        assignedTo: t.assignedTo,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (e) {
    next(e);
  }
}
