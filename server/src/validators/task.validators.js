import { body, param } from "express-validator";

const optionalAssignee = body("assignedTo")
  .optional({ values: "null" })
  .custom((v) => v === null || v === "" || /^[a-f\d]{24}$/i.test(String(v)))
  .withMessage("Invalid assignee id");

export const createTaskRules = [
  body("title").trim().notEmpty().isLength({ max: 200 }),
  body("description").optional().isLength({ max: 8000 }),
  body("status").optional().isIn(["todo", "in_progress", "review", "done"]),
  body("priority").optional().isIn(["low", "medium", "high", "urgent"]),
  body("dueDate").optional().isISO8601(),
  optionalAssignee,
];

export const updateTaskRules = [
  param("taskId").isMongoId(),
  body("title").optional().trim().notEmpty().isLength({ max: 200 }),
  body("description").optional().isLength({ max: 8000 }),
  body("status").optional().isIn(["todo", "in_progress", "review", "done"]),
  body("priority").optional().isIn(["low", "medium", "high", "urgent"]),
  body("dueDate").optional({ nullable: true }).isISO8601(),
  optionalAssignee,
];

export const taskIdParam = [param("taskId").isMongoId()];
