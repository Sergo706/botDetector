import { Telegraf } from 'telegraf';
import { getConfiguration } from '../config/config.js';
  
type TgCtx = {
  bot: Telegraf;
  allowed: number;
  logChatId: number;
};

let tg: TgCtx | undefined;  

function getTelegram(): TgCtx | void{
  if (tg) return tg;

  const { storeAndTelegram } = getConfiguration();  

  if (!storeAndTelegram.telegram.enableTelegramLogger) return;

  const bot = new Telegraf(storeAndTelegram.telegram.token);

  bot.use((ctx, next: () => any) => {
    if (ctx.from?.id !== storeAndTelegram.telegram.allowedUser) return;
    return next();
  });

  bot.command('id', (ctx) => {
    ctx.reply(`Chat ID: ${ctx.chat.id}`);
  });

  tg = {
    bot,
    allowed: Number(storeAndTelegram.telegram.allowedUser),
    logChatId: Number(storeAndTelegram.telegram.chatId)
  };
  return tg;
}

  function escapeHtml(input: unknown): string {
    const text = input == null ? '' : String(input);
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  
  export async function sendLog(title: string, message: string) {
        const telegram = getTelegram(); 
         if (!telegram) return;
     
    try { 
    const header    = '<b>New Event Occurred</b>';
    const boldTitle = `<b>${escapeHtml(title)}</b>`;
    const body      = `<pre>${escapeHtml(message)}</pre>`;
  
    const text = [header, boldTitle, '', body].join('\n');
  
    return telegram.bot.telegram
      .sendMessage(telegram.logChatId, text, { parse_mode: 'HTML' })
    }catch(err) {
      console.log('Telegram Logger Error:', err)
    };
  }

