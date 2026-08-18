import { Router } from 'express';
import { login, getTechnicians } from '../controllers/authController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.get('/technicians', authenticateJWT, getTechnicians);

export default router;
