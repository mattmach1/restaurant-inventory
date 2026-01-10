import { Router } from 'express';
import type { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

interface AuthRequest extends Request {
    userId?: string;
}

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const ingredients = await prisma.ingredient.findMany({
            where: { organizationId: user.organizationId }
        });

        return res.status(200).json(ingredients);
    } catch (error) {
        console.error('Error fetching ingredients', error)
        return res.status(500).json({ error: 'Failed to fetch ingredients' })
    }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { name, price, unit } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' })
        }

        const ingredient = await prisma.ingredient.create({
            data: {
                name,
                price,
                unit,
                organizationId: user.organizationId
            }
        });
        return res.status(201).json(ingredient)
    } catch (error) {
        console.error('Error creating ingredient', error)
        res.status(500).json({ error: 'Failed to create ingredient' });
    }
});

export default router;