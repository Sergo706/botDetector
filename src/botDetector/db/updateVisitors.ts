import { userValidation } from '../types/fingerPrint.js';
import { getLogger } from '../utils/logger.js';
import { getDb } from '../config/config.js';
import { prep, onUpsert, excluded, now } from './dialectUtils.js';

export async function updateVisitor(u: userValidation) {
  const db = getDb()
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
  const ex = (col: string) => excluded(db, col);
  const upsert = onUpsert(db, 'canary_id');
  try {
    await prep(db,
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
       ${upsert}
         ip_address = ${ex('ip_address')},
         user_agent = ${ex('user_agent')},
         country = ${ex('country')},
         region = ${ex('region')},
         region_name = ${ex('region_name')},
         city = ${ex('city')},
         district = ${ex('district')},
         lat = ${ex('lat')},
         lon = ${ex('lon')},
         timezone = ${ex('timezone')},
         currency = ${ex('currency')},
         isp = ${ex('isp')},
         org = ${ex('org')},
         as_org = ${ex('as_org')},
         device_type = ${ex('device_type')},
         browser = ${ex('browser')},
         proxy = ${ex('proxy')},
         hosting = ${ex('hosting')},
         last_seen = ${now(db)},
         request_count = request_count + 1,
         deviceVendor = ${ex('deviceVendor')},
         deviceModel = ${ex('deviceModel')},
         browserType = ${ex('browserType')},
         browserVersion = ${ex('browserVersion')},
         os = ${ex('os')}`
    ).run(...params);

    log.info(`Updated visitors table, Visitor row for canary_id=${cookie} inserted/updated successfully.`)
    return;
  } catch (err: any) {
    log.error({error: err},`ERROR UPDATING visitors TABLE`)
  }
}
