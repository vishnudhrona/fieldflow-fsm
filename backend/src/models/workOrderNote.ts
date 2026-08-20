import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface WorkOrderNoteAttributes {
  id: string;
  workOrderId: string;
  userId?: string | null;
  content: string;
  type: 'NOTE' | 'SYSTEM';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkOrderNoteCreationAttributes extends Optional<
  WorkOrderNoteAttributes,
  'id' | 'userId' | 'type' | 'createdAt' | 'updatedAt'
> {}

export class WorkOrderNote
  extends Model<WorkOrderNoteAttributes, WorkOrderNoteCreationAttributes>
  implements WorkOrderNoteAttributes
{
  declare id: string;
  declare workOrderId: string;
  declare userId: string | null;
  declare content: string;
  declare type: 'NOTE' | 'SYSTEM';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  WorkOrderNote.init(
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
      content: {
        type: dataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: dataTypes.ENUM('NOTE', 'SYSTEM'),
        allowNull: false,
        defaultValue: 'NOTE',
      },
    },
    {
      sequelize,
      tableName: 'work_order_notes',
      modelName: 'WorkOrderNote',
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

  return WorkOrderNote;
};
