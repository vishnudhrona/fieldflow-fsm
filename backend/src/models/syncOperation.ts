import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export type SyncOperationState = 'PROCESSING' | 'SUCCEEDED' | 'FAILED';

export interface SyncOperationAttributes {
  id: string;
  actorId: string;
  mutationId: string;
  workOrderId?: string | null;
  operationType: string;
  requestHash: string;
  state: SyncOperationState;
  responsePayload?: Record<string, any> | null;
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date | null;
}

export interface SyncOperationCreationAttributes extends Optional<
  SyncOperationAttributes,
  'id' | 'workOrderId' | 'responsePayload' | 'completedAt' | 'createdAt' | 'updatedAt'
> {}

export class SyncOperation
  extends Model<SyncOperationAttributes, SyncOperationCreationAttributes>
  implements SyncOperationAttributes
{
  declare id: string;
  declare actorId: string;
  declare mutationId: string;
  declare workOrderId: string | null;
  declare operationType: string;
  declare requestHash: string;
  declare state: SyncOperationState;
  declare responsePayload: Record<string, any> | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare completedAt: Date | null;
}

export default (sequelize: Sequelize, dataTypes: typeof DataTypes) => {
  SyncOperation.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      actorId: {
        type: dataTypes.UUID,
        allowNull: false,
        field: 'actor_id',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      mutationId: {
        type: dataTypes.STRING(255),
        allowNull: false,
        field: 'mutation_id',
      },
      workOrderId: {
        type: dataTypes.UUID,
        allowNull: true,
        field: 'work_order_id',
      },
      operationType: {
        type: dataTypes.STRING(100),
        allowNull: false,
        field: 'operation_type',
      },
      requestHash: {
        type: dataTypes.STRING(64),
        allowNull: false,
        field: 'request_hash',
      },
      state: {
        type: dataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'PROCESSING',
      },
      responsePayload: {
        type: dataTypes.JSONB,
        allowNull: true,
        field: 'response_payload',
      },
      completedAt: {
        type: dataTypes.DATE,
        allowNull: true,
        field: 'completed_at',
      },
    },
    {
      sequelize,
      tableName: 'sync_operations',
      modelName: 'SyncOperation',
      underscored: true,
      timestamps: true,
      updatedAt: false,
      createdAt: 'created_at',
      indexes: [
        {
          fields: ['actor_id', 'mutation_id'],
          unique: true,
          name: 'sync_operations_actor_mutation_unique',
        },
        {
          fields: ['work_order_id', 'created_at'],
        },
      ],
    },
  );

  return SyncOperation;
};
