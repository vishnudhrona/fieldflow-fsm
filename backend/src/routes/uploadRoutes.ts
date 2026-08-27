import { Router } from 'express';
import { upload } from '../middlewares/uploadMiddleware';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { uploadLimiter } from '../middlewares/rateLimiter';
import { uploadToS3ViaMulter, deleteFromS3 } from '../controllers/uploadController';

const router = Router();

router.post('/', authenticateJWT, uploadLimiter, upload.single('file'), uploadToS3ViaMulter);
router.delete('/', authenticateJWT, deleteFromS3);

export default router;
