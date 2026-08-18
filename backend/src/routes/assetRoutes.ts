import { Router } from 'express';
import { createAsset, getAssetById, updateAsset, deleteAsset } from '../controllers/assetController';
import { authenticateJWT, authorizeRoles } from '../middlewares/authMiddleware';
import { ROLES } from '../config/constants';

const router = Router();

router.use(authenticateJWT);

router.get('/:id', getAssetById);

router.post('/', authorizeRoles(ROLES.ADMIN_DISPATCHER), createAsset);
router.put('/:id', authorizeRoles(ROLES.ADMIN_DISPATCHER), updateAsset);
router.delete('/:id', authorizeRoles(ROLES.ADMIN_DISPATCHER), deleteAsset);

export default router;
