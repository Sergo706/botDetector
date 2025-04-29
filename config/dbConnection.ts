
import mysql from 'mysql2/promise';
import { config } from './secret.js'

 const db = await mysql.createConnection({
  host: config.db.host,
  port: config.db.port ? parseInt(config.db.port) : undefined,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  connectTimeout: 990000,
});
export default db;
console.log(`Connected to MySQL! to ${config.db.name} as ${config.db.user}`);

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port ? parseInt(config.db.port, 10) : undefined,
  user: config.db.user,
  password: config.db.password,
  database: config.db.name,
  waitForConnections: true,      
  connectionLimit: 10,          
  queueLimit: 0,             
  connectTimeout: 990000,
});

