import { Router } from "express";
import type { Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";

interface AuthRequest extends Request {
  userId?: string;
}

const router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const locations = await prisma.location.findMany({
      where: { organizationId: user.organizationId },
    });

    return res.status(200).json(locations);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return res.status(500).json({ error: "Failed to fetch locations" });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { name } = req.body;

    // Get user to find organizationId
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found " });
    }

    // Create the location
    const location = await prisma.location.create({
      data: {
        name,
        organizationId: user.organizationId,
      },
    });

    return res.status(201).json(location);
  } catch (error) {
    console.error("Error creating location:", error);
    return res.status(500).json({ error: "Failed to create location" });
  }
});

router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;

      if (!id) {
        return res.status(404).json({ error: "Location ID not found" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const location = await prisma.location.findUnique({
        where: { id: id },
      });

      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }

      if (location.organizationId !== user.organizationId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await prisma.location.delete({
        where: { id: id },
      });

      return res.status(200).json({ message: "Location deleted successfully" });
    } catch (error) {
      console.error("Error deleting location", error);
      return res.status(500).json({ error: "Faileed to delete location" });
    }
  }
);
export default router;
