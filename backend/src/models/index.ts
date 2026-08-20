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

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const config = (configObject as any)[env] || configObject.development;

let sequelize: Sequelize;
if (config.use_env_variable) {
  const dbUrl = process.env[config.use_env_variable];
  if (!dbUrl) {
    throw new Error(`Environment variable ${config.use_env_variable} is not set.`);
  }
  sequelize = new Sequelize(dbUrl, config);
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
};
export default db;
