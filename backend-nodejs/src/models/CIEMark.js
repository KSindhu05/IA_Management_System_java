const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('./Student');
const Subject = require('./Subject');

const CIEMark = sequelize.define('CIEMark', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    marks: {
        type: DataTypes.DOUBLE
    },
    cieType: {
        type: DataTypes.STRING,
        field: 'cie_type',
        defaultValue: 'CIE1'
    },
    maxMarks: {
        type: DataTypes.DOUBLE,
        field: 'max_marks'
    },
    attendance: {
        type: DataTypes.INTEGER
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'PENDING'
    },
    studentId: {
        type: DataTypes.BIGINT,
        field: 'student_id',
        references: {
            model: 'students',
            key: 'id'
        }
    },
    subjectId: {
        type: DataTypes.BIGINT,
        field: 'subject_id',
        references: {
            model: 'subjects',
            key: 'id'
        }
    }
}, {
    tableName: 'cie_marks',
    timestamps: false
});

// Relationships
CIEMark.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
CIEMark.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
Student.hasMany(CIEMark, { foreignKey: 'studentId', as: 'marks' });
Subject.hasMany(CIEMark, { foreignKey: 'subjectId', as: 'marks' });

module.exports = CIEMark;
