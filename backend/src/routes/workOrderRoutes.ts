import { Router } from 'express';
import {
  createWorkOrder,
  getWorkOrders,
  getWorkOrder,
  updateWorkOrder,
  updateWorkOrderStatus,
} from '../controllers/workOrderController';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware';
import { ROLES } from '../config/constants';

const router = Router();

router.use(authenticateJWT);

router.get('/', getWorkOrders);
router.get('/:id', getWorkOrder);
router.patch('/:id/status', authorizeRoles(ROLES.ADMIN_DISPATCHER), updateWorkOrderStatus);
router.post('/', authorizeRoles(ROLES.ADMIN_DISPATCHER), createWorkOrder);
router.put('/:id', authorizeRoles(ROLES.ADMIN_DISPATCHER), updateWorkOrder);

export default router;
