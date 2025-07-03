import { Telegraf } from 'telegraf';
import { getBotDetectorConfig } from '../config/secret.js';
let tg;
function getTelegram() {
    if (tg)
        return tg;
    const { telegram } = getBotDetectorConfig();
    const bot = new Telegraf(telegram.token);
    bot.use((ctx, next) => {
        if (ctx.from?.id !== telegram.allowedUser)
            return;
        return next();
    });
    bot.command('id', (ctx) => {
        ctx.reply(`Chat ID: ${ctx.chat.id}`);
    });
    tg = {
        bot,
        allowed: Number(telegram.allowedUser),
        logChatId: Number(telegram.chatID)
    };
    return tg;
}
function escapeHtml(input) {
    const text = input == null ? '' : String(input);
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
export async function sendLog(title, message) {
    const { bot, logChatId } = getTelegram();
    try {
        const header = '<b>New Event Occurred</b>';
        const boldTitle = `<b>${escapeHtml(title)}</b>`;
        const body = `<pre>${escapeHtml(message)}</pre>`;
        const text = [header, boldTitle, '', body].join('\n');
        return bot.telegram
            .sendMessage(logChatId, text, { parse_mode: 'HTML' });
    }
    catch (err) {
        console.log('Telegram Logger Error:', err);
    }
    ;
}
