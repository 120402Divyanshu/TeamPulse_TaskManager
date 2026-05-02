import { body, param } from "express-validator";

export const createProjectRules = [
  body("name").trim().notEmpty().isLength({ max: 160 }),
  body("description").optional().isLength({ max: 4000 }),
];

export const updateProjectRules = [
  body("name").optional().trim().notEmpty().isLength({ max: 160 }),
  body("description").optional().isLength({ max: 4000 }),
];

export const addMemberRules = [
  body("email").isEmail().normalizeEmail(),
  body("role").optional().isIn(["admin", "member"]),
];

export const updateMemberRoleRules = [
  param("userId").isMongoId(),
  body("role").isIn(["admin", "member"]),
];

export const mongoIdParam = (field = "id") => [param(field).isMongoId()];
