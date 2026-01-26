import { Router } from "express";
import type { Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { requireRole } from "../middleware/requireRole.js";

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

    const menuItems = await prisma.menuItem.findMany({
      where: { organizationId: user.organizationId },
    });

    return res.status(200).json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items", error);
    return res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { name, description } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        organizationId: user.organizationId,
      },
    });
    return res.status(201).json(menuItem);
  } catch (error) {
    console.error("Error creating menu item", error);
    return res.status(500).json({ error: "Failed to create menu item" });
  }
});

router.delete(
  "/:id",
  authMiddleware, requireRole(['ADMIN']),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;

      if (!id) {
        return res.status(404).json({ error: "Menu item ID not found" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const menuItem = await prisma.menuItem.findUnique({
        where: { id: id },
      });

      if (!menuItem) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      if (user.organizationId !== menuItem.organizationId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await prisma.menuItem.delete({
        where: { id: id },
      });

      return res
        .status(200)
        .json({ message: "Menu item deleted successfully" });
    } catch (error) {
      console.error("Error deleting Menu item", error);
      return res.status(500).json({ error: "Failed to delete Menu Item" });
    }
  }
);

router.patch("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.params
    const { name, description } = req.body;

    if (!id) {
      return res.status(404).json({ error: 'Menu item ID not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const menuItem = await prisma.menuItem.findUnique({ 
      where: { id: id }
    })

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu Item not found' })
    }

    if (menuItem.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updatedMenuItem = await prisma.menuItem.update({
      where : { id: id },
      data: { name: name,
        description: description
       }
    });

    return res.status(200).json(updatedMenuItem);
  } catch (error) {
      console.error('Error updating menu item', error);
      return res.status(500).json({ error: 'Failed to update ingredient' });
  }
});

export default router;
