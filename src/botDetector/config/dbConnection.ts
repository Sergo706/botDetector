import { getBotDetectorConfig } from './secret.js';
import mysql from 'mysql2/promise';

const { store } = getBotDetectorConfig()

 const db = await mysql.createConnection({
  host: store.host,
  port: store.port,
  user: store.user,
  password: store.password,
  database: store.name,
  connectTimeout: 990000,
});
export default db;
console.log(`Connected to MySQL! to ${store.name} as ${store.user}`);

export const pool = mysql.createPool({
  host: store.host,
  port: store.port,
  user: store.user,
  password: store.password,
  database: store.name,
  waitForConnections: true,      
  connectionLimit: 10,          
  queueLimit: 0,             
  connectTimeout: 990000,
});

