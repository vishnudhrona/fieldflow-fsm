import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export type ConflictStatus =
  | 'PENDING'
  | 'RESOLVED_ACCEPT_SERVER'
  | 'RESOLVED_DISCARDED'
  | 'RESOLVED_REAPPLIED';

export interface WorkOrderConflictAttributes {
  id: string;
  mutationId: string;
  workOrderId: string;
  actorId?: string | null;
  actionType: string;
  localPayload: Record<string, any>;
  baseVersion?: number | null;
  serverVersion?: number | null;
  serverSnapshot?: Record<string, any> | null;
  reason: string;
  status: ConflictStatus;
  resolvedBy?: string | null;
  resolution?: string | null;
  resolvedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkOrderConflictCreationAttributes extends Optional<
  WorkOrderConflictAttributes,
  | 'id'
  | 'actorId'
  | 'baseVersion'
  | 'serverVersion'
  | 'serverSnapshot'
  | 'status'
  | 'resolvedBy'
  | 'resolution'
  | 'resolvedAt'
  | 'createdAt'
  | 'updatedAt'
> {}

export class WorkOrderConflict
  extends Model<WorkOrderConflictAttributes, WorkOrderConflictCreationAttributes>
  implements WorkOrderConflictAttributes
{
  declare id: string;
  declare mutationId: string;
  declare workOrderId: string;
  declare actorId: string | null;
  declare actionType: string;
  declare localPayload: Record<string, any>;
  declare baseVersion: number | null;
  declare serverVersion: number | null;
  declare serverSnapshot: Record<string, any> | null;
  declare reason: string;
  declare status: ConflictStatus;
  declare resolvedBy: string | null;
  declare resolution: string | null;
  declare resolvedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  WorkOrderConflict.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      mutationId: {
        type: dataTypes.STRING(255),
        allowNull: false,
        field: 'mutation_id',
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
      actorId: {
        type: dataTypes.UUID,
        allowNull: true,
        field: 'actor_id',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      actionType: {
        type: dataTypes.STRING(50),
        allowNull: false,
        field: 'action_type',
      },
      localPayload: {
        type: dataTypes.JSONB,
        allowNull: false,
        field: 'local_payload',
      },
      baseVersion: {
        type: dataTypes.INTEGER,
        allowNull: true,
        field: 'base_version',
      },
      serverVersion: {
        type: dataTypes.INTEGER,
        allowNull: true,
        field: 'server_version',
      },
      serverSnapshot: {
        type: dataTypes.JSONB,
        allowNull: true,
        field: 'server_snapshot',
      },
      reason: {
        type: dataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: dataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      resolvedBy: {
        type: dataTypes.UUID,
        allowNull: true,
        field: 'resolved_by',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      resolution: {
        type: dataTypes.STRING(50),
        allowNull: true,
      },
      resolvedAt: {
        type: dataTypes.DATE,
        allowNull: true,
        field: 'resolved_at',
      },
    },
    {
      sequelize,
      tableName: 'work_order_conflicts',
      modelName: 'WorkOrderConflict',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ['mutation_id'],
          unique: true,
          name: 'work_order_conflicts_mutation_unique',
        },
        {
          fields: ['work_order_id'],
        },
        {
          fields: ['status'],
        },
      ],
    },
  );

  return WorkOrderConflict;
};
