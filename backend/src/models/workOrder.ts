import { Model, Sequelize, DataTypes } from 'sequelize';

export type WorkOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export interface WorkOrderAttributes {
  id?: string;
  orderNumber: string;
  title: string;
  description?: string | null;
  customerId: string;
  assetId: string;
  technicianId?: string | null;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  scheduledDate: string;
  scheduledTime?: string | null;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WorkOrder extends Model<WorkOrderAttributes> implements WorkOrderAttributes {
  declare id: string;
  declare orderNumber: string;
  declare title: string;
  declare description: string | null;
  declare customerId: string;
  declare assetId: string;
  declare technicianId: string | null;
  declare status: WorkOrderStatus;
  declare priority: WorkOrderPriority;
  declare scheduledDate: string;
  declare scheduledTime: string | null;
  declare completedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default function (sequelize: Sequelize, dataTypes: typeof DataTypes) {
  WorkOrder.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      orderNumber: {
        type: dataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'order_number',
      },
      title: {
        type: dataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Work order title cannot be empty' },
        },
      },
      description: {
        type: dataTypes.TEXT,
        allowNull: true,
      },
      customerId: {
        type: dataTypes.UUID,
        allowNull: false,
        field: 'customer_id',
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      assetId: {
        type: dataTypes.UUID,
        allowNull: false,
        field: 'asset_id',
        references: {
          model: 'assets',
          key: 'id',
        },
      },
      technicianId: {
        type: dataTypes.UUID,
        allowNull: true,
        field: 'technician_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      status: {
        type: dataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      priority: {
        type: dataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'),
        allowNull: false,
        defaultValue: 'MEDIUM',
      },
      scheduledDate: {
        type: dataTypes.DATEONLY,
        allowNull: false,
        field: 'scheduled_date',
      },
      scheduledTime: {
        type: dataTypes.STRING(20),
        allowNull: true,
        field: 'scheduled_time',
      },
      completedAt: {
        type: dataTypes.DATE,
        allowNull: true,
        field: 'completed_at',
      },
    },
    {
      sequelize,
      modelName: 'WorkOrder',
      tableName: 'work_orders',
      underscored: true,
      timestamps: true,
    }
  );

  return WorkOrder;
}
