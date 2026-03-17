import { RowDataPacket } from "mysql2";
import { createTables } from "../src/botDetector/db/schema.js";
import { poolConnection } from "./config.js";

export async function setup() {
  console.log('Running global setup: Seeding the database...');
  process.env.NODE_ENV = 'test'
      try {
          const [rows] = await poolConnection.execute<RowDataPacket[]>(`
                SELECT * FROM user_agent_metadata LIMIT 1
            `)
          if (rows.length === 0) {
              console.log('Test Initialization: calling createTables...');
              await createTables(poolConnection);
          } 
          
      } catch (error) {
          console.error('Error in before block:', error);
          throw error
      }
}

export async function teardown() {
    await poolConnection.end();
}