import bcrypt from 'bcrypt';
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';


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

export default User;
