import type { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized", message: "Admin login required" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden", message: "Admin access required" });
  }

  return next();
}
