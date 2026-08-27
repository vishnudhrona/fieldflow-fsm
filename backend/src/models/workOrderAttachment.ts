import { Model, Sequelize, DataTypes, Op } from 'sequelize';

export interface WorkOrderAttachmentAttributes {
  id?: string;
  workOrderId: string;
  technicianId?: string | null;
  fileUrl: string;
  fileName: string;
  fileSize?: number | null;
  mimeType?: string | null;
  clientLocalId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WorkOrderAttachment extends Model<WorkOrderAttachmentAttributes> implements WorkOrderAttachmentAttributes {
  declare id: string;
  declare workOrderId: string;
  declare technicianId: string | null;
  declare fileUrl: string;
  declare fileName: string;
  declare fileSize: number | null;
  declare mimeType: string | null;
  declare clientLocalId: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default function (sequelize: Sequelize, dataTypes: typeof DataTypes) {
  WorkOrderAttachment.init(
    {
      id: {
        type: dataTypes.STRING(255),
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      workOrderId: {
        type: dataTypes.STRING(255),
        allowNull: false,
        field: 'work_order_id',
        references: {
          model: 'work_orders',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      technicianId: {
        type: dataTypes.STRING(255),
        allowNull: true,
        field: 'technician_id',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'SET NULL',
      },
      fileUrl: {
        type: dataTypes.STRING(1000),
        allowNull: false,
        field: 'file_url',
        validate: {
          notEmpty: { msg: 'File URL cannot be empty' },
        },
      },
      fileName: {
        type: dataTypes.STRING(255),
        allowNull: false,
        field: 'file_name',
      },
      fileSize: {
        type: dataTypes.INTEGER,
        allowNull: true,
        field: 'file_size',
      },
      mimeType: {
        type: dataTypes.STRING(100),
        allowNull: true,
        field: 'mime_type',
      },
      clientLocalId: {
        type: dataTypes.STRING(100),
        allowNull: true,
        field: 'client_local_id',
      },
    },
    {
      sequelize,
      modelName: 'WorkOrderAttachment',
      tableName: 'work_order_attachments',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['work_order_id'] },
        { fields: ['technician_id'] },
        {
          fields: ['work_order_id', 'client_local_id'],
          unique: true,
          name: 'idx_work_order_attachments_wo_client_local',
          where: {
            client_local_id: { [Op.ne]: null },
          },
        },
      ],
    },
  );

  return WorkOrderAttachment;
}
