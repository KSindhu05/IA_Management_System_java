const { User, Subject, Attendance, Announcement, Notification, Resource } = require('./src/models');
const sequelize = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function resetFaculty() {
    const t = await sequelize.transaction();
    try {
        console.log('--- Standardizing Faculty List ---\n');

        // 1. Get all faculty IDs
        const existingFaculty = await User.findAll({ where: { role: 'FACULTY' } });
        const facIds = existingFaculty.map(f => f.id);

        console.log(`Found ${facIds.length} existing faculty members to remove.`);

        for (const id of facIds) {
            // Cleanup related records
            await Subject.update({ instructorId: null, instructorName: null }, { where: { instructorId: id.toString() }, transaction: t });
            await Attendance.update({ facultyId: null }, { where: { facultyId: id }, transaction: t });
            await Announcement.update({ facultyId: null }, { where: { facultyId: id }, transaction: t });
            await Resource.update({ uploadedBy: null }, { where: { uploadedBy: id }, transaction: t });
            await Notification.destroy({ where: { userId: id }, transaction: t });

            // Delete the user
            await User.destroy({ where: { id }, transaction: t });
        }

        console.log('✓ Existing faculty cleared.');

        // 2. Create the new 4 faculty members
        const newFacultyData = [
            { username: 'faculty1', full_name: 'Faculty1', email: 'faculty1@example.com' },
            { username: 'faculty2', full_name: 'Faculty2', email: 'faculty2@example.com' },
            { username: 'faculty3', full_name: 'Faculty3', email: 'faculty3@example.com' },
            { username: 'faculty4', full_name: 'Faculty4', email: 'faculty4@example.com' }
        ];

        const password = await bcrypt.hash('password123', 10);

        for (const data of newFacultyData) {
            await User.create({
                username: data.username,
                password: password,
                role: 'FACULTY',
                fullName: data.full_name,
                email: data.email,
                department: 'CS',
                associatedId: data.username
            }, { transaction: t });
        }

        await t.commit();
        console.log('✓ Created 4 new faculty members: Faculty1, Faculty2, Faculty3, Faculty4');
        console.log('✓ All passwords set to: password123');

    } catch (error) {
        await t.rollback();
        console.error('Reset error:', error);
    } finally {
        // We don't close sequelize here if we want to finish the process naturally
        process.exit();
    }
}

resetFaculty();
