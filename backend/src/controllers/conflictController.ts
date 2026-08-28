import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { WorkOrderConflict, WorkOrder, User } from '../models';
import type { ConflictStatus } from '../models/workOrderConflict';
import { ROLES } from '../config/constants';

export const listConflicts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { workOrderId, status = 'PENDING' } = req.query;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (workOrderId) {
      where.workOrderId = workOrderId;
    }

    if (req.user.role !== ROLES.ADMIN_DISPATCHER) {
      where.actorId = req.user.id;
    }

    const conflicts = await WorkOrderConflict.findAll({
      where,
      include: [
        {
          model: WorkOrder,
          as: 'workOrder',
          attributes: ['id', 'orderNumber', 'title', 'status', 'version'],
        },
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      conflicts,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to list sync conflicts',
    });
  }
};

export const resolveConflict = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { resolution, action } = req.body as {
      resolution?: string;
      action: 'ACCEPT_SERVER' | 'DISCARD' | 'REAPPLY';
    };

    const conflict = await WorkOrderConflict.findByPk(id);
    if (!conflict) {
      res.status(404).json({ message: 'Conflict record not found' });
      return;
    }

    if (req.user.role !== ROLES.ADMIN_DISPATCHER && conflict.actorId !== req.user.id) {
      res.status(403).json({ message: 'Forbidden: You cannot resolve this conflict' });
      return;
    }

    let nextStatus: ConflictStatus = 'RESOLVED_DISCARDED';
    if (action === 'ACCEPT_SERVER') {
      nextStatus = 'RESOLVED_ACCEPT_SERVER';
    } else if (action === 'REAPPLY') {
      nextStatus = 'RESOLVED_REAPPLIED';
    }

    await conflict.update({
      status: nextStatus,
      resolution: resolution || `Resolved via ${action}`,
      resolvedBy: req.user.id,
      resolvedAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: `Conflict marked as ${nextStatus}`,
      conflict,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message || 'Failed to resolve conflict',
    });
  }
};
