import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
    process.env.DB_DATABASE || 'smartvalut',
    process.env.DB_USERNAME || 'root',
    process.env.DB_PASSWORD || 'admin#123',
    {
        host: process.env.DB_HOST || '0.0.0.0',
        dialect: process.env.DB_CONNECTION || 'mysql',
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,  
            idle: 10000      
        }
    }
);
export default sequelize;
