/**
 * In-memory data store that mimics Sequelize model instances.
 * All existing controllers work without modification.
 */
const bcrypt = require('bcryptjs');

// Sequelize Op symbols (subset used in controllers)
const Op = {
  in: Symbol('in'),
  ne: Symbol('ne'),
  like: Symbol('like'),
  gte: Symbol('gte'),
  lte: Symbol('lte'),
  between: Symbol('between'),
  or: Symbol('or'),
  not: Symbol('not'),
};

// ─── Auto-increment id counter ───────────────────────────────────────────────
const counters = {};
const nextId = (table) => {
  counters[table] = (counters[table] || 0) + 1;
  return counters[table];
};

// ─── In-memory tables ────────────────────────────────────────────────────────
const tables = {
  users: [],
  departments: [],
  attendance: [],
  leaves: [],
  kras: [],
  goals: [],
  performance_reviews: [],
  projects: [],
  tasks: [],
  notifications: [],
  audit_logs: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const cloneRow = (row) => (row ? JSON.parse(JSON.stringify(row)) : null);

/** Match a single row against a `where` clause */
function matchesWhere(row, where) {
  if (!where) return true;
  for (const [key, val] of Object.entries(where)) {
    if (key === Op.or) {
      if (!val.some(sub => matchesWhere(row, sub))) return false;
      continue;
    }
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      for (const [op, opVal] of Object.entries(val)) {
        const rv = row[key];
        if (op === Op.in.toString() || op === Op.in) {
          if (!opVal.includes(rv)) return false;
        } else if (op === Op.ne.toString() || op === Op.ne) {
          if (rv === opVal) return false;
        } else if (op === Op.not.toString() || op === Op.not) {
          if (rv === opVal) return false;
        } else if (op === Op.gte.toString() || op === Op.gte) {
          if (!(rv >= opVal)) return false;
        } else if (op === Op.lte.toString() || op === Op.lte) {
          if (!(rv <= opVal)) return false;
        } else if (op === Op.between.toString() || op === Op.between) {
          if (!(rv >= opVal[0] && rv <= opVal[1])) return false;
        } else if (op === Op.like.toString() || op === Op.like) {
          const pattern = opVal.replace(/%/g, '.*');
          if (!new RegExp(pattern, 'i').test(String(rv || ''))) return false;
        }
      }
    } else {
      if (row[key] !== val) return false;
    }
  }
  return true;
}

/** Resolve an include option (join) for a row */
function resolveInclude(row, includeSpec) {
  if (!includeSpec || includeSpec.length === 0) return row;
  const result = { ...row };
  for (const inc of includeSpec) {
    const { model, as, attributes, where: incWhere, required } = inc;
    if (!model) continue;
    const rows = tables[model.tableName] || [];
    const fkField = model.foreignKey || (as + 'Id');

    // Determine how to find related rows
    let related;
    if (model.isHasMany) {
      related = rows.filter(r => r[model.foreignKey] === row.id && matchesWhere(r, incWhere));
      if (required && related.length === 0) return null;
      result[as] = related.map(r => pickAttrs(r, attributes));
    } else {
      // belongsTo: foreign key lives on the current row
      const fk = model.foreignKey;
      related = rows.find(r => r.id === row[fk]);
      if (required && !related) return null;
      result[as] = related ? pickAttrs(related, attributes) : null;
    }
  }
  return result;
}

function pickAttrs(row, attributes) {
  if (!row) return null;
  if (!attributes || attributes.length === 0) return { ...row };
  const out = {};
  attributes.forEach(a => { if (row[a] !== undefined) out[a] = row[a]; });
  return out;
}

// ─── Model instance wrapper ───────────────────────────────────────────────────
class ModelInstance {
  constructor(table, data) {
    this._table = table;
    Object.assign(this, data);
  }

  toJSON() {
    const out = {};
    for (const k of Object.keys(this)) {
      if (!k.startsWith('_')) out[k] = this[k];
    }
    return out;
  }

  async update(updates) {
    const rows = tables[this._table];
    const idx = rows.findIndex(r => r.id === this.id);
    if (idx !== -1) {
      Object.assign(rows[idx], updates);
      Object.assign(this, updates);
    }
    return this;
  }

  async destroy() {
    const rows = tables[this._table];
    const idx = rows.findIndex(r => r.id === this.id);
    if (idx !== -1) rows.splice(idx, 1);
  }
}

// ─── Model factory ────────────────────────────────────────────────────────────
function makeModel(tableName, defaults = {}) {
  return {
    tableName,
    foreignKey: null,
    isHasMany: false,

    _wrap(row) {
      if (!row) return null;
      return new ModelInstance(tableName, row);
    },

    _wrapAll(rows) {
      return rows.map(r => this._wrap(r));
    },

    scope(scopeName) {
      // For 'withPassword' scope, just return model as-is (password always stored)
      return this;
    },

    async findAll({ where, include, order, limit, offset, attributes } = {}) {
      let rows = tables[tableName].filter(r => matchesWhere(r, where));
      if (include) rows = rows.map(r => resolveInclude(r, include)).filter(Boolean);
      if (order) {
        rows = [...rows].sort((a, b) => {
          for (const [field, dir] of order) {
            const av = a[field], bv = b[field];
            if (av == null && bv == null) continue;
            if (av == null) return dir === 'ASC' ? 1 : -1;
            if (bv == null) return dir === 'ASC' ? -1 : 1;
            if (av < bv) return dir === 'ASC' ? -1 : 1;
            if (av > bv) return dir === 'ASC' ? 1 : -1;
          }
          return 0;
        });
      }
      if (offset) rows = rows.slice(offset);
      if (limit) rows = rows.slice(0, limit);
      if (attributes) rows = rows.map(r => pickAttrs(r, attributes));
      return this._wrapAll(rows);
    },

    async findAndCountAll(opts = {}) {
      const { where, include, order, limit, offset, attributes } = opts;
      let allRows = tables[tableName].filter(r => matchesWhere(r, where));
      if (include) allRows = allRows.map(r => resolveInclude(r, include)).filter(Boolean);
      const count = allRows.length;
      let rows = [...allRows];
      if (order) {
        rows.sort((a, b) => {
          for (const [field, dir] of order) {
            const av = a[field], bv = b[field];
            if (av < bv) return dir === 'ASC' ? -1 : 1;
            if (av > bv) return dir === 'ASC' ? 1 : -1;
          }
          return 0;
        });
      }
      if (offset) rows = rows.slice(offset);
      if (limit) rows = rows.slice(0, limit);
      if (attributes) rows = rows.map(r => pickAttrs(r, attributes));
      return { count, rows: this._wrapAll(rows) };
    },

    async findOne({ where, include, order } = {}) {
      let rows = tables[tableName].filter(r => matchesWhere(r, where));
      if (include) rows = rows.map(r => resolveInclude(r, include)).filter(Boolean);
      if (order) {
        rows.sort((a, b) => {
          for (const [field, dir] of order) {
            const av = a[field], bv = b[field];
            if (av < bv) return dir === 'ASC' ? -1 : 1;
            if (av > bv) return dir === 'ASC' ? 1 : -1;
          }
          return 0;
        });
      }
      return rows.length > 0 ? this._wrap(rows[0]) : null;
    },

    async findByPk(id, { include } = {}) {
      let row = tables[tableName].find(r => r.id === parseInt(id));
      if (!row) return null;
      if (include) row = resolveInclude(row, include);
      return row ? this._wrap(row) : null;
    },

    async create(data) {
      const now = new Date().toISOString();
      const row = { id: nextId(tableName), createdAt: now, updatedAt: now, ...defaults, ...data };
      tables[tableName].push(row);
      return this._wrap(row);
    },

    async bulkCreate(dataArr) {
      return Promise.all(dataArr.map(d => this.create(d)));
    },

    async count({ where } = {}) {
      return tables[tableName].filter(r => matchesWhere(r, where)).length;
    },

    async update(updates, { where } = {}) {
      tables[tableName].forEach(r => {
        if (matchesWhere(r, where)) Object.assign(r, updates);
      });
      return [tables[tableName].filter(r => matchesWhere(r, where)).length];
    },

    async destroy({ where } = {}) {
      const before = tables[tableName].length;
      tables[tableName] = tables[tableName].filter(r => !matchesWhere(r, where));
      return before - tables[tableName].length;
    },

    hasMany() {}, belongsTo() {}, hasOne() {},
  };
}

// ─── Create all models ────────────────────────────────────────────────────────
const User = makeModel('users', { role: 'employee', isActive: true, skills: [], education: [], refreshToken: null });
const Department = makeModel('departments', { isActive: true });
const Attendance = makeModel('attendance', { status: 'present' });
const Leave = makeModel('leaves', { status: 'pending' });
const KRA = makeModel('kras', { status: 'not_started', completionPercent: 0 });
const Goal = makeModel('goals', { status: 'pending', completionPercent: 0, category: 'performance', priority: 'medium' });
const Performance = makeModel('performance_reviews', { status: 'draft' });
const Project = makeModel('projects', { status: 'planning', priority: 'medium' });
const Task = makeModel('tasks', { status: 'todo', completionPercent: 0, priority: 'medium' });
const Notification = makeModel('notifications', { isRead: false, type: 'info' });
const AuditLog = makeModel('audit_logs', {});

// Set tableName on model objects for resolveInclude
User.tableName = 'users';
Department.tableName = 'departments';
Attendance.tableName = 'attendance';
Leave.tableName = 'leaves';
KRA.tableName = 'kras';
Goal.tableName = 'goals';
Performance.tableName = 'performance_reviews';
Project.tableName = 'projects';
Task.tableName = 'tasks';
Notification.tableName = 'notifications';
AuditLog.tableName = 'audit_logs';

// ─── Seed demo data ───────────────────────────────────────────────────────────
async function seedDemo() {
  const password = await bcrypt.hash('password123', 10);
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  const year = new Date().getFullYear();

  // Departments
  tables.departments = [
    { id: 1, name: 'Engineering', description: 'Software development', managerId: 2, isActive: true, createdAt: now, updatedAt: now },
    { id: 2, name: 'Human Resources', description: 'People ops', managerId: 3, isActive: true, createdAt: now, updatedAt: now },
    { id: 3, name: 'Marketing', description: 'Brand & growth', managerId: 4, isActive: true, createdAt: now, updatedAt: now },
    { id: 4, name: 'Finance', description: 'Accounting & budget', managerId: 2, isActive: true, createdAt: now, updatedAt: now },
  ];
  counters.departments = 4;

  // Users
  tables.users = [
    { id: 1, employeeId: 'EMP001', firstName: 'Admin', lastName: 'User', email: 'admin@company.com', password, role: 'admin', departmentId: 1, managerId: null, designation: 'System Administrator', joiningDate: '2022-01-01', phone: '+1-555-0001', isActive: true, skills: [], education: [], refreshToken: null, lastLogin: null, createdAt: now, updatedAt: now },
    { id: 2, employeeId: 'EMP002', firstName: 'Alice', lastName: 'Smith', email: 'manager@company.com', password, role: 'manager', departmentId: 1, managerId: 1, designation: 'Engineering Manager', joiningDate: '2021-03-15', phone: '+1-555-0100', isActive: true, skills: ['Leadership', 'JavaScript'], education: [], refreshToken: null, lastLogin: null, createdAt: now, updatedAt: now },
    { id: 3, employeeId: 'EMP003', firstName: 'Bob', lastName: 'Johnson', email: 'manager2@company.com', password, role: 'manager', departmentId: 2, managerId: 1, designation: 'HR Manager', joiningDate: '2021-06-01', phone: '+1-555-0101', isActive: true, skills: ['Recruitment', 'HR'], education: [], refreshToken: null, lastLogin: null, createdAt: now, updatedAt: now },
    { id: 4, employeeId: 'EMP004', firstName: 'Carol', lastName: 'Williams', email: 'manager3@company.com', password, role: 'manager', departmentId: 3, managerId: 1, designation: 'Marketing Manager', joiningDate: '2021-09-01', phone: '+1-555-0102', isActive: true, skills: ['Marketing', 'SEO'], education: [], refreshToken: null, lastLogin: null, createdAt: now, updatedAt: now },
    { id: 5, employeeId: 'EMP005', firstName: 'alice', lastName: 'smith', email: 'alice.smith@company.com', password, role: 'employee', departmentId: 1, managerId: 2, designation: 'Software Engineer', joiningDate: '2023-01-10', phone: '+1-555-0200', isActive: true, skills: ['JavaScript', 'React'], education: [], refreshToken: null, lastLogin: null, createdAt: now, updatedAt: now },
    { id: 6, employeeId: 'EMP006', firstName: 'David', lastName: 'Brown', email: 'david.brown@company.com', password, role: 'employee', departmentId: 1, managerId: 2, designation: 'Senior Engineer', joiningDate: '2022-07-01', phone: '+1-555-0201', isActive: true, skills: ['Java', 'Python'], education: [], refreshToken: null, lastLogin: null, createdAt: now, updatedAt: now },
    { id: 7, employeeId: 'EMP007', firstName: 'Emma', lastName: 'Jones', email: 'emma.jones@company.com', password, role: 'employee', departmentId: 2, managerId: 3, designation: 'HR Executive', joiningDate: '2023-03-01', phone: '+1-555-0202', isActive: true, skills: ['Communication', 'Excel'], education: [], refreshToken: null, lastLogin: null, createdAt: now, updatedAt: now },
    { id: 8, employeeId: 'EMP008', firstName: 'Frank', lastName: 'Garcia', email: 'frank.garcia@company.com', password, role: 'employee', departmentId: 3, managerId: 4, designation: 'Marketing Executive', joiningDate: '2022-11-01', phone: '+1-555-0203', isActive: true, skills: ['Social Media', 'Content'], education: [], refreshToken: null, lastLogin: null, createdAt: now, updatedAt: now },
    { id: 9, employeeId: 'EMP009', firstName: 'Grace', lastName: 'Miller', email: 'grace.miller@company.com', password, role: 'employee', departmentId: 4, managerId: 2, designation: 'Finance Analyst', joiningDate: '2023-06-01', phone: '+1-555-0204', isActive: true, skills: ['Excel', 'SQL'], education: [], refreshToken: null, lastLogin: null, createdAt: now, updatedAt: now },
    { id: 10, employeeId: 'EMP010', firstName: 'Henry', lastName: 'Davis', email: 'henry.davis@company.com', password, role: 'employee', departmentId: 1, managerId: 2, designation: 'DevOps Engineer', joiningDate: '2022-05-01', phone: '+1-555-0205', isActive: true, skills: ['Docker', 'AWS'], education: [], refreshToken: null, lastLogin: null, createdAt: now, updatedAt: now },
  ];
  counters.users = 10;

  // Attendance for last 7 weekdays for each user
  let attId = 0;
  const empIds = tables.users.map(u => u.id);
  for (let d = 7; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    const dateStr = date.toISOString().split('T')[0];
    for (const uid of empIds) {
      attId++;
      const isLate = Math.random() < 0.1;
      tables.attendance.push({
        id: attId,
        userId: uid,
        date: dateStr,
        checkIn: isLate ? '10:05:00' : '09:00:00',
        checkOut: '18:00:00',
        workingHours: isLate ? 7.9 : 9.0,
        status: isLate ? 'late' : 'present',
        notes: null,
        createdAt: now, updatedAt: now,
      });
    }
  }
  counters.attendance = attId;

  // KRAs for employees
  const kraTemplates = [
    { title: 'Complete project deliverables on time', target: '100% on-time delivery', weightage: 30 },
    { title: 'Improve code quality metrics', target: 'Reduce bugs by 20%', weightage: 25 },
    { title: 'Team collaboration & knowledge sharing', target: '4 sessions', weightage: 20 },
    { title: 'Learning and development', target: 'Complete 2 courses', weightage: 25 },
  ];
  let kraId = 0;
  for (const emp of tables.users.filter(u => u.role === 'employee')) {
    for (const t of kraTemplates) {
      kraId++;
      tables.kras.push({
        id: kraId, userId: emp.id, title: t.title, description: `Objective for ${emp.firstName}`,
        weightage: t.weightage, target: t.target, achievement: '60% achieved',
        completionPercent: 60, status: 'in_progress', quarter: 'Q3', year,
        remarks: null, assignedBy: emp.managerId, createdAt: now, updatedAt: now,
      });
    }
  }
  counters.kras = kraId;

  // Goals
  const goalTitles = ['Earn AWS certification', 'Improve presentation skills', 'Complete team project', 'Learn React.js', 'Mentor junior team member'];
  let goalId = 0;
  for (const emp of tables.users.filter(u => u.role === 'employee')) {
    for (let i = 0; i < 2; i++) {
      goalId++;
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + 3);
      tables.goals.push({
        id: goalId, userId: emp.id, title: goalTitles[goalId % goalTitles.length],
        description: 'Professional development goal', category: 'learning', priority: 'medium',
        dueDate: dueDate.toISOString().split('T')[0], completionPercent: 40, status: 'in_progress',
        assignedBy: emp.managerId, createdAt: now, updatedAt: now,
      });
    }
  }
  counters.goals = goalId;

  // Performance reviews
  let perfId = 0;
  for (const emp of tables.users.filter(u => u.role === 'employee')) {
    perfId++;
    tables.performance_reviews.push({
      id: perfId, userId: emp.id, reviewerId: emp.managerId,
      reviewType: 'annual', quarter: null, year: year - 1,
      selfRating: 4.2, managerRating: 4.0, finalScore: 4.1,
      selfAssessment: 'I performed well and met all my targets.',
      managerFeedback: 'Good performance overall.',
      strengths: 'Technical skills, punctuality', improvements: 'Documentation',
      status: 'completed', createdAt: now, updatedAt: now,
    });
  }
  counters.performance_reviews = perfId;

  // Notifications
  let notifId = 0;
  for (const user of tables.users) {
    notifId++;
    tables.notifications.push({
      id: notifId, userId: user.id, title: 'Welcome to PMS',
      message: 'Your performance management system is ready. Complete your profile to get started.',
      type: 'info', isRead: false, link: '/profile', createdAt: now, updatedAt: now,
    });
  }
  counters.notifications = notifId;

  console.log('✅ In-memory store seeded with demo data');
  console.log('  Admin:    admin@company.com    / password123');
  console.log('  Manager:  manager@company.com  / password123');
  console.log('  Employee: alice.smith@company.com / password123');
}

module.exports = {
  Op, tables, counters,
  User, Department, Attendance, Leave, KRA, Goal,
  Performance, Project, Task, Notification, AuditLog,
  seedDemo,
};
