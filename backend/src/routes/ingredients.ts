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

    const ingredients = await prisma.ingredient.findMany({
      where: { organizationId: user.organizationId },
    });

    return res.status(200).json(ingredients);
  } catch (error) {
    console.error("Error fetching ingredients", error);
    return res.status(500).json({ error: "Failed to fetch ingredients" });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { name, price, unit } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        price,
        unit,
        organizationId: user.organizationId,
      },
    });
    return res.status(201).json(ingredient);
  } catch (error) {
    console.error("Error creating ingredient", error);
    return res.status(500).json({ error: "Failed to create ingredient" });
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
        return res.status(404).json({ error: "Ingredient ID not found" });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const ingredient = await prisma.ingredient.findUnique({
        where: { id: id },
      });

      if (!ingredient) {
        return res.status(404).json({ error: "Ingredient not found" });
      }
      
      if (ingredient.organizationId !== user.organizationId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await prisma.ingredient.delete({
        where: { id: id },
      });

      return res.status(200).json({ message: "Ingredient deleted successfully" });
    } catch (error) {
      console.error("Error deleting ingredient", error);
      return res.status(500).json({ error: "Faileed to delete ingredient" });
    }
  }
);

router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const { name, price, unit } = req.body;

    if (!id) {
      return res.status(404).json({ error: 'Ingredient ID not found' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: id }
    })

    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }


    if (ingredient.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updatedIngredient = await prisma.ingredient.update({
      where: { id: id },
      data: { name: name,
        price: price,
        unit: unit
       }
    });

    return res.status(200).json(updatedIngredient);
  } catch (error) {
    console.error('Error updating ingredient', error);
    return res.status(500).json({error: 'Failed to update ingredient' });
  }
});


export default router;
