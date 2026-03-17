import { getPool } from '../config/dbConnection.js';
import { userValidation } from '../types/fingerPrint.js';
import { ResultSetHeader } from 'mysql2';
import { getLogger } from '../utils/logger.js';

export async function updateVisitor(u: userValidation) {
  const pool = getPool()
  const log = getLogger().child({service: 'BOT DETECTOR', branch: 'db', type: 'updateVisitors'})
  const {
    visitorId,
    cookie,
    ipAddress,
    userAgent,
    country,
    region,
    regionName,
    city,
    district,
    lat,
    lon,
    timezone,
    currency,
    isp,
    org,
    as: asOrg,
    device_type,
    browser,
    proxy,
    hosting,
    is_bot,
    first_seen,
    last_seen,
    request_count,
    deviceVendor,
    deviceModel,
    browserType,
    browserVersion,
    os,
    activity_score,
  } = u;
  const params = [
    visitorId,
    cookie,
    ipAddress,
    userAgent,
    country,
    region,
    regionName,
    city,
    district,
    lat,
    lon,
    timezone,
    currency,
    isp,
    org,
    asOrg,
    device_type,
    browser,
    proxy,
    hosting,
    is_bot,
    first_seen,
    last_seen,
    request_count,
    deviceVendor,
    deviceModel,
    browserType,
    browserVersion,
    os,
    Number(activity_score) || 0,
  ].map(value => value === undefined ? null : value);
  try {
    await pool.execute<ResultSetHeader>(
      `INSERT INTO visitors (
        visitor_id,
         canary_id,
         ip_address,
         user_agent,
         country,
         region,
         region_name,
         city,
         district,
         lat,
         lon,
         timezone,
         currency,
         isp,
         org,
         as_org,
         device_type,
         browser,
         proxy,
         hosting,
         is_bot,
         first_seen,
         last_seen,
         request_count,
         deviceVendor,
         deviceModel,
         browserType,
         browserVersion,
         os,
         suspicious_activity_score
       ) VALUES (
        ${params.map(() => '?').join(', ')}
       )
       ON DUPLICATE KEY UPDATE
         ip_address                 = VALUES(ip_address),
         user_agent                 = VALUES(user_agent),
         country                    = VALUES(country),
         region                     = VALUES(region),
         region_name                = VALUES(region_name),
         city                       = VALUES(city),
         district                   = VALUES(district),
         lat                        = VALUES(lat),
         lon                        = VALUES(lon),
         timezone                   = VALUES(timezone),
         currency                   = VALUES(currency),
         isp                        = VALUES(isp),
         org                        = VALUES(org),
         as_org                     = VALUES(as_org),
         device_type                = VALUES(device_type),
         browser                    = VALUES(browser),
         proxy                      = VALUES(proxy),
         hosting                    = VALUES(hosting),
         last_seen                  = NOW(),
         request_count              = request_count + 1,
         deviceVendor               = VALUES(deviceVendor),
         deviceModel                = VALUES(deviceModel),
         browserType                = VALUES(browserType),
         browserVersion             = VALUES(browserVersion),
         os                         = VALUES(os)`,
         params
    );

    log.info(`Updated visitors table, Visitor row for canary_id=${cookie} inserted/updated successfully.`)
    return;
  } catch (err: any) {
    log.error({error: err},`ERROR UPDATING visitors TABLE`)
  }
}
