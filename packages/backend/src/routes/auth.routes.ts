import { Router } from 'express';
import { getToken } from '../controllers/auth.controller';

const router = Router();

router.post('/token', getToken);

export default router;
