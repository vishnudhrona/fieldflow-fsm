import { Router } from 'express';
import { batchSync } from '../controllers/syncController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { syncLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.use(authenticateJWT);

router.post('/batch', syncLimiter, batchSync);

export default router;
