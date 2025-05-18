/**
 * Migration for creating users table
 * @param {import('sequelize').QueryInterface} queryInterface
 * @param {import('sequelize').DataTypes} Sequelize
 */
export const up = async (queryInterface, Sequelize) => {
  await queryInterface.createTable('users', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: Sequelize.STRING(255),
      allowNull: false
    },
    firstName: {
      type: Sequelize.STRING(100),
      allowNull: false,
      field: 'first_name'
    },
    lastName: {
      type: Sequelize.STRING(100),
      allowNull: false,
      field: 'last_name'
    },
    role: {
      type: Sequelize.ENUM('admin', 'user'),
      defaultValue: 'user',
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active',
      allowNull: false
    },
    lastLoginAt: {
      type: Sequelize.DATE,
      field: 'last_login_at'
    },
    emailVerifiedAt: {
      type: Sequelize.DATE,
      field: 'email_verified_at'
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
      field: 'created_at'
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
      field: 'updated_at'
    },
    deletedAt: {
      type: Sequelize.DATE,
      field: 'deleted_at'
    }
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    indexes: [
      {
        unique: true,
        fields: ['email'],
        where: {
          deletedAt: null
        }
      },
      {
        fields: ['role']
      },
      {
        fields: ['status']
      }
    ]
  });
};

/**
 * Migration for dropping users table
 * @param {import('sequelize').QueryInterface} queryInterface
 */
export const down = async (queryInterface) => {
  await queryInterface.dropTable('users');
}; 