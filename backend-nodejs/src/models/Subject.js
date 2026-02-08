const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subject = sequelize.define('Subject', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING
    },
    department: {
        type: DataTypes.STRING
    },
    semester: {
        type: DataTypes.STRING
    },
    credits: {
        type: DataTypes.INTEGER
    }
}, {
    tableName: 'subjects',
    timestamps: false
});

module.exports = Subject;
