import { getBotDetectorConfig } from './secret.js';
import mysql2 from 'mysql2/promise';

let pool: mysql2.Pool;

export async function getPool() { 
  if (pool) return pool;
  const { store } = getBotDetectorConfig()
  pool = mysql2.createPool({
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
console.log(`Connected to MySQL! to ${store.name} as ${store.user}`);
return pool;
}
