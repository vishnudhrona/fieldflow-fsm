import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import configObject from '../config/config';
import UserModelInit from './user';
import CustomerModelInit from './customer';
import MenuModelInit from './menu';
import AssetModelInit from './asset';
import WorkOrderModelInit from './workOrder';
import WorkOrderChecklistModelInit from './workOrderChecklist';

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

// Associations
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

const db = {
  sequelize,
  Sequelize,
  User,
  Customer,
  Menu,
  Asset,
  WorkOrder,
  WorkOrderChecklist,
};

export { sequelize, Sequelize, User, Customer, Menu, Asset, WorkOrder, WorkOrderChecklist };
export default db;
