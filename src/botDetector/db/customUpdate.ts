import { getLogger } from "../utils/logger.js";
import { getDb } from "../config/config.js";
import { prep } from "./dialectUtils.js";

export interface VisitorFingerPrint {
    userAgent: string;
    ipAddress: string;
    country: string;
    region: string;
    regionName: string;
    city: string;
    district: string;
    lat: string;
    lon: string;
    timezone: string;
    currency: string;
    isp: string;
    org: string;
    as: string;
    device_type: string;
    browser: string;
    proxy: boolean;
    hosting: boolean;
    deviceVendor: string;
    deviceModel: string;
    browserType: string;
    browserVersion: string;
    os: string;
}


export async function updateVisitors(
    data: VisitorFingerPrint,
    cookie: string,
    visitor_id: string,
): Promise<{ success: boolean; reason?: string }> {
    const db = getDb();
    const log = getLogger().child({ service: 'BOT DETECTOR', branch: 'customUpdate' });

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
        data.os,
    ] satisfies (string | boolean)[];

    try {
        const result = await prep(db, `
            UPDATE visitors
            SET
                user_agent = ?,
                ip_address = ?,
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
            WHERE canary_id  = ?
              AND visitor_id = ?
        `).run(...params, cookie, visitor_id);

        if (!result.success) {
            log.warn({ cookie, visitor_id }, `updateVisitors: no rows affected`);
            return { success: false, reason: `No visitor found for canary_id=${cookie} visitor_id=${visitor_id}` };
        }

        log.info({ visitor_id }, `updateVisitors: visitor updated`);
        return { success: true };
    } catch (err) {
        log.error({ err }, `updateVisitors: query failed`);
        return { success: false, reason: 'DB error — check logs for details' };
    }
}
