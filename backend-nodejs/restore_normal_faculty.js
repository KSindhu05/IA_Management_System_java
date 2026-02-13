const { User, Subject, Attendance, Announcement, Notification, Resource } = require('./src/models');
const sequelize = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function restoreNormal() {
    const t = await sequelize.transaction();
    try {
        console.log('--- Restoring Normal Faculty List ---\n');

        // 1. Clear current faculty
        const currentFaculty = await User.findAll({ where: { role: 'FACULTY' } });
        const currentIds = currentFaculty.map(f => f.id);

        for (const id of currentIds) {
            await Subject.update({ instructorId: null, instructorName: null }, { where: { instructorId: id.toString() }, transaction: t });
            await Attendance.update({ facultyId: null }, { where: { facultyId: id }, transaction: t });
            await Announcement.update({ facultyId: null }, { where: { facultyId: id }, transaction: t });
            await Resource.update({ uploadedBy: null }, { where: { uploadedBy: id }, transaction: t });
            await Notification.destroy({ where: { userId: id }, transaction: t });
            await User.destroy({ where: { id }, transaction: t });
        }
        console.log('✓ Cleared temporary faculty.');

        // 2. Define Normal Faculty
        const normalFaculty = [
            { username: 'FAC001', fullName: 'Miss Manju Sree', email: 'manjusree@example.com', dept: 'CS' },
            { username: 'FAC002', fullName: 'Ramesh Gouda', email: 'ramesh@example.com', dept: 'CS' },
            { username: 'FAC003', fullName: 'Wahida Banu', email: 'wahida@example.com', dept: 'CS' },
            { username: 'FAC004', fullName: 'Nasrin Banu', email: 'nasrin@example.com', dept: 'CS' },
            { username: 'raza', fullName: 'Raza', email: 'raza@example.com', dept: 'CS' },
            { username: 'swapna', fullName: 'swapna', email: 'swapna@example.com', dept: 'CS' },
            { username: 'suma', fullName: 'suma', email: 'suma@example.com', dept: 'CS' },
            { username: 'keerthu', fullName: 'keerthu', email: 'keerthu@example.com', dept: 'CS' }
        ];

        const password = await bcrypt.hash('password', 10); // Back to original default password

        const createdUsers = [];
        for (const fac of normalFaculty) {
            const user = await User.create({
                username: fac.username,
                password: password,
                role: 'FACULTY',
                department: fac.dept,
                fullName: fac.fullName,
                email: fac.email,
                associatedId: fac.username
            }, { transaction: t });
            createdUsers.push(user);
        }
        console.log('✓ Restored 8 normal faculty members.');

        // 3. Re-assign some subjects
        // Subject: CAEG (21CAEG21) -> Ramesh Gouda
        await Subject.update(
            { instructorId: createdUsers[1].id.toString(), instructorName: 'Ramesh Gouda' },
            { where: { name: { [require('sequelize').Op.like]: '%CAEG%' } }, transaction: t }
        );

        // Subject: Communication Skills / English -> Manju Sree
        await Subject.update(
            { instructorId: createdUsers[0].id.toString(), instructorName: 'Miss Manju Sree' },
            { where: { name: { [require('sequelize').Op.like]: '%Communicat%' } }, transaction: t }
        );

        await t.commit();
        console.log('✓ Subjects re-assigned to Ramesh and Manju Sree.');
        console.log('\n✅ Restore complete. Passwords reset to "password".');

    } catch (error) {
        if (t) await t.rollback();
        console.error('Restore error:', error);
    } finally {
        process.exit();
    }
}

restoreNormal();
