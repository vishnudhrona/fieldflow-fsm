import { Router } from 'express';
import { login, getTechnicians } from '../controllers/authController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { authLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/login', authLimiter, login);
router.get('/technicians', authenticateJWT, getTechnicians);

export default router;
