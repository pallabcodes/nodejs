// import { z } from 'zod';
// import { PrismaClient } from '@prisma/client';
// import { Sequelize } from 'sequelize';
// import { logger } from '../utils/logger';

// // Database type enum
// export const DatabaseType = {
//   POSTGRES: 'postgres',
//   MYSQL: 'mysql',
// } as const;

// // ORM type enum
// export const ORMType = {
//   PRISMA: 'prisma',
//   SEQUELIZE: 'sequelize',
// } as const;

// // Database configuration schema
// const dbConfigSchema = z.object({
//   type: z.enum([DatabaseType.POSTGRES, DatabaseType.MYSQL]),
//   orm: z.enum([ORMType.PRISMA, ORMType.SEQUELIZE]),
//   url: z.string().url(),
//   host: z.string(),
//   port: z.number(),
//   username: z.string(),
//   password: z.string(),
//   database: z.string(),
//   logging: z.boolean().default(false),
//   pool: z.object({
//     min: z.number().default(0),
//     max: z.number().default(10),
//   }).optional(),
// });

// export type DatabaseConfig = z.infer<typeof dbConfigSchema>;

// class DatabaseManager {
//   private static instance: DatabaseManager;
//   private prismaClient: PrismaClient | null = null;
//   private sequelizeClient: Sequelize | null = null;
//   private config: DatabaseConfig;

//   private constructor(config: DatabaseConfig) {
//     this.config = config;
//   }

//   static getInstance(config: DatabaseConfig): DatabaseManager {
//     if (!DatabaseManager.instance) {
//       DatabaseManager.instance = new DatabaseManager(config);
//     }
//     return DatabaseManager.instance;
//   }

//   async connect() {
//     try {
//       if (this.config.orm === ORMType.PRISMA) {
//         await this.connectPrisma();
//       } else {
//         await this.connectSequelize();
//       }
//       logger.info(`Connected to ${this.config.type} database using ${this.config.orm}`);
//     } catch (error) {
//       logger.error('Database connection failed:', error);
//       throw error;
//     }
//   }

//   private async connectPrisma() {
//     this.prismaClient = new PrismaClient({
//       datasources: {
//         db: {
//           url: this.config.url,
//         },
//       },
//       log: this.config.logging ? ['query', 'error', 'warn'] : ['error'],
//     });
//     await this.prismaClient.$connect();
//   }

//   private async connectSequelize() {
//     const dialect = this.config.type === DatabaseType.POSTGRES ? 'postgres' : 'mysql';
//     this.sequelizeClient = new Sequelize({
//       dialect,
//       host: this.config.host,
//       port: this.config.port,
//       username: this.config.username,
//       password: this.config.password,
//       database: this.config.database,
//       logging: this.config.logging ? console.log : false,
//       pool: this.config.pool,
//     });
//     await this.sequelizeClient.authenticate();
//   }

//   getClient() {
//     if (this.config.orm === ORMType.PRISMA) {
//       if (!this.prismaClient) throw new Error('Prisma client not initialized');
//       return this.prismaClient;
//     } else {
//       if (!this.sequelizeClient) throw new Error('Sequelize client not initialized');
//       return this.sequelizeClient;
//     }
//   }

//   async disconnect() {
//     try {
//       if (this.config.orm === ORMType.PRISMA) {
//         await this.prismaClient?.$disconnect();
//       } else {
//         await this.sequelizeClient?.close();
//       }
//       logger.info('Database disconnected successfully');
//     } catch (error) {
//       logger.error('Error disconnecting from database:', error);
//       throw error;
//     }
//   }
// }

// export const createDatabaseManager = (config: DatabaseConfig) => {
//   return DatabaseManager.getInstance(config);
// };