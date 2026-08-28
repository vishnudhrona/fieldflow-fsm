import { Router } from 'express';
import { batchSync } from '../controllers/syncController';
import { listConflicts, resolveConflict } from '../controllers/conflictController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { syncLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.use(authenticateJWT);

router.post('/batch', syncLimiter, batchSync);
router.get('/conflicts', listConflicts);
router.post('/conflicts/:id/resolve', resolveConflict);

export default router;
