import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

// Extend the request type to include userId
export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Extract token (remove "Bearer" prefix)
    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }

    // Attach userId to request
    req.userId = decoded.userId;
    req.userRole = user.role;

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
