import { Response } from 'express';
import Joi from 'joi';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

// Validation schema for username
const usernameSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(20).required(),
});

export const getUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findOne({ walletAddress: req.params.walletAddress.toLowerCase() });
        if (user) {
            res.status(200).json({ username: user.username });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error: any) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const setUsername = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { error } = usernameSchema.validate(req.body);
    if (error) {
        res.status(400).json({ message: error.details[0].message });
        return;
    }

    const { username } = req.body;
    const walletAddress = req.user?.walletAddress;

    if (!walletAddress) {
        // This should not happen if authMiddleware is working correctly
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    
    try {
        // Check if username is already taken by another user
        const existingUsername = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (existingUsername && existingUsername.walletAddress !== walletAddress.toLowerCase()) {
            res.status(409).json({ message: 'Username is already taken.' });
            return;
        }

        // Find user by wallet address and update or create
        const user = await User.findOneAndUpdate(
            { walletAddress: walletAddress.toLowerCase() },
            { username: username, $set: { lastLogin: new Date() } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ message: 'Username set successfully!', user: { username: user.username } });

    } catch (error: any) {
        // Handle potential duplicate key errors from the database just in case
        if (error.code === 11000) {
            res.status(409).json({ message: 'Username is already taken.' });
            return;
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 