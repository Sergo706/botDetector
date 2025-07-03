  import { Telegraf } from 'telegraf';
  import { getBotDetectorConfig } from '../config/secret.js';

let bot : any;                    

export function TelegramBotClient(): {bot: object, allowedUser: string , chatId: string} {
  if (bot) return bot;
  const { telegram } = getBotDetectorConfig();
  bot = new Telegraf(telegram.token);
  return {
    bot,
    allowedUser: telegram.allowedUser!,
    chatId: telegram.chatID!
  };
}