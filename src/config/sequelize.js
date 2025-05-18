import dotenv from 'dotenv';
import { createDatabaseConfig } from './database.js';

dotenv.config();

const environment = process.env.NODE_ENV || 'development';
const config = createDatabaseConfig(environment);

export default {
  [environment]: {
    ...config,
    migrationStorageTableName: 'sequelize_meta',
    seederStorageTableName: 'sequelize_data'
  }
}; 