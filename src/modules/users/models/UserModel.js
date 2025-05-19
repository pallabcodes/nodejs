import bcrypt from 'bcrypt';
import { DataTypes } from 'sequelize';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email
 *         first_name:
 *           type: string
 *           description: The user's first name
 *         last_name:
 *           type: string
 *           description: The user's last name
 *         phone_number:
 *           type: string
 *           description: The user's phone number
 *         profile_photo:
 *           type: string
 *           description: URL to the user's profile photo
 *         isEmailVerified:
 *           type: boolean
 *           description: Whether the user's email is verified
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was last updated
 *       example:
 *         id: 1
 *         email: john.doe@example.com
 *         first_name: John
 *         last_name: Doe
 *         phone_number: "+1234567890"
 *         isEmailVerified: true
 *         createdAt: "2024-01-01T00:00:00.000Z"
 *         updatedAt: "2024-01-01T00:00:00.000Z"
 */

export default (sequelize, DataTypes) => {
    const User = sequelize.define('users', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        first_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: [1, 50],
            },
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        profile_photo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        token: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isEmailVerified: {
            type: DataTypes.TINYINT,
            defaultValue: 0,
            comment: '1 = Verified, 0 = Not Verified',
            allowNull: false,
        },
        resetCode: {
            type: DataTypes.STRING,
        },
        resetExpiries: {
            type: DataTypes.DATE,
        },
    }, {
        paranoid: true,
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            }
        },
    });

    // Password validation method
    User.prototype.isValidPassword = async function (password) {
        return await bcrypt.compare(password, this.password);
    };

    // Add associations if needed later
    User.associate = (models) => {
        // Add associations here when needed
        // Example: User.hasMany(models.Post, { foreignKey: 'userId' });
    };

    return User;
};
