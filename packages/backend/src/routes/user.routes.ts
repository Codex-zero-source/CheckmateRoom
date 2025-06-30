import { Router } from 'express';
import { getUser, setUsername } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/:walletAddress', getUser);
router.post('/username', authMiddleware, setUsername);

export default router; 