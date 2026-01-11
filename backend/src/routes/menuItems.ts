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
        const user = await prisma.user.findUnique( {
            where: { id: req.userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const menuItems = await prisma.menuItem.findMany({
            where: { organizationId: user.organizationId }
        });

        return res.status(200).json(menuItems);
    } catch (error) {
        console.error('Error fetching menu items', error)
        return res.status(500).json({ error: 'Failed to fetch menu items' })
    }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized' })
        }
        const { name, description } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const menuItem = await prisma.menuItem.create({
            data: {
                name,
                description,
                organizationId: user.organizationId
            }
        });
        return res.status(201).json(menuItem);
    } catch (error) {
        console.error('Error creating menu item', error)
        return res.status(500).json({ error: 'Failed to create menu item' })
    }
});

export default router;