import { Model, Sequelize, DataTypes } from 'sequelize';
import { ROLES, Role } from '../config/constants';

export interface UserAttributes {
  id?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: Role;
  public phone!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function(sequelize: Sequelize, dataTypes: typeof DataTypes) {
  User.init({
    id: { 
      type: dataTypes.UUID, 
      defaultValue: dataTypes.UUIDV4, 
      primaryKey: true 
    },
    name: { 
      type: dataTypes.STRING(255), 
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name cannot be empty' }
      }
    },
    email: {
      type: dataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Must be a valid email address' },
        notEmpty: { msg: 'Email cannot be empty' }
      }
    },
    passwordHash: {
      type: dataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
      validate: {
        notEmpty: { msg: 'Password cannot be empty' }
      }
    },
    role: { 
      type: dataTypes.ENUM(...Object.values(ROLES)), 
      allowNull: false,
      validate: {
        isIn: {
          args: [Object.values(ROLES)],
          msg: `Role must be one of: ${Object.values(ROLES).join(', ')}`
        }
      }
    },
    phone: {
      type: dataTypes.STRING(50),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true
  });

  return User;
}
