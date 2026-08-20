import { Router } from 'express';
import {
  createWorkOrder,
  getWorkOrders,
  getWorkOrder,
  updateWorkOrder,
} from '../controllers/workOrderController';
import {
  addAttachment,
  getAttachments,
  deleteAttachment,
} from '../controllers/attachmentController';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';
import { uploadLimiter } from '../middlewares/rateLimiter';
import { ROLES } from '../config/constants';

const router = Router();

router.use(authenticateJWT);

router.get('/', getWorkOrders);
router.get('/:id', getWorkOrder);
router.post('/', authorizeRoles(ROLES.ADMIN_DISPATCHER), createWorkOrder);
router.put('/:id', authorizeRoles(ROLES.ADMIN_DISPATCHER), updateWorkOrder);

router.get('/:id/attachments', getAttachments);
router.post('/:id/attachments', uploadLimiter, upload.single('file'), addAttachment);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

export default router;
