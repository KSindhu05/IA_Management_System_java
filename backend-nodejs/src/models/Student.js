const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    regNo: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        field: 'reg_no'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    department: {
        type: DataTypes.STRING
    },
    semester: {
        type: DataTypes.STRING
    },
    section: {
        type: DataTypes.STRING
    },
    phoneNo: {
        type: DataTypes.STRING,
        field: 'phone_no'
    },
    parentPhone: {
        type: DataTypes.STRING,
        field: 'parent_phone'
    },
    email: {
        type: DataTypes.STRING
    },
    userId: {
        type: DataTypes.BIGINT,
        field: 'user_id',
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'students',
    timestamps: false
});

// Relationships
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Student, { foreignKey: 'userId', as: 'student' });

module.exports = Student;
