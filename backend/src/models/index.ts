import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import configObject from '../config/config';
import UserModelInit from './user';
import CustomerModelInit from './customer';
import MenuModelInit from './menu';
import AssetModelInit from './asset';
import WorkOrderModelInit from './workOrder';
import WorkOrderChecklistModelInit from './workOrderChecklist';
import WorkOrderAttachmentModelInit from './workOrderAttachment';
import WorkOrderNoteModelInit from './workOrderNote';
import WorkOrderHistoryModelInit from './workOrderHistory';
import WorkOrderReadingModelInit from './workOrderReading';
import SyncOperationModelInit from './syncOperation';
import WorkOrderConflictModelInit from './workOrderConflict';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const config = (configObject as any)[env] || configObject.development;

let sequelize: Sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: config.logging,
    dialectOptions: config.dialectOptions,
  });
} else {
  sequelize = new Sequelize(config.database!, config.username!, config.password!, config);
}

const User = UserModelInit(sequelize, DataTypes);
const Customer = CustomerModelInit(sequelize, DataTypes);
const Menu = MenuModelInit(sequelize, DataTypes);
const Asset = AssetModelInit(sequelize, DataTypes);
const WorkOrder = WorkOrderModelInit(sequelize, DataTypes);
const WorkOrderChecklist = WorkOrderChecklistModelInit(sequelize, DataTypes);
const WorkOrderAttachment = WorkOrderAttachmentModelInit(sequelize, DataTypes);
const WorkOrderNote = WorkOrderNoteModelInit(sequelize, DataTypes);
const WorkOrderHistory = WorkOrderHistoryModelInit(sequelize, DataTypes);
const WorkOrderReading = WorkOrderReadingModelInit(sequelize, DataTypes);
const SyncOperation = SyncOperationModelInit(sequelize, DataTypes);
const WorkOrderConflict = WorkOrderConflictModelInit(sequelize, DataTypes);

Customer.hasMany(Asset, { foreignKey: 'customerId', as: 'assets', onDelete: 'SET NULL' });
Asset.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Customer.hasMany(WorkOrder, { foreignKey: 'customerId', as: 'workOrders', onDelete: 'CASCADE' });
WorkOrder.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

Asset.hasMany(WorkOrder, { foreignKey: 'assetId', as: 'workOrders', onDelete: 'CASCADE' });
WorkOrder.belongsTo(Asset, { foreignKey: 'assetId', as: 'asset' });

User.hasMany(WorkOrder, { foreignKey: 'technicianId', as: 'assignedWorkOrders', onDelete: 'SET NULL' });
WorkOrder.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });

WorkOrder.hasMany(WorkOrderChecklist, { foreignKey: 'workOrderId', as: 'checklistItems', onDelete: 'CASCADE' });
WorkOrderChecklist.belongsTo(WorkOrder, { foreignKey: 'workOrderId', as: 'workOrder' });

WorkOrder.hasMany(WorkOrderAttachment, { foreignKey: 'workOrderId', as: 'attachments', onDelete: 'CASCADE' });
WorkOrderAttachment.belongsTo(WorkOrder, { foreignKey: 'workOrderId', as: 'workOrder' });

User.hasMany(WorkOrderAttachment, { foreignKey: 'technicianId', as: 'uploadedAttachments', onDelete: 'SET NULL' });
WorkOrderAttachment.belongsTo(User, { foreignKey: 'technicianId', as: 'technician' });

WorkOrder.hasMany(WorkOrderNote, { foreignKey: 'workOrderId', as: 'notes', onDelete: 'CASCADE' });
WorkOrderNote.belongsTo(WorkOrder, { foreignKey: 'workOrderId', as: 'workOrder' });

User.hasMany(WorkOrderNote, { foreignKey: 'userId', as: 'notes', onDelete: 'CASCADE' });
WorkOrderNote.belongsTo(User, { foreignKey: 'userId', as: 'user' });

WorkOrder.hasMany(WorkOrderHistory, { foreignKey: 'workOrderId', as: 'history', onDelete: 'CASCADE' });
WorkOrderHistory.belongsTo(WorkOrder, { foreignKey: 'workOrderId', as: 'workOrder' });

User.hasMany(WorkOrderHistory, { foreignKey: 'userId', as: 'historyLogs', onDelete: 'SET NULL' });
WorkOrderHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

WorkOrder.hasMany(WorkOrderReading, { foreignKey: 'workOrderId', as: 'readings', onDelete: 'CASCADE' });
WorkOrderReading.belongsTo(WorkOrder, { foreignKey: 'workOrderId', as: 'workOrder' });

User.hasMany(WorkOrderReading, { foreignKey: 'userId', as: 'readings', onDelete: 'SET NULL' });
WorkOrderReading.belongsTo(User, { foreignKey: 'userId', as: 'technician' });

User.hasMany(SyncOperation, { foreignKey: 'actorId', as: 'syncOperations', onDelete: 'CASCADE' });
SyncOperation.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

WorkOrder.hasMany(WorkOrderConflict, { foreignKey: 'workOrderId', as: 'conflicts', onDelete: 'CASCADE' });
WorkOrderConflict.belongsTo(WorkOrder, { foreignKey: 'workOrderId', as: 'workOrder' });
User.hasMany(WorkOrderConflict, { foreignKey: 'actorId', as: 'reportedConflicts', onDelete: 'SET NULL' });
WorkOrderConflict.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

const db = {
  sequelize,
  Sequelize,
  User,
  Customer,
  Menu,
  Asset,
  WorkOrder,
  WorkOrderChecklist,
  WorkOrderAttachment,
  WorkOrderNote,
  WorkOrderHistory,
  WorkOrderReading,
  SyncOperation,
  WorkOrderConflict,
};

export {
  sequelize,
  Sequelize,
  User,
  Customer,
  Menu,
  Asset,
  WorkOrder,
  WorkOrderChecklist,
  WorkOrderAttachment,
  WorkOrderNote,
  WorkOrderHistory,
  WorkOrderReading,
  SyncOperation,
  WorkOrderConflict,
};
export type { SyncOperationState } from './syncOperation';
export default db;
