import { verifyToken } from "../utils/token.js";
import { User } from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = { id: user._id.toString(), email: user.email, name: user.name };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
