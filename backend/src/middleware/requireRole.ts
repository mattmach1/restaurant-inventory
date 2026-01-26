import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.js';


export const requireRole = (allowedRoles: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.userRole) {
                return res.status(403).json({ error: 'Role not found'});
            }

            if (!allowedRoles.includes(req.userRole)) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            next();
        } catch (error) {
            return res.status(500).json({ error: 'Authorization error' });
        }
    }
}