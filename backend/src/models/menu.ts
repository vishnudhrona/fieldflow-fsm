import { Model, DataTypes, type Sequelize } from 'sequelize';
import { ROLES, type Role } from '../config/constants';

export interface MenuAttributes {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number | null;
  sortOrder?: number;
  allowedRoles: Role[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Menu extends Model<MenuAttributes> implements MenuAttributes {
  declare id: string;
  declare label: string;
  declare icon: string;
  declare path: string;
  declare badge: number | null;
  declare sortOrder: number;
  declare allowedRoles: Role[];
  declare isActive: boolean;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export default function (sequelize: Sequelize, dataTypes: typeof DataTypes) {
  Menu.init(
    {
      id: {
        type: dataTypes.STRING(50),
        primaryKey: true,
        allowNull: false,
      },
      label: {
        type: dataTypes.STRING(100),
        allowNull: false,
      },
      icon: {
        type: dataTypes.STRING(50),
        allowNull: false,
      },
      path: {
        type: dataTypes.STRING(255),
        allowNull: false,
      },
      badge: {
        type: dataTypes.INTEGER,
        allowNull: true,
      },
      sortOrder: {
        type: dataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order',
      },
      allowedRoles: {
        type: dataTypes.JSONB,
        allowNull: false,
        defaultValue: [ROLES.ADMIN_DISPATCHER, ROLES.TECHNICIAN],
        field: 'allowed_roles',
      },
      isActive: {
        type: dataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
    },
    {
      sequelize,
      modelName: 'Menu',
      tableName: 'menus',
      underscored: true,
      timestamps: true,
    }
  );

  return Menu;
}
