import { Model, Sequelize, DataTypes } from 'sequelize';

export interface AssetAttributes {
  id?: string;
  customerId?: string | null;
  machineName: string;
  machineType: string;
  modelName: string;
  serialNumber?: string | null;
  installationDate: string;
  notes?: string | null;
  status: boolean;
  imageUrl?: string | null;
  secondaryImageUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Asset extends Model<AssetAttributes> implements AssetAttributes {
  declare id: string;
  declare customerId: string | null;
  declare machineName: string;
  declare machineType: string;
  declare modelName: string;
  declare serialNumber: string | null;
  declare installationDate: string;
  declare notes: string | null;
  declare status: boolean;
  declare imageUrl: string | null;
  declare secondaryImageUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default function (sequelize: Sequelize, dataTypes: typeof DataTypes) {
  Asset.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      customerId: {
        type: dataTypes.UUID,
        allowNull: true,
        field: 'customer_id',
        references: {
          model: 'customers',
          key: 'id',
        },
      },
      machineName: {
        type: dataTypes.STRING(255),
        allowNull: false,
        field: 'machine_name',
        validate: {
          notEmpty: { msg: 'Machine name cannot be empty' },
        },
      },
      machineType: {
        type: dataTypes.STRING(255),
        allowNull: false,
        field: 'machine_type',
        validate: {
          notEmpty: { msg: 'Machine type cannot be empty' },
        },
      },
      modelName: {
        type: dataTypes.STRING(255),
        allowNull: false,
        field: 'model_name',
        validate: {
          notEmpty: { msg: 'Model name cannot be empty' },
        },
      },
      serialNumber: {
        type: dataTypes.STRING(255),
        allowNull: true,
        field: 'serial_number',
      },
      installationDate: {
        type: dataTypes.DATEONLY,
        allowNull: false,
        field: 'installation_date',
      },
      notes: {
        type: dataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      imageUrl: {
        type: dataTypes.TEXT,
        allowNull: true,
        field: 'image_url',
      },
      secondaryImageUrl: {
        type: dataTypes.TEXT,
        allowNull: true,
        field: 'secondary_image_url',
      },
    },
    {
      sequelize,
      modelName: 'Asset',
      tableName: 'assets',
      underscored: true,
      timestamps: true,
    }
  );

  return Asset;
}
