import { Router } from "express";
import { dashboard } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();
r.get("/", requireAuth, dashboard);
export default r;
