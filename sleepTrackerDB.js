// sleepTrackerDB.js
import fs from 'fs/promises';

const DB_FILE_PATH = 'sleep_tracker_db.json';

async function readDB() {
    try {
        const data = await fs.readFile(DB_FILE_PATH, 'utf8');
        if (data.trim() === '') {
            console.log(`База данных ${DB_FILE_PATH} пуста, возвращаем пустой объект.`);
            return {};
        }
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`База данных ${DB_FILE_PATH} не найдена, создаем новую.`);
            return {};
        } else if (error instanceof SyntaxError) {
            console.error(`Ошибка парсинга JSON в файле ${DB_FILE_PATH}:`, error.message);
            return {};
        }
        throw error;
    }
}

async function writeDB(data) {
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Парсит и сохраняет время сна, время пробуждения и смещение для пользователя.
 * @param {string} userId - Уникальный идентификатор пользователя.
 * @param {string} args - Строка аргументов от пользователя (например, "23:30 07:00 60").
 * @returns {Promise<string>} Сообщение о результате операции.
 */
async function set(userId, args) {
    if (!userId) {
        return 'Ошибка: Отсутствует идентификатор пользователя.';
    }
    if (!args || args.trim() === '') {
        return 'Пожалуйста, укажите время сна, время пробуждения и смещение (например, `23:30 07:00 60`).';
    }

    const parts = args.trim().split(/\s+/);

    if (parts.length !== 3) { // Теперь ожидаем 3 аргумента
        return 'Неверный формат. Используйте: `[время_сна HH:MM] [время_пробуждения HH:MM] [смещение_минут]` (например, `23:30 07:00 60`).';
    }

    const sleepTimeString = parts[0];
    const wakeUpTimeString = parts[1]; // Новый аргумент
    const offsetString = parts[2];

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    // Валидация времени сна
    if (!timeRegex.test(sleepTimeString)) {
        return 'Неверный формат времени сна. Используйте HH:MM (например, 23:30).';
    }

    // Валидация времени пробуждения
    if (!timeRegex.test(wakeUpTimeString)) {
        return 'Неверный формат времени пробуждения. Используйте HH:MM (например, 07:00).';
    }

    const offset = parseInt(offsetString, 10);
    if (isNaN(offset) || offset < 0 || offset > 1440) {
        return 'Неверное значение смещения. Укажите число минут от 0 до 1440 (24 часа).';
    }

    try {
        const db = await readDB();

        if (!db[userId]) {
            db[userId] = {};
        }

        db[userId].sleep_time = sleepTimeString;
        db[userId].wake_up_time = wakeUpTimeString; // Сохраняем время пробуждения
        db[userId].offset = offset;

        await writeDB(db);

        // Расширенное сообщение об успешном сохранении
        return `Я запомнил! Время сна: ${sleepTimeString}, время пробуждения: ${wakeUpTimeString}, уведомление за ${offset} мин. до сна. Пришлю уведомление до/после сна.`;
    } catch (error) {
        console.error('Ошибка при сохранении настроек сна:', error);
        return 'Произошла ошибка при сохранении настроек. Пожалуйста, попробуйте еще раз.';
    }
}

// Также экспортируем readDB, так как она понадобится для планировщика
export { set, readDB };
