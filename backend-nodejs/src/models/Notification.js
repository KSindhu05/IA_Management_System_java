const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('INFO', 'WARNING', 'ALERT', 'SUCCESS', 'MESSAGE'),
        defaultValue: 'INFO'
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    link: {
        type: DataTypes.STRING,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Categories like: MARKS, ATTENDANCE, ANNOUNCEMENT, APPROVAL'
    }
}, {
    tableName: 'notifications',
    timestamps: true
});

module.exports = Notification;
