require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Department, Attendance, KRA, Goal, Performance, Leave, Notification } = require('../models');

const departments = [
  { name: 'Engineering', description: 'Software development and infrastructure' },
  { name: 'Human Resources', description: 'People operations and talent management' },
  { name: 'Marketing', description: 'Brand, growth, and communications' },
  { name: 'Finance', description: 'Accounting, budgeting, and reporting' },
];

const designations = {
  Engineering: ['Software Engineer', 'Senior Engineer', 'DevOps Engineer', 'QA Engineer', 'Tech Lead'],
  'Human Resources': ['HR Executive', 'HR Manager', 'Recruiter', 'HR Analyst'],
  Marketing: ['Marketing Executive', 'Content Writer', 'SEO Analyst', 'Social Media Manager'],
  Finance: ['Finance Analyst', 'Accountant', 'Finance Manager', 'Auditor'],
};

const firstNames = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Isla', 'Jack',
  'Karen', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rachel', 'Sam', 'Tina',
  'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris',
  'Martin', 'Thompson', 'Moore', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Green'];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split('T')[0];
};

async function seed() {
  try {
    console.log('🌱 Starting database seed...');
    await sequelize.sync({ force: true });
    console.log('✅ Database synced');

    const passwordHash = await bcrypt.hash('password123', 12);

    // Create departments first (without managerId - will link after users are created)
    const deptRecords = await Department.bulkCreate(departments);
    console.log(`✅ Created ${deptRecords.length} departments`);

    // Create admin
    const admin = await User.create({
      employeeId: 'EMP001',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@company.com',
      password: passwordHash,
      role: 'admin',
      designation: 'System Administrator',
      joiningDate: '2022-01-01',
      phone: '+1-555-0001',
      isActive: true,
    });

    // Create 3 managers (one per department, 4th dept gets one of them)
    const managers = [];
    for (let i = 0; i < 3; i++) {
      const dept = deptRecords[i];
      const manager = await User.create({
        employeeId: `EMP00${i + 2}`,
        firstName: firstNames[i],
        lastName: lastNames[i],
        email: `manager${i === 0 ? '' : i + 1}@company.com`,
        password: passwordHash,
        role: 'manager',
        departmentId: dept.id,
        designation: `${dept.name} Manager`,
        joiningDate: randomDate(new Date('2021-01-01'), new Date('2022-12-31')),
        phone: `+1-555-${String(100 + i).padStart(4, '0')}`,
        isActive: true,
      });
      managers.push(manager);
      // Set department manager
      await dept.update({ managerId: manager.id });
    }
    // 4th department managed by first manager
    await deptRecords[3].update({ managerId: managers[0].id });

    console.log(`✅ Created admin + ${managers.length} managers`);

    // Create 25 employees
    const employees = [];
    for (let i = 0; i < 25; i++) {
      const dept = deptRecords[i % 4];
      const manager = managers[i % 3];
      const firstName = firstNames[i];
      const lastName = lastNames[i];
      const deptName = dept.name;

      const employee = await User.create({
        employeeId: `EMP${String(i + 5).padStart(3, '0')}`,
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`,
        password: passwordHash,
        role: 'employee',
        departmentId: dept.id,
        managerId: manager.id,
        designation: randomItem(designations[deptName] || ['Executive']),
        joiningDate: randomDate(new Date('2020-01-01'), new Date('2024-06-01')),
        phone: `+1-555-${String(200 + i).padStart(4, '0')}`,
        dateOfBirth: randomDate(new Date('1985-01-01'), new Date('2000-01-01')),
        skills: [randomItem(['JavaScript', 'Python', 'Java', 'SQL', 'Excel', 'Communication', 'Leadership'])],
        isActive: true,
      });
      employees.push(employee);
    }
    console.log(`✅ Created ${employees.length} employees`);

    // Seed attendance for last 30 days
    const allEmployees = [...managers, ...employees];
    const today = new Date();
    let attendanceCount = 0;

    for (const user of allEmployees) {
      for (let d = 30; d >= 1; d--) {
        const date = new Date(today);
        date.setDate(today.getDate() - d);
        const dayOfWeek = date.getDay();

        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const dateStr = date.toISOString().split('T')[0];
        const rand = Math.random();

        if (rand < 0.05) {
          // Absent
          await Attendance.create({ userId: user.id, date: dateStr, status: 'absent' });
        } else if (rand < 0.15) {
          // Late
          const checkIn = `${randomInt(10, 11)}:${String(randomInt(0, 59)).padStart(2, '0')}:00`;
          const checkOut = `${randomInt(18, 19)}:${String(randomInt(0, 59)).padStart(2, '0')}:00`;
          await Attendance.create({ userId: user.id, date: dateStr, checkIn, checkOut, status: 'late', workingHours: randomInt(7, 9) });
        } else {
          // Present
          const checkIn = `0${randomInt(8, 9)}:${String(randomInt(0, 29)).padStart(2, '0')}:00`;
          const checkOut = `${randomInt(17, 18)}:${String(randomInt(0, 59)).padStart(2, '0')}:00`;
          await Attendance.create({ userId: user.id, date: dateStr, checkIn, checkOut, status: 'present', workingHours: randomInt(8, 9) });
        }
        attendanceCount++;
      }
    }
    console.log(`✅ Created ${attendanceCount} attendance records`);

    // Seed KRAs
    const kraTemplates = [
      { title: 'Complete project deliverables on time', target: '100% on-time delivery', weightage: 30 },
      { title: 'Improve code quality metrics', target: 'Reduce bugs by 20%', weightage: 25 },
      { title: 'Team collaboration and knowledge sharing', target: '4 knowledge sessions', weightage: 20 },
      { title: 'Learning and development', target: 'Complete 2 courses', weightage: 25 },
    ];

    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const currentYear = new Date().getFullYear();

    for (const emp of employees.slice(0, 15)) {
      const quarter = randomItem(quarters);
      for (const template of kraTemplates) {
        await KRA.create({
          userId: emp.id,
          title: template.title,
          description: `Objective for ${emp.firstName}`,
          weightage: template.weightage,
          target: template.target,
          achievement: Math.random() > 0.5 ? `${randomInt(50, 100)}% achieved` : null,
          completionPercent: randomInt(0, 100),
          status: randomItem(['not_started', 'in_progress', 'completed', 'in_progress']),
          quarter,
          year: currentYear,
          assignedBy: emp.managerId,
        });
      }
    }
    console.log(`✅ Created KRAs`);

    // Seed Goals
    const goalTitles = [
      'Earn AWS certification', 'Improve presentation skills', 'Complete team project',
      'Learn React.js', 'Achieve sales target', 'Mentor junior team member',
    ];

    for (const emp of employees.slice(0, 20)) {
      const count = randomInt(2, 4);
      for (let i = 0; i < count; i++) {
        await Goal.create({
          userId: emp.id,
          title: randomItem(goalTitles),
          description: 'Personal goal for professional development',
          category: randomItem(['performance', 'learning', 'personal', 'team']),
          priority: randomItem(['low', 'medium', 'high']),
          dueDate: randomDate(new Date(), new Date(new Date().setMonth(new Date().getMonth() + 6))),
          completionPercent: randomInt(0, 90),
          status: randomItem(['pending', 'in_progress', 'in_progress', 'completed']),
          assignedBy: emp.managerId,
        });
      }
    }
    console.log(`✅ Created goals`);

    // Seed Performance Reviews
    for (const emp of employees.slice(0, 20)) {
      const selfRating = (randomInt(3, 5) + Math.random()).toFixed(1);
      const managerRating = (randomInt(3, 5) + Math.random()).toFixed(1);
      const finalScore = (((parseFloat(selfRating) + parseFloat(managerRating)) / 2)).toFixed(1);

      await Performance.create({
        userId: emp.id,
        reviewerId: emp.managerId,
        reviewType: 'annual',
        year: currentYear - 1,
        selfRating,
        managerRating,
        finalScore,
        selfAssessment: 'I performed well and met all my targets this year.',
        managerFeedback: 'Good performance overall with room for improvement in communication.',
        strengths: 'Technical skills, punctuality, team collaboration',
        improvements: 'Documentation, public speaking',
        status: 'completed',
      });
    }
    console.log(`✅ Created performance reviews`);

    // Seed Notifications
    for (const user of allEmployees.slice(0, 10)) {
      await Notification.create({
        userId: user.id,
        title: 'Welcome to PMS',
        message: 'Your performance management system is ready. Complete your profile to get started.',
        type: 'info',
        isRead: false,
        link: '/profile',
      });
    }
    console.log(`✅ Created notifications`);

    console.log('\n🎉 Seed completed successfully!\n');
    console.log('Login credentials:');
    console.log('  Admin:    admin@company.com    / password123');
    console.log('  Manager:  manager@company.com  / password123');
    console.log('  Employee: alice.smith@company.com / password123\n');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
