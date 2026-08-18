import { Op } from 'sequelize';
import { sequelize, WorkOrder, WorkOrderChecklist, Customer, Asset, User } from '../models';
import type { WorkOrderAttributes, WorkOrderStatus, WorkOrderPriority } from '../models/workOrder';

export interface CreateWorkOrderInput {
  title: string;
  description?: string;
  customerId: string;
  assetId: string;
  technicianId?: string | null;
  priority: WorkOrderPriority;
  scheduledDate: string;
  scheduledTime?: string;
  checklistItems?: string[];
}

export const generateNextOrderNumber = async (): Promise<string> => {
  const count = await WorkOrder.count();
  const nextNum = 1001 + count;
  return `WO-${nextNum}`;
};

export const createWorkOrderWithChecklist = async (input: CreateWorkOrderInput) => {
  return await sequelize.transaction(async (t) => {
    const orderNumber = await generateNextOrderNumber();

    const workOrder = await WorkOrder.create(
      {
        orderNumber,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        customerId: input.customerId,
        assetId: input.assetId,
        technicianId: input.technicianId || null,
        status: 'PENDING',
        priority: input.priority,
        scheduledDate: input.scheduledDate,
        scheduledTime: input.scheduledTime || null,
      },
      { transaction: t }
    );

    if (input.checklistItems && input.checklistItems.length > 0) {
      const checklistRecords = input.checklistItems
        .filter((item) => item.trim().length > 0)
        .map((item, index) => ({
          workOrderId: workOrder.id,
          taskDescription: item.trim(),
          isCompleted: false,
          orderIndex: index,
        }));

      if (checklistRecords.length > 0) {
        await WorkOrderChecklist.bulkCreate(checklistRecords, { transaction: t });
      }
    }

    return await WorkOrder.findByPk(workOrder.id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone', 'address', 'contactPerson'] },
        { model: Asset, as: 'asset', attributes: ['id', 'machineName', 'machineType', 'modelName', 'imageUrl'] },
        { model: User, as: 'technician', attributes: ['id', 'name', 'email', 'phone'] },
        { model: WorkOrderChecklist, as: 'checklistItems' },
      ],
      transaction: t,
    });
  });
};

export const findAllWorkOrders = async (filters?: {
  search?: string;
  status?: string;
  technicianId?: string;
}) => {
  const whereClause: any = {};

  if (filters?.status && filters.status !== 'ALL') {
    whereClause.status = filters.status;
  }

  if (filters?.technicianId) {
    whereClause.technicianId = filters.technicianId;
  }

  if (filters?.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    whereClause[Op.or] = [
      { orderNumber: { [Op.iLike]: term } },
      { title: { [Op.iLike]: term } },
      { '$customer.name$': { [Op.iLike]: term } },
      { '$asset.machine_name$': { [Op.iLike]: term } },
    ];
  }

  return await WorkOrder.findAll({
    where: whereClause,
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone', 'address', 'contactPerson'] },
      { model: Asset, as: 'asset', attributes: ['id', 'machineName', 'machineType', 'modelName', 'imageUrl'] },
      { model: User, as: 'technician', attributes: ['id', 'name', 'email', 'phone'] },
      { model: WorkOrderChecklist, as: 'checklistItems' },
    ],
    order: [['created_at', 'DESC']],
  });
};

export const findWorkOrderById = async (id: string) => {
  return await WorkOrder.findByPk(id, {
    include: [
      { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone', 'address', 'contactPerson', 'email'] },
      { model: Asset, as: 'asset' },
      { model: User, as: 'technician', attributes: ['id', 'name', 'email', 'phone'] },
      { model: WorkOrderChecklist, as: 'checklistItems' },
    ],
  });
};

export const updateWorkOrderById = async (id: string, input: Partial<CreateWorkOrderInput>) => {
  return await sequelize.transaction(async (t) => {
    const workOrder = await WorkOrder.findByPk(id, { transaction: t });
    if (!workOrder) return null;

    await workOrder.update(
      {
        title: input.title !== undefined ? input.title.trim() : workOrder.title,
        description: input.description !== undefined ? input.description?.trim() || null : workOrder.description,
        customerId: input.customerId || workOrder.customerId,
        assetId: input.assetId || workOrder.assetId,
        technicianId: input.technicianId !== undefined ? input.technicianId : workOrder.technicianId,
        priority: input.priority || workOrder.priority,
        scheduledDate: input.scheduledDate || workOrder.scheduledDate,
        scheduledTime: input.scheduledTime !== undefined ? input.scheduledTime : workOrder.scheduledTime,
      },
      { transaction: t }
    );

    if (input.checklistItems && Array.isArray(input.checklistItems)) {
      await WorkOrderChecklist.destroy({ where: { workOrderId: id }, transaction: t });
      const checklistRecords = input.checklistItems
        .filter((item) => item.trim().length > 0)
        .map((item, index) => ({
          workOrderId: id,
          taskDescription: item.trim(),
          isCompleted: false,
          orderIndex: index,
        }));
      if (checklistRecords.length > 0) {
        await WorkOrderChecklist.bulkCreate(checklistRecords, { transaction: t });
      }
    }

    return await WorkOrder.findByPk(id, {
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'phone', 'address', 'contactPerson'] },
        { model: Asset, as: 'asset', attributes: ['id', 'machineName', 'machineType', 'modelName', 'imageUrl'] },
        { model: User, as: 'technician', attributes: ['id', 'name', 'email', 'phone'] },
        { model: WorkOrderChecklist, as: 'checklistItems' },
      ],
      transaction: t,
    });
  });
};

export const updateWorkOrderStatusById = async (id: string, status: WorkOrderStatus) => {
  const workOrder = await WorkOrder.findByPk(id);
  if (!workOrder) return null;

  const updates: Partial<WorkOrderAttributes> = { status };
  if (status === 'COMPLETED') {
    updates.completedAt = new Date();
  }

  return await workOrder.update(updates);
};
