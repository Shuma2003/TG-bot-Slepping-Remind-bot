// rest.js
/**
 * Сбрасывает запись сна для пользователя.
 *
 * @param {Object} params
 * @param {number} params.userId - Telegram user id
 * @param {Object} params.store - объект хранения с методами get(userId) и set(userId, data)
 * @param {Object} [params.ctx] - (опционально) Telegraf ctx для отправки ответа
 * @param {boolean} [params.preserveRecords=false] - если true, сохраняет историю records, сбрасывает только текущее состояние
 * @returns {Promise<{ok: boolean, message: string, removedCount?: number}>}
 */
async function rest({ userId, store, ctx, preserveRecords = false }) {
  if (!userId) throw new Error('userId required');
  if (!store || typeof store.get !== 'function' || typeof store.set !== 'function') {
    throw new Error('store должен реализовывать async get(userId) и async set(userId, data)');
  }

  // Получаем текущее состояние (если нет — инициализируем)
  const current = (await store.get(userId)) || { isSleeping: false, sleepStart: null, records: [] };

  // Считаем сколько записей будет удалено (если чистим)
  const removedCount = (!preserveRecords && Array.isArray(current.records)) ? current.records.length : 0;

  const defaultState = { isSleeping: false, sleepStart: null, records: [] };

  const newState = preserveRecords
    ? { ...current, isSleeping: false, sleepStart: null } // сохраняем records
    : defaultState;

  await store.set(userId, newState);

  const message = preserveRecords
    ? 'Текущее состояние сна сброшено. История записей сохранена.'
    : `Запись сна полностью сброшена. Удалено записей: ${removedCount}.`;

  if (ctx && typeof ctx.reply === 'function') {
    await ctx.reply(message);
  }

  return { ok: true, message, removedCount };
}

module.exports = { rest };
