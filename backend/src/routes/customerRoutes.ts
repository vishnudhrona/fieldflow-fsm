import { Router } from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
} from '../controllers/customerController';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware';
import { ROLES } from '../config/constants';

const router = Router();

router.use(authenticateJWT, authorizeRoles(ROLES.ADMIN_DISPATCHER));

router.post('/', createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.patch('/:id', updateCustomer);
router.put('/:id', updateCustomer);

export default router;
