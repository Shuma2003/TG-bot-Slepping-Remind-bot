// scheduler.js
import cron from 'node-cron'; // Для планирования задач по расписанию
import { readDB } from './sleepTrackerDB.js'; // Импортируем readDB из sleepTrackerDB.js

// Это будет функция, которую Telegraf передаст сюда для отправки сообщений
let botInstance = null;

// Инициализируем планировщик с инстансом бота
export function initScheduler(bot) {
    botInstance = bot;
    console.log('Планировщик инициализирован. Запуск проверки уведомлений каждую минуту.');

    // Планируем задачу, которая будет выполняться каждую минуту
    cron.schedule('* * * * *', async () => {
        // console.log('Планировщик: Проверка уведомлений...');
        await checkAndSendNotifications();
    });
}

async function checkAndSendNotifications() {
    if (!botInstance) {
        console.error('Bot instance is not set in scheduler.');
        return;
    }

    const db = await readDB();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (const userId in db) {
        const userSettings = db[userId];
        if (!userSettings.sleep_time || !userSettings.wake_up_time || userSettings.offset === undefined) {
            continue; // Пропускаем пользователей без полных настроек
        }

        const [sleepHour, sleepMinute] = userSettings.sleep_time.split(':').map(Number);
        const [wakeUpHour, wakeUpMinute] = userSettings.wake_up_time.split(':').map(Number);
        const offset = userSettings.offset;

        // --- Уведомление о времени сна ---
        // Вычисляем время для уведомления до сна
        let notificationSleepTime = new Date();
        notificationSleepTime.setHours(sleepHour, sleepMinute, 0, 0);
        notificationSleepTime.setMinutes(notificationSleepTime.getMinutes() - offset);

        if (notificationSleepTime.getHours() === currentHour && notificationSleepTime.getMinutes() === currentMinute) {
            try {
                await botInstance.telegram.sendMessage(userId, 'Пора спать!');
                console.log(`Уведомление о сне отправлено для ${userId} в ${currentHour}:${currentMinute}`);
            } catch (error) {
                console.error(`Ошибка при отправке уведомления о сне для ${userId}:`, error.message);
                // Можно добавить логику для отписки, если пользователь заблокировал бота
            }
        }

        // --- Уведомление о пробуждении ---
        if (wakeUpHour === currentHour && wakeUpMinute === currentMinute) {
            try {
                await botInstance.telegram.sendMessage(userId, 'Доброе утро, пора вставать!');
                console.log(`Уведомление о пробуждении отправлено для ${userId} в ${currentHour}:${currentMinute}`);
            } catch (error) {
                console.error(`Ошибка при отправке уведомления о пробуждении для ${userId}:`, error.message);
            }
        }
    }
}
