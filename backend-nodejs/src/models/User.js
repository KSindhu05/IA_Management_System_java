const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('STUDENT', 'FACULTY', 'HOD', 'PRINCIPAL'),
        allowNull: false
    },
    associatedId: {
        type: DataTypes.STRING,
        field: 'associated_id'
    },
    department: {
        type: DataTypes.STRING
    },
    fullName: {
        type: DataTypes.STRING,
        field: 'full_name'
    },
    email: {
        type: DataTypes.STRING
    }
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = User;
