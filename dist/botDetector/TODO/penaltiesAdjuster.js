// // Add a script to periodically analyze the banned table and identify patterns of false positives.
// // The goal is to dynamically adjust penalties for specific reasons based on these patterns to improve detection accuracy.
// // Steps to Implement:
// // 1. Analyze False Positives:
// //    - Identify users flagged as bots but later determined to be legitimate (e.g., unbanned or exhibiting legitimate behavior).
// //    - Focus on reasons with high false positive rates (e.g., shortUserAgent, proxy).
// // 2. Adjust Penalties Dynamically:
// //    - For reasons with high false positive rates, reduce their penalty weight in the detection system.
// //    - Use historical data to fine-tune the scoring system and improve accuracy for non-banned users.
// // 3. Analyze Historical Data Periodically:
// //    - Create a script that runs periodically (e.g., daily or weekly).
// //    - Look for patterns in the banned table, such as:
// //      a) Users who were banned but later unbanned.
// //      b) Users flagged as bots but later behaved like legitimate users (e.g., high request count but no malicious activity).
// //      c) Specific reasons (e.g., shortUserAgent, proxy) associated with false positives.
// // 4. Implementation Details:
// //    - Query the banned table to track users flagged as bots but exhibiting legitimate behavior over time.
// //    - Log reasons with high false positive rates and adjust their penalties dynamically.
// //    - Optionally, notify administrators about penalty adjustments for transparency and review.
// // 5. Example Implementation:
// //    - Create a script that runs periodically (e.g., daily or weekly).
// //    - Use a database connection to query the banned table and analyze false positives.
// //    - Adjust penalties based on the analysis.
// //    - Optionally, log the adjustments and notify administrators.
// // 6. Considerations:
// //    - Ensure that the script runs efficiently and does not impact system performance.
// //    - Test the script in a staging environment before deploying it to production.
// //    - Monitor the system after deploying the script to ensure it behaves as expected.
import { pool } from "../config/dbConnection.js";
import { botDetectorSettings, settings } from "../../settings.js";
export async function adjustPenalties(cookie) {
    const query = `
    SELECT
    stats.ban_reason,
    stats.avg_score_contribution,
    stats.total_occurrences,
    stats.avg_total_ban_score,
    stats.percent_contribution,
    CASE
        WHEN stats.avg_score_contribution <= 3  THEN 'Low'
        WHEN stats.avg_score_contribution <= 6  THEN 'Medium'
        WHEN stats.avg_score_contribution <= 9  THEN 'High'
        ELSE                         'Critical'
    END AS contribution_severity
    FROM (
    SELECT
        jt.reason_key AS ban_reason,
        COUNT(*) AS total_occurrences,
        ROUND(AVG(b.score), 2) AS avg_total_ban_score,
        /* Calculate the average contribution of this specific reason */
        ROUND(
        AVG(
            CASE
            WHEN jt.reason_key = 'IP_INVALID' THEN 10
            WHEN jt.reason_key = 'BEHAVIOR_TOO_FAST' THEN 8
            WHEN jt.reason_key = 'CLI_OR_LIBRARY' THEN 10
            WHEN jt.reason_key = 'INTERNET_EXPLORER' THEN 10
            WHEN jt.reason_key = 'KALI_LINUX_OS' THEN 4
            WHEN jt.reason_key = 'SHORT_USER_AGENT' THEN 8
            WHEN jt.reason_key = 'COOKIE_MISSING' THEN 8
            WHEN jt.reason_key = 'PROXY_DETECTED' THEN 4
            WHEN jt.reason_key = 'HOSTING_DETECTED' THEN 4
            WHEN jt.reason_key = 'LOCALE_MISMATCH' THEN 4
            WHEN jt.reason_key = 'TZ_MISMATCH' THEN 3
            WHEN jt.reason_key = 'TLS_CHECK_FAILED' THEN 6
            WHEN jt.reason_key = 'HEADLESS_BROWSER_DETECTED' THEN 10
            WHEN jt.reason_key = 'HEADER_SCORE_TOO_HIGH' THEN 4
            WHEN jt.reason_key = 'PATH_TRAVELAR_FOUND' THEN 4
            WHEN jt.reason_key = 'BAD_GOOGLEBOT' THEN 10
            WHEN jt.reason_key = 'DESKTOP_WITHOUT_OS' THEN 1
            WHEN jt.reason_key = 'BROWSER_TYPE_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'BROWSER_VERSION_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'BROWSER_NAME_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'DEVICE_VENDOR_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'NO_MODEL' THEN 0.5
            WHEN jt.reason_key = 'COUNTRY_UNKNOWN' THEN 2
            WHEN jt.reason_key = 'REGION_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'LAT_LON_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'DISTRICT_UNKNOWN' THEN 0.5
            WHEN jt.reason_key = 'CITY_UNKNOWN' THEN 0.5
            WHEN jt.reason_key = 'TIMEZONE_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'ISP_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'ORG_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'BANNED_COUNTRY' THEN 10
            ELSE 1
            END
        ), 2
        ) AS avg_score_contribution,
        /* Calculate what percentage this reason contributes to total score */
        ROUND(
        AVG(
            CASE
            WHEN jt.reason_key = 'IP_INVALID' THEN 10
            WHEN jt.reason_key = 'BEHAVIOR_TOO_FAST' THEN 8
            WHEN jt.reason_key = 'CLI_OR_LIBRARY' THEN 10
            WHEN jt.reason_key = 'INTERNET_EXPLORER' THEN 10
            WHEN jt.reason_key = 'KALI_LINUX_OS' THEN 4
            WHEN jt.reason_key = 'SHORT_USER_AGENT' THEN 8
            WHEN jt.reason_key = 'COOKIE_MISSING' THEN 8
            WHEN jt.reason_key = 'PROXY_DETECTED' THEN 4
            WHEN jt.reason_key = 'HOSTING_DETECTED' THEN 4
            WHEN jt.reason_key = 'LOCALE_MISMATCH' THEN 4
            WHEN jt.reason_key = 'TZ_MISMATCH' THEN 3
            WHEN jt.reason_key = 'TLS_CHECK_FAILED' THEN 6
            WHEN jt.reason_key = 'HEADLESS_BROWSER_DETECTED' THEN 10
            WHEN jt.reason_key = 'HEADER_SCORE_TOO_HIGH' THEN 4
            WHEN jt.reason_key = 'PATH_TRAVELAR_FOUND' THEN 4
            WHEN jt.reason_key = 'BAD_GOOGLEBOT' THEN 10
            WHEN jt.reason_key = 'DESKTOP_WITHOUT_OS' THEN 1
            WHEN jt.reason_key = 'BROWSER_TYPE_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'BROWSER_VERSION_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'BROWSER_NAME_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'DEVICE_VENDOR_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'NO_MODEL' THEN 0.5
            WHEN jt.reason_key = 'COUNTRY_UNKNOWN' THEN 2
            WHEN jt.reason_key = 'REGION_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'LAT_LON_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'DISTRICT_UNKNOWN' THEN 0.5
            WHEN jt.reason_key = 'CITY_UNKNOWN' THEN 0.5
            WHEN jt.reason_key = 'TIMEZONE_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'ISP_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'ORG_UNKNOWN' THEN 1
            WHEN jt.reason_key = 'BANNED_COUNTRY' THEN 10
            ELSE 1
            END / NULLIF(b.score, 0) * 100
        ), 2
        ) AS percent_contribution
    FROM banned AS b
    JOIN JSON_TABLE(
        CASE
        WHEN JSON_VALID(b.reason)=1 THEN CAST(b.reason AS JSON)
        ELSE JSON_ARRAY()
        END,
        '$[*]' COLUMNS (
        reason_key VARCHAR(50) PATH '$'
        )
    ) AS jt ON TRUE
    WHERE jt.reason_key IN (
        'IP_INVALID','BEHAVIOR_TOO_FAST','GOOD_BOT_IDENTIFIED','BAD_GOOGLEBOT',
        'SHORT_USER_AGENT','CLI_OR_LIBRARY','KALI_LINUX_OS','INTERNET_EXPLORER',
        'COOKIE_MISSING','BANNED_COUNTRY','COUNTRY_UNKNOWN','PROXY_DETECTED',
        'HOSTING_DETECTED','TIMEZONE_UNKNOWN','ISP_UNKNOWN','REGION_UNKNOWN',
        'LAT_LON_UNKNOWN','ORG_UNKNOWN','DEVICE_TYPE_UNKNOWN','DEVICE_VENDOR_UNKNOWN',
        'BROWSER_TYPE_UNKNOWN','BROWSER_VERSION_UNKNOWN','DISTRICT_UNKNOWN','CITY_UNKNOWN',
        'OS_UNKNOWN','BROWSER_NAME_UNKNOWN','HEADLESS_BROWSER_DETECTED','LOCALE_MISMATCH',
        'TZ_MISMATCH','TLS_CHECK_FAILED','HEADER_SCORE_TOO_HIGH','META_UA_CHECK_FAILED',
        'DESKTOP_WITHOUT_OS','NO_MODEL','PATH_TRAVELAR_FOUND'
    )
    GROUP BY jt.reason_key
    ) AS stats
    ORDER BY stats.percent_contribution DESC, stats.avg_score_contribution DESC;

    `;
    const totalBanned = `
    SELECT COUNT(canary_id) FROM banned;
    `;
    const [bans] = await pool.execute(totalBanned);
    const totalBans = Number(bans[0]['COUNT(canary_id)']);
    const [analysis] = await pool.execute(query);
    analysis.forEach(({ ban_reason, avg_score_contribution, total_occurrences, avg_total_ban_score, percent_contribution, contribution_severity }) => {
        const reasonsToSkip = ban_reason === 'IP_INVALID' ||
            ban_reason === 'BAD_GOOGLEBOT' ||
            ban_reason === 'BANNED_COUNTRY' ||
            ban_reason === 'HEADLESS_BROWSER_DETECTED' ||
            ban_reason === 'CLI_OR_LIBRARY' ||
            ban_reason === 'INTERNET_EXPLORER';
        if (reasonsToSkip)
            return;
        const percentageForEachReason = parseFloat(((total_occurrences / totalBans) * 100).toFixed(2));
        const severityLevel = avg_total_ban_score > 8 && percentageForEachReason > 50 &&
            percent_contribution > 50;
        const severityLevel2 = contribution_severity;
        const reasonToSettingMap = {
            'SHORT_USER_AGENT': 'shortUserAgent',
            'BEHAVIOR_TOO_FAST': 'behaviorTooFast.behaviorPenalty',
            'COOKIE_MISSING': 'cookieMissing',
            'PROXY_DETECTED': 'proxyDetected',
            'HOSTING_DETECTED': 'hostingDetected',
            'LOCALE_MISMATCH': 'localeMismatch',
            'TZ_MISMATCH': 'tzMismatch',
            'TLS_CHECK_FAILED': 'tlsCheckFailed',
            'HEADER_SCORE_TOO_HIGH': 'headerOptions.weightPerMustHeader', // Example of deep nesting
            'PATH_TRAVELAR_FOUND': 'pathTraveler.pathLengthToLong', // Example of deep nesting
            'DESKTOP_WITHOUT_OS': 'desktopWithoutOS',
            'BROWSER_TYPE_UNKNOWN': 'browserTypeUnknown',
            'BROWSER_VERSION_UNKNOWN': 'browserVersionUnknown',
            'BROWSER_NAME_UNKNOWN': 'browserNameUnknown',
            'DEVICE_VENDOR_UNKNOWN': 'deviceVendorUnknown',
            'NO_MODEL': 'noModel',
            'COUNTRY_UNKNOWN': 'countryUnknown',
            'REGION_UNKNOWN': 'regionUnknown',
            'LAT_LON_UNKNOWN': 'latLonUnknown',
            'DISTRICT_UNKNOWN': 'districtUnknown',
            'CITY_UNKNOWN': 'cityUnknown',
            'TIMEZONE_UNKNOWN': 'timezoneUnknown',
            'ISP_UNKNOWN': 'ispUnknown',
            'ORG_UNKNOWN': 'orgUnknown',
            'KALI_LINUX_OS': 'kaliLinuxOS',
            // 'ACCEPT_HEADER_MISSING': 'headerOptions.acceptHeader.ommitedAcceptHeader',
            // 'SHORT_ACCEPT_HEADER': 'headerOptions.acceptHeader.shortAcceptHeader',
            // 'ACCEPT_IS_NULL': 'headerOptions.acceptHeader.acceptIsNULL',
        };
        const settingPath = reasonToSettingMap[ban_reason];
        if (!settingPath)
            return;
        // Calculate new penalty value based on severity
        let currentValue;
        if (settingPath.includes('.')) {
            const [objectName, propertyName] = settingPath.split('.');
            currentValue = settings.penalties[objectName][propertyName];
        }
        else {
            currentValue = settings.penalties[settingPath];
        }
        // Skip if current value is not a number
        if (typeof currentValue !== 'number')
            return;
        // Calculate new value based on severity levels
        let newValue;
        if (severityLevel) {
            // High severity - increase significantly
            newValue = Math.min(10, currentValue - 1);
        }
        else if (severityLevel2 === 'Critical' || severityLevel2 === 'High') {
            // Medium-high severity - increase slightly
            newValue = Math.min(10, currentValue + 1);
        }
        else if (severityLevel2 === 'Low') {
            // Low severity - decrease slightly
            newValue = Math.max(1, currentValue - 1);
        }
        else {
            // No change needed for medium severity
            return;
        }
        // Only update if value changed
        if (newValue === currentValue)
            return;
        // Create settings update object based on property type
        let updateObj = { penalties: {} };
        if (settingPath.includes('.')) {
            const [objectName, propertyName] = settingPath.split('.');
            updateObj.penalties[objectName] = { [propertyName]: newValue };
        }
        else {
            updateObj.penalties[settingPath] = newValue;
        }
        console.log(`Adjusting ${ban_reason} penalty from ${currentValue} to ${newValue}`);
        botDetectorSettings(updateObj);
    });
}
// // TO DO
