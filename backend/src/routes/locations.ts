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

        const locations = await prisma.location.findMany({ 
            where: { organizationId: user.organizationId }
        });

        return res.status(200).json(locations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        return res.status(500).json({ error: 'Failed to fetch locations' });
    }
});

export default router