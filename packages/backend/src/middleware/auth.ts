import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';

export interface AuthenticatedRequest extends Request {
    user?: {
        walletAddress: string;
    };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Unauthorized: No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Unauthorized: Malformed token' });
        return;
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET!) as { walletAddress: string };
        req.user = { walletAddress: payload.walletAddress.toLowerCase() };
        next();
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized: Invalid token' });
        return;
    }
}; 