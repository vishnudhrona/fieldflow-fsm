import { Router } from 'express';
import { getMenus } from '../controllers/menuController';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateJWT, getMenus);

export default router;
