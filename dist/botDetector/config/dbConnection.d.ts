import mysql from 'mysql2/promise';
declare const db: mysql.Connection;
export default db;
export declare const pool: mysql.Pool;
