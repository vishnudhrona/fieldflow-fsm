import { Model, Sequelize, DataTypes } from 'sequelize';

export interface CustomerAttributes {
  id?: string;
  name: string;
  contactPerson?: string | null;
  phone: string;
  email: string;
  address: string;
  notes?: string | null;
  status: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Customer extends Model<CustomerAttributes> implements CustomerAttributes {
  declare id: string;
  declare name: string;
  declare contactPerson: string | null;
  declare phone: string;
  declare email: string;
  declare address: string;
  declare notes: string | null;
  declare status: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default function(sequelize: Sequelize, dataTypes: typeof DataTypes) {
  Customer.init(
    {
      id: {
        type: dataTypes.UUID,
        defaultValue: dataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: dataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Customer name cannot be empty' },
        },
      },
      contactPerson: {
        type: dataTypes.STRING(255),
        allowNull: true,
        field: 'contact_person',
      },
      phone: {
        type: dataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Phone number cannot be empty' },
        },
      },
      email: {
        type: dataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: { msg: 'Must be a valid email address' },
          notEmpty: { msg: 'Email cannot be empty' },
        },
      },
      address: {
        type: dataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Address cannot be empty' },
        },
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
    },
    {
      sequelize,
      modelName: 'Customer',
      tableName: 'customers',
      underscored: true,
      timestamps: true,
    }
  );

  return Customer;
}
