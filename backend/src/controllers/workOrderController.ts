import { Response } from 'express';
import {
  createWorkOrderWithChecklist,
  findAllWorkOrders,
  findWorkOrderById,
  updateWorkOrderById,
  type CreateWorkOrderInput,
} from '../helpers/workOrderQueries';
import { recordWorkOrderHistory } from '../helpers/historyQueries';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { ROLES } from '../config/constants';

export const createWorkOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      customerId,
      assetId,
      technicianId,
      priority,
      scheduledDate,
      scheduledTime,
      checklistItems,
    } = req.body;

    if (!title || !customerId || !assetId || !scheduledDate || !technicianId) {
      res.status(400).json({
        message: 'Validation error: Title, Customer, Asset, Technician, and Scheduled Date are required.',
      });
      return;
    }

    const input: CreateWorkOrderInput = {
      title,
      description,
      customerId,
      assetId,
      technicianId: technicianId || null,
      priority: priority,
      scheduledDate,
      scheduledTime,
      checklistItems: Array.isArray(checklistItems) ? checklistItems : [],
      userId: req.user?.id || null,
    };

    const newWorkOrder = await createWorkOrderWithChecklist(input);

    res.status(201).json({
      message: 'Work order created and dispatched successfully',
      workOrder: newWorkOrder,
    });
  } catch (error: any) {
    if (error?.name === 'SequelizeValidationError') {
      res.status(400).json({
        message: error.errors?.[0]?.message || 'Validation error',
      });
      return;
    }
    res.status(500).json({
      message: 'Internal server error while creating work order',
      error: error?.message,
    });
  }
};

export const getWorkOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, status } = req.query as { search?: string; status?: string };

    let technicianId: string | undefined = undefined;
    if (req.user?.role === ROLES.TECHNICIAN) {
      technicianId = req.user.id;
    }

    const workOrders = await findAllWorkOrders({ search, status, technicianId });

    res.status(200).json({ workOrders, total: workOrders.length });
  } catch (error: any) {
    res.status(500).json({
      message: 'Internal server error while fetching work orders',
      error: error?.message,
    });
  }
};

export const getWorkOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const workOrder = await findWorkOrderById(id);

    if (!workOrder) {
      res.status(404).json({ message: 'Work order not found' });
      return;
    }

    if (req.user?.role === ROLES.TECHNICIAN && workOrder.technicianId !== req.user.id) {
      res.status(403).json({ message: 'Forbidden: You do not have access to this work order' });
      return;
    }

    res.status(200).json({ workOrder });
  } catch (error: any) {
    res.status(500).json({
      message: 'Internal server error while fetching work order',
      error: error?.message,
    });
  }
};

export const updateWorkOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const updated = await updateWorkOrderById(id, {
      ...req.body,
      userId: req.user?.id || null,
    });

    if (!updated) {
      res.status(404).json({ message: 'Work order not found' });
      return;
    }

    res.status(200).json({
      message: 'Work order updated successfully',
      workOrder: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Internal server error while updating work order',
      error: error?.message,
    });
  }
};
