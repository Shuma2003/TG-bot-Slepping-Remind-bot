// stores/inMemoryStore.js
const map = new Map();

module.exports = {
  async get(userId) {
    return map.get(userId) || { isSleeping: false, sleepStart: null, records: [] };
  },
  async set(userId, data) {
    map.set(userId, data);
  }
};
