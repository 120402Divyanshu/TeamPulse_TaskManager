import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { registerRules, loginRules } from "../validators/auth.validators.js";

const r = Router();

r.post("/register", registerRules, register);
r.post("/login", loginRules, login);
r.get("/me", requireAuth, me);

export default r;
