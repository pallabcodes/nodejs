import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seeder for creating admin user
 * @param {import('sequelize').QueryInterface} queryInterface
 */
export const up = async (queryInterface) => {
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const now = new Date();

  await queryInterface.bulkInsert('users', [{
    id: uuidv4(),
    email: 'admin@smartvault.com',
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    status: 'active',
    emailVerifiedAt: now,
    createdAt: now,
    updatedAt: now
  }], {});
};

/**
 * Seeder for removing admin user
 * @param {import('sequelize').QueryInterface} queryInterface
 */
export const down = async (queryInterface) => {
  await queryInterface.bulkDelete('users', {
    email: 'admin@smartvault.com'
  }, {});
};