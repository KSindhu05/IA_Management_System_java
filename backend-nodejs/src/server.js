const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const marksRoutes = require('./routes/marks');
const subjectsRoutes = require('./routes/subjects');
const facultyRoutes = require('./routes/faculty');
const hodRoutes = require('./routes/hod');
const principalRoutes = require('./routes/principal');
const analyticsRoutes = require('./routes/analytics');
const cieRoutes = require('./routes/cie');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/principal', principalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cie', cieRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'IA Management System - Node.js Backend',
        version: '1.0.0',
        status: 'running'
    });
});

// Initialize database and start server
const PORT = process.env.PORT || 8083;

async function startServer() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✓ Database connection established');

        // Sync models (create tables if they don't exist)
        await sequelize.sync({ alter: true }); // Enable alter to update schema with new columns
        console.log('✓ Database models synchronized');

        // Start server
        app.listen(PORT, () => {
            console.log(`✓ Server running on http://localhost:${PORT}`);
            console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('✗ Unable to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
