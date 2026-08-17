import { Router } from 'express';
import { createAsset, getAssetById, updateAsset, deleteAsset } from '../controllers/assetController';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware';
import { ROLES } from '../config/constants';

const router = Router();

router.use(authenticateJWT, authorizeRoles(ROLES.ADMIN_DISPATCHER));

router.post('/', createAsset);
router.get('/:id', getAssetById);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);

export default router;
