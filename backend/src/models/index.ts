import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import configObject from '../config/config';
import UserModelInit from './user';
import CustomerModelInit from './customer';
import MenuModelInit from './menu';

dotenv.config();

const env = process.env.NODE_ENV || 'development';
const config = (configObject as any)[env] || configObject.development;

let sequelize: Sequelize;
if (config.use_env_variable) {
  const dbUrl = process.env[config.use_env_variable];
  if (!dbUrl) {
    throw new Error(`Environment variable ${config.use_env_variable} is not set.`);
  }
  sequelize = new Sequelize(dbUrl, config);
} else {
  sequelize = new Sequelize(config.database!, config.username!, config.password!, config);
}

const User = UserModelInit(sequelize, DataTypes);
const Customer = CustomerModelInit(sequelize, DataTypes);
const Menu = MenuModelInit(sequelize, DataTypes);

const db = {
  sequelize,
  Sequelize,
  User,
  Customer,
  Menu,
};

export { sequelize, Sequelize, User, Customer, Menu };
export default db;
