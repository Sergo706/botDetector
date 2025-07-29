import { getPool } from '../config/dbConnection.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { getLogger } from '../utils/logger.js';
import { Response, Request } from 'express';

export async function updateUsersIfExists(req: Request, res: Response): Promise<{updated: boolean}>  {
const pool = getPool()
const conn = await pool.getConnection();
const canary = req.cookies.canary_id;
const log = getLogger().child({service: 'BOT DETECTOR', branch: 'Update users'});

if (!canary) {
log.warn(`No canary id provided`);
res.status(400).json({ ok: false, error: 'Missing canary_id' });
return {updated: false};
}

try { 
 await conn.beginTransaction();
 const [rows] = await conn.execute<RowDataPacket[]>(`
    SELECT 
      users.visitor_id AS userVisitorId, 
      visitors.visitor_id AS visitorId, 
      users.id AS userId
    FROM visitors
    JOIN users ON users.visitor_id = visitors.visitor_id
    WHERE visitors.canary_id = ?
    AND visitors.is_bot != 1
    FOR UPDATE
    `,[canary])

    if (!rows || rows.length === 0) { 
       log.info(`No valid user found. aborting`)
       await conn.rollback();
       return {updated: false}; 
    }   
    
    if (rows[0].userVisitorId !== rows[0].visitorId) { 
        const [update] = await conn.execute<ResultSetHeader>(`
            UPDATE users
            SET
            users.visitor_id  = ?
            WHERE
            users.id = ?  
            `[rows[0].visitorId, rows[0].userId]);

            if (update.affectedRows !== 1) {
                log.warn(`Error updating VisitorId`)
                await conn.rollback();
                return {updated: false};
            }

            await conn.commit();
            log.info(`updated visitor id`);
            return {updated: true}
        }

  await conn.rollback();
  log.info(`visitor id's match`);
  return {updated: false}

} catch(err) {
    await conn.rollback();
    log.error({err},`error updating visitor id`);
    return {updated: false}

} finally {
    conn.release();
}

}