import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import { User } from '../models/User';

export const getToken = async (req: Request, res: Response): Promise<void> => {
    const { walletAddress } = req.body;

    if (!walletAddress) {
        res.status(400).json({ message: 'Wallet address is required.' });
        return;
    }

    try {
        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (!user) {
            // For this example, we'll create a user if they don't exist.
            // In a real-world scenario, you might want to handle this differently.
            user = await User.create({ walletAddress, username: 'NewUser' });
        }

        const token = jwt.sign({ walletAddress: user.walletAddress }, JWT_SECRET!, { expiresIn: '1h' });
        res.status(200).json({ token });

    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
