import { getPool } from "../config/dbConnection.js";
import { getLogger } from "../utils/logger.js";
import { ResultSetHeader } from 'mysql2';
import { userValidation } from "../types/fingerPrint.js";


export async function updateVisitors (data: userValidation, cookie: string, visitor_id: number): Promise<{success: boolean, reason?: string}> {
 const pool = getPool();
 const log = getLogger().child({service: 'BOT DETECTOR', branch: 'utils', type: 'updateVisitor'}) 
 
  const params = [ 
      cookie,
      data.userAgent,
      data.ipAddress,
      data.country,
      data.region,
      data.regionName,
      data.city,
      data.district,
      data.lat,
      data.lon,
      data.timezone,
      data.currency,
      data.isp,
      data.org,
      data.as,
      data.device_type,
      data.browser,
      data.proxy,
      data.hosting,
      data.is_bot,
      data.first_seen,
      data.last_seen,
      data.request_count,
      data.deviceVendor,
      data.deviceModel,
      data.browserType,
      data.browserVersion,
      data.os,
      Number(data.activity_score) || 0,
  ].map(value => value === undefined ? null : value);
  log.info('Updating visitors...')

  try {
      const [update] = await pool.execute<ResultSetHeader>(`
     UPDATE visitors
         SET 
          canary_id ?,
          ip_address ?,
          user_agent ?,
          country ?,
          region ?,
          region_name ?,
          city ?,
          district ?,
          lat ?,
          lon ?,
          timezone ?,
          currency ?,
          isp ?,
          org ?,
          as_org ?,
          device_type ?,
          browser ?,
          proxy ?,
          hosting ?,
          is_bot ?,
          first_seen ?,
          last_seen ?,
          request_count ?,
          deviceVendor ?,
          deviceModel ?,
          browserType ?,
          browserVersion ?,
          os ?,
          suspicos_activity_score ?
       WHERE canary_id = ?
       AND visitor_id = ?    
         `, [...params, cookie, visitor_id])

       if (update.affectedRows !== 1) {
            log.warn(`Couldn't update visitors no rows affected`);
            return {success: false, reason: `Couldn't update visitors no rows affected`};
       };
       log.info(`Visitor ${visitor_id} updated successfully`);
      return {
        success: true
      }; 
  } catch(err) {
    log.error({err},`Error updating visitors no rows affected`)
    return { 
        success: false,
        reason: 'Error updating visitors, check logs for more information.'
    }
}

}