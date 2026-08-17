import { Router } from 'express';
import { upload } from '../middlewares/uploadMiddleware';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware';
import { ROLES } from '../config/constants';
import { uploadToS3ViaMulter, deleteFromS3 } from '../controllers/uploadController';

const router = Router();

router.post(
  '/',
  authenticateJWT,
  authorizeRoles(ROLES.ADMIN_DISPATCHER),
  upload.single('file'),
  uploadToS3ViaMulter
);

router.delete('/', authenticateJWT, deleteFromS3);

export default router;
