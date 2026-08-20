import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface WorkOrderHistoryAttributes {
  id: string;
  workOrderId: string;
  userId?: string | null;
  action: string;
  description: string;
  metadata?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkOrderHistoryCreationAttributes extends Optional<
  WorkOrderHistoryAttributes,
  'id' | 'userId' | 'metadata' | 'createdAt' | 'updatedAt'
> {}

export class WorkOrderHistory
  extends Model<WorkOrderHistoryAttributes, WorkOrderHistoryCreationAttributes>
  implements WorkOrderHistoryAttributes
{
  declare id: string;
  declare workOrderId: string;
  declare userId: string | null;
  declare action: string;
  declare description: string;
  declare metadata: Record<string, any> | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  WorkOrderHistory.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      workOrderId: {
        type: dataTypes.UUID,
        allowNull: false,
        field: 'work_order_id',
        references: {
          model: 'work_orders',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      userId: {
        type: dataTypes.UUID,
        allowNull: true,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      action: {
        type: dataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: dataTypes.TEXT,
        allowNull: false,
      },
      metadata: {
        type: dataTypes.JSONB,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'work_order_histories',
      modelName: 'WorkOrderHistory',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ['work_order_id'],
        },
        {
          fields: ['user_id'],
        },
        {
          fields: ['created_at'],
        },
      ],
    },
  );

  return WorkOrderHistory;
};
