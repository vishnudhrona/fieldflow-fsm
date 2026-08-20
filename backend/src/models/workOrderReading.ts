import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface WorkOrderReadingAttributes {
  id: string;
  workOrderId: string;
  userId?: string | null;
  metric: string;
  value: string;
  unit: string;
  recordedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkOrderReadingCreationAttributes extends Optional<
  WorkOrderReadingAttributes,
  'id' | 'userId' | 'recordedAt' | 'createdAt' | 'updatedAt'
> {}

export class WorkOrderReading
  extends Model<WorkOrderReadingAttributes, WorkOrderReadingCreationAttributes>
  implements WorkOrderReadingAttributes
{
  declare id: string;
  declare workOrderId: string;
  declare userId: string | null;
  declare metric: string;
  declare value: string;
  declare unit: string;
  declare recordedAt: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  WorkOrderReading.init(
    {
      id: {
        type: dataTypes.STRING(255),
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
      metric: {
        type: dataTypes.STRING(100),
        allowNull: false,
      },
      value: {
        type: dataTypes.STRING(50),
        allowNull: false,
      },
      unit: {
        type: dataTypes.STRING(20),
        allowNull: false,
      },
      recordedAt: {
        type: dataTypes.DATE,
        allowNull: false,
        defaultValue: dataTypes.NOW,
        field: 'recorded_at',
      },
    },
    {
      sequelize,
      tableName: 'work_order_readings',
      modelName: 'WorkOrderReading',
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
          fields: ['recorded_at'],
        },
      ],
    },
  );

  return WorkOrderReading;
};
