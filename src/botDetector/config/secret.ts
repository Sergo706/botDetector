import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  db: {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_SECRET,
    name: process.env.DATABASE_NAME,
  },
  express: {
    server: process.env.SERVER_IP,
    port: process.env.PORT
  },

  telegram: {
    token: process.env.BOT_TOKEN,
    allowedUser: process.env.ALLOWED_USER_ID,
    chatID: process.env.LOG_CHAT_ID
  },
  logs: 'debug'
};
