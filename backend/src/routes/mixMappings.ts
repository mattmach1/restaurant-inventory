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

    const { menuItemId, locationId } = req.query;

    const mixMappings = await prisma.mixMapping.findMany({
      where: {
        menuItemId: menuItemId as string,
        locationId: locationId as string,
      },
      include: {
        ingredient: true,
      },
    });
    return res.status(200).json(mixMappings);
  } catch (error) {
    console.error("Error fetching mix mappings", error);
    return res.status(500).json({ error: "Failed to fetch mix mappings" });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { menuItemId, locationId, ingredientId, quantity } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify location belongs to users organization
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location || location.organizationId !== user.organizationId) {
      return res
        .status(403)
        .json({ error: "Location not found or access denied" });
    }

    // Verify menu item belongs to users organization
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!menuItem || menuItem.organizationId !== user.organizationId) {
      return res
        .status(403)
        .json({ error: "Menu item not found or access denied" });
    }

    // Verify ingredient belongs to users organization
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient || ingredient.organizationId !== user.organizationId) {
      return res
        .status(403)
        .json({ error: "Ingredient not found or access denied" });
    }

    const mixMapping = await prisma.mixMapping.create({
      data: {
        menuItemId,
        locationId,
        ingredientId,
        quantity,
      },
    });
    return res.status(201).json(mixMapping);
  } catch (error) {
    console.error("Error creating mix mapping", error);
    return res.status(500).json({ error: "Failed to create mix mapping" });
  }
});

router.post('/copy', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { fromLocationId, toLocationId } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify both locations belong to users organization
        const [fromLocation, toLocation] = await Promise.all([
            prisma.location.findUnique({ where: { id: fromLocationId } }),
            prisma.location.findUnique({ where: { id: toLocationId } })
        ]);

        if (!fromLocation || fromLocation.organizationId !== user.organizationId) {
            return res.status(403).json({ error: 'Source location not found or access denied' });
        }

        if (!toLocation || toLocation.organizationId !== user.organizationId) {
            return res.status(403).json({ error: 'Destination location not found or access denied' });
        }

        // Get all mixMappings from source location
        const existingMappings = await prisma.mixMapping.findMany({
            where: { locationId: fromLocationId }
        });

        // Delete existing mappings at destination
        await prisma.mixMapping.deleteMany({
            where: { locationId: toLocationId }
        });

        // Create new mappings at destination
        const newMappings = await prisma.mixMapping.createMany({
            data: existingMappings.map(mapping => ({
                menuItemId: mapping.menuItemId,
                locationId: toLocationId,
                ingredientId: mapping.ingredientId,
                quantity: mapping.quantity
            }))
        });

        return res.status(200).json({
            message: 'Menu copied successfully',
            copiedCount: newMappings.count
        });
    } catch (error) {
        console.error('Error copying menu', error);
        return res.status(500).json({ error: 'Failed to copy menu' });
    }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(404).json({ error: 'Mix mapping ID not found' });
    }
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const mixMapping = await prisma.mixMapping.findUnique({
      where: {id: id }
    });

    if (!mixMapping) {
      return res.status(404).json({ error: 'Mix mapping not found' })
    }

    const location = await prisma.location.findUnique({
      where: { id: mixMapping.locationId }
    });

    if(!location) {
      return res.status(404).json({ error: 'Location not found' })
    }

    if (location.organizationId !== user.organizationId ) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await prisma.mixMapping.delete({
      where: { id: id }
    });

    return res.status(200).json({ message: 'Mix mapping deleted successfully' });

  } catch (error) {
    console.error('Error deleting mix mapping', error);
    return res.status(500).json({ error: 'Faileed to delete mix mapping' });
  }
});

router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const { quantity } = req.body;

    if (!id) {
      return res.status(404).json({ error: 'Mix mapping ID not found' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const mixMapping = await prisma.mixMapping.findUnique({
      where: { id: id }
    })

    if (!mixMapping) {
      return res.status(404).json({ error: 'Mix mapping not found' });
    }

    const location = await prisma.location.findUnique({
      where: { id: mixMapping.locationId }
    });

    if (!location || location.organizationId !== user.organizationId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updatedMixMapping = await prisma.mixMapping.update({
      where: { id: id },
      data: { quantity: parseFloat(quantity) }
    });

    return res.status(200).json(updatedMixMapping);
  } catch (error) {
    console.error('Error updating mix mapping', error);
    return res.status(500).json({error: 'Failed to update mix mapping' });
  }
});

export default router;
