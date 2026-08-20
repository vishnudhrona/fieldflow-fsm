import { Transaction } from 'sequelize';
import { WorkOrderHistory, User } from '../models';

export interface RecordHistoryInput {
  workOrderId: string;
  userId?: string | null;
  action: string;
  description: string;
  metadata?: Record<string, any> | null;
  transaction?: Transaction;
}

const isValidUuid = (val: any): boolean =>
  typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

export const recordWorkOrderHistory = async ({
  workOrderId,
  userId,
  action,
  description,
  metadata = null,
  transaction,
}: RecordHistoryInput) => {
  try {
    const validUserId = isValidUuid(userId) ? userId : null;
    return await WorkOrderHistory.create(
      {
        workOrderId,
        userId: validUserId,
        action,
        description,
        metadata,
      },
      transaction ? { transaction } : undefined,
    );
  } catch (error) {
    console.error('Failed to record work order history:', error);
    return null;
  }
};

export const getWorkOrderHistory = async (workOrderId: string) => {
  return await WorkOrderHistory.findAll({
    where: { workOrderId },
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
    order: [['created_at', 'DESC']],
  });
};
