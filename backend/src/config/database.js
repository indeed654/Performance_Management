// In-memory mode — no real DB connection needed
// Exposes a fake sequelize object so models don't crash on import
const EventEmitter = require('events');

class FakeSequelize extends EventEmitter {
  constructor() {
    super();
    this.models = {};
    this.dialect = { name: 'in-memory' };
  }
  authenticate() { return Promise.resolve(); }
  sync() { return Promise.resolve(); }
  define() { return null; }
  close() { return Promise.resolve(); }
  // Sequelize operators passthrough
  get Op() { return require('./memstore').Op; }
}

module.exports = new FakeSequelize();
