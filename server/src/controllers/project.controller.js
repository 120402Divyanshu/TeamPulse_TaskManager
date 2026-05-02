import { validationResult } from "express-validator";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";

export async function listMyProjects(req, res, next) {
  try {
    const projects = await Project.find({ "members.user": req.user.id })
      .sort({ updatedAt: -1 })
      .populate("createdBy", "name email")
      .lean();
    const shaped = projects.map((p) => {
      const m = p.members.find((x) => x.user.toString() === req.user.id);
      return {
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        role: m?.role,
        memberCount: p.members.length,
        updatedAt: p.updatedAt,
        createdBy: p.createdBy,
      };
    });
    res.json({ projects: shaped });
  } catch (e) {
    next(e);
  }
}

export async function createProject(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, description } = req.body;
    const project = await Project.create({
      name,
      description: description || "",
      createdBy: req.user.id,
      members: [{ user: req.user.id, role: "admin" }],
    });
    const populated = await Project.findById(project._id)
      .populate("createdBy", "name email")
      .lean();
    res.status(201).json({
      project: {
        id: populated._id.toString(),
        name: populated.name,
        description: populated.description,
        role: "admin",
        memberCount: populated.members.length,
        createdBy: populated.createdBy,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function getProject(req, res) {
  const p = req.project;
  res.json({
    project: {
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      role: req.membership.role,
      members: p.members.map((m) => ({
        userId: m.user._id.toString(),
        name: m.user.name,
        email: m.user.email,
        role: m.role,
      })),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    },
  });
}

export async function updateProject(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, description } = req.body;
    const doc = await Project.findByIdAndUpdate(
      req.project._id,
      {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
      { new: true, runValidators: true }
    ).lean();
    res.json({
      project: {
        id: doc._id.toString(),
        name: doc.name,
        description: doc.description,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function deleteProject(req, res, next) {
  try {
    await Project.findByIdAndDelete(req.project._id);
    const { Task } = await import("../models/Task.js");
    await Task.deleteMany({ project: req.project._id });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function addMember(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, role } = req.body;
    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      return res.status(404).json({ message: "No user with that email" });
    }
    const exists = req.project.members.some(
      (m) => m.user._id.toString() === userToAdd._id.toString()
    );
    if (exists) {
      return res.status(409).json({ message: "User is already a member" });
    }
    await Project.findByIdAndUpdate(req.project._id, {
      $push: {
        members: {
          user: userToAdd._id,
          role: role === "admin" ? "admin" : "member",
        },
      },
    });
    res.status(201).json({
      member: {
        userId: userToAdd._id.toString(),
        name: userToAdd.name,
        email: userToAdd.email,
        role: role === "admin" ? "admin" : "member",
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function updateMemberRole(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { userId } = req.params;
    const { role } = req.body;
    if (userId === req.user.id) {
      return res.status(400).json({ message: "Cannot change your own role here" });
    }
    const project = await Project.findById(req.project._id);
    const admins = project.members.filter((m) => m.role === "admin");
    const target = project.members.find((m) => m.user.toString() === userId);
    if (!target) {
      return res.status(404).json({ message: "Member not found" });
    }
    if (target.role === "admin" && role === "member" && admins.length <= 1) {
      return res.status(400).json({ message: "Project must keep at least one admin" });
    }
    target.role = role;
    await project.save();
    res.json({ member: { userId, role } });
  } catch (e) {
    next(e);
  }
}

export async function removeMember(req, res, next) {
  try {
    const { userId } = req.params;
    const project = await Project.findById(req.project._id);
    const idx = project.members.findIndex((m) => m.user.toString() === userId);
    if (idx === -1) {
      return res.status(404).json({ message: "Member not found" });
    }
    const removed = project.members[idx];
    if (removed.role === "admin") {
      const adminCount = project.members.filter((m) => m.role === "admin").length;
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot remove the last admin" });
      }
    }
    project.members.splice(idx, 1);
    if (project.members.length === 0) {
      return res.status(400).json({ message: "Cannot remove all members" });
    }
    await project.save();
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function leaveProject(req, res, next) {
  try {
    const project = await Project.findById(req.project._id);
    const idx = project.members.findIndex((m) => m.user.toString() === req.user.id);
    if (idx === -1) return res.status(404).json({ message: "Not a member" });
    const self = project.members[idx];
    if (self.role === "admin") {
      const adminCount = project.members.filter((m) => m.role === "admin").length;
      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "Assign another admin before leaving, or delete the project" });
      }
    }
    project.members.splice(idx, 1);
    await project.save();
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
