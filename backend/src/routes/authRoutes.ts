import { Router } from 'express';
import { login, getTechnicians } from '../controllers/authController';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware';
import { authLimiter } from '../middlewares/rateLimiter';
import { ROLES } from '../config/constants';

const router = Router();

router.post('/login', authLimiter, login);
router.get('/technicians', authenticateJWT, authorizeRoles(ROLES.ADMIN_DISPATCHER), getTechnicians);

export default router;
