// stores/lowdbStore.js
const { Low, JSONFile } = require('lowdb');
const path = require('path');
const adapter = new JSONFile(path.join(__dirname, '..', 'sleep_db.json'));
const db = new Low(adapter);

// Инициализация (один раз при старте)
async function init() {
  await db.read();
  db.data = db.data || { users: {} };
  await db.write();
}
init();

module.exports = {
  async get(userId) {
    await db.read();
    return db.data.users[userId] || { isSleeping: false, sleepStart: null, records: [] };
  },
  async set(userId, data) {
    await db.read();
    db.data.users[userId] = data;
    await db.write();
  }
};
