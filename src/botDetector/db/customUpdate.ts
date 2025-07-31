import { getPool } from "../config/dbConnection.js";
import { getLogger } from "../utils/logger.js";
import { ResultSetHeader } from 'mysql2';



interface fingerPrint {
      userAgent: string,
      ipAddress: string,
      country: string,
      region: string,
      regionName: string,
      city: string,
      district: string,
      lat: string,
      lon: string,
      timezone: string,
      currency: string,
      isp: string,
      org: string,
      as: string,
      device_type: string,
      browser: string,
      proxy: boolean,
      hosting: boolean,
      deviceVendor: string,
      deviceModel: string,
      browserType: string,
      browserVersion: string,
      os: string
}

export async function updateVisitors (data: fingerPrint, cookie: string, visitor_id: number): Promise<{success: boolean, reason?: string}> {
 const pool = getPool();
 const log = getLogger().child({service: 'BOT DETECTOR', branch: 'utils', type: 'updateVisitor'}) 

  const params = [ 
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
      data.deviceVendor,
      data.deviceModel,
      data.browserType,
      data.browserVersion,
      data.os
  ].map(value => value === undefined ? null : value);
  log.info('Updating visitors...')

  try {
      const [updateVisitor] = await pool.execute<ResultSetHeader>(`
     UPDATE visitors
         SET
          ip_address = ?,
          user_agent = ?,
          country = ?,
          region = ?,
          region_name = ?,
          city = ?,
          district = ?,
          lat = ?,
          lon = ?,
          timezone = ?,
          currency = ?,
          isp = ?,
          org = ?,
          as_org = ?,
          device_type = ?,
          browser = ?,
          proxy = ?,
          hosting = ?,
          deviceVendor = ?,
          deviceModel = ?,
          browserType = ?,
          browserVersion = ?,
          os = ?
       WHERE canary_id = ?
       AND visitor_id = ?    
         `, [...params, cookie, visitor_id])

       if (updateVisitor.affectedRows !== 1) {
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