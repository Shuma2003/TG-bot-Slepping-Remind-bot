import { Telegraf } from 'telegraf';
import { set } from './sleepTrackerDB.js';
import { initScheduler } from './scheduler.js'; // Импортируем функцию инициализации планировщика


const bot = new Telegraf('BOT_TOKEN'); // Замените на ваш настоящий токен!

bot.start((ctx) => ctx.reply('Добро пожаловать, в бот слежения вашего сна. Используйте команду /set для настройки времени сна и пробуждения. Например: `/set 23:30 07:00 60` (спать в 23:30, вставать в 07:00, уведомление за 60 минут до сна).'));

bot.command('set', async (ctx) => {
    const userId = ctx.from.id.toString();
    const messageText = ctx.message.text;

    const args = messageText.substring('/set '.length).trim();

    const response = await set(userId, args);

    ctx.reply(response);
});


// Инициализируем планировщик после запуска бота
bot.launch().then(() => {
    console.log('Бот запущен!');
    initScheduler(bot); // Передаем инстанс бота в планировщик
});

// Включение graceful shutdown для Telegraf
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
