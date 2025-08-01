import { Response } from 'express';
import Joi from 'joi';
import { User } from '../models/User';
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
        let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

        if (user) {
            user.username = username;
            user = await User.save(user);
        } else {
            user = await User.create({ walletAddress, username });
        }

        res.status(200).json({ message: 'Username set successfully!', user: { username: user.username } });

    } catch (error: any) {
        if (error.message.includes('already taken') || error.message.includes('was taken')) {
            res.status(409).json({ message: error.message });
        } else {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
};
