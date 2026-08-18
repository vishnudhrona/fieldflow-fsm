import { Model, Sequelize, DataTypes } from 'sequelize';

export interface WorkOrderChecklistAttributes {
  id?: string;
  workOrderId: string;
  taskDescription: string;
  isCompleted: boolean;
  orderIndex: number;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WorkOrderChecklist extends Model<WorkOrderChecklistAttributes> implements WorkOrderChecklistAttributes {
  declare id: string;
  declare workOrderId: string;
  declare taskDescription: string;
  declare isCompleted: boolean;
  declare orderIndex: number;
  declare completedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default function (sequelize: Sequelize, dataTypes: typeof DataTypes) {
  WorkOrderChecklist.init(
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
      },
      taskDescription: {
        type: dataTypes.STRING(500),
        allowNull: false,
        field: 'task_description',
        validate: {
          notEmpty: { msg: 'Task description cannot be empty' },
        },
      },
      isCompleted: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_completed',
      },
      orderIndex: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'order_index',
      },
      completedAt: {
        type: dataTypes.DATE,
        allowNull: true,
        field: 'completed_at',
      },
    },
    {
      sequelize,
      modelName: 'WorkOrderChecklist',
      tableName: 'work_order_checklists',
      underscored: true,
      timestamps: true,
    }
  );

  return WorkOrderChecklist;
}
