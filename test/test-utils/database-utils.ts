import { userValidation } from "~~/src/main.js";
import { getBatchQueue, getDb } from "~~/src/botDetector/config/config.js";
import { prep } from "~~/src/botDetector/db/dialectUtils.js";
import { uid } from "./test-utils.js";
import { nowMysql } from "@utils/nowMysql.js";


export function makeVisitor(cookie: string, visitorId = uid(), overrides?: Partial<userValidation>): userValidation {
    const defaults: userValidation = {
        visitorId,
        cookie,
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
        country: 'united states',
        region: 'ca',
        regionName: 'california',
        city: 'los angeles',
        district: null,
        lat: '34.05',
        lon: '-118.24',
        timezone: 'America/Los_Angeles',
        currency: 'usd',
        isp: 'test-isp',
        org: 'AS15169',
        as: 'AS15169',
        device_type: 'desktop',
        browser: 'Chrome',
        proxy: false,
        hosting: false,
        is_bot: false,
        first_seen: nowMysql(),
        last_seen: nowMysql(),
        request_count: 1,
    };
    return { ...defaults, ...overrides };
}

export async function seedVisitor(cookie: string, ip = '127.0.0.1', overrides?: Partial<userValidation>): Promise<void> {
    await getBatchQueue().addQueue(cookie, ip, 'visitor_upsert', {
        insert: makeVisitor(cookie, uid(), { ipAddress: ip, ...overrides }),
    }, 'immediate');
}

export async function getVisitor(cookie: string): Promise<any> {
    return prep(getDb(), `SELECT * FROM visitors WHERE canary_id = ? LIMIT 1`).get(cookie);
}

export async function getBanned(cookie: string): Promise<any> {
    return prep(getDb(), `SELECT * FROM banned WHERE canary_id = ? LIMIT 1`).get(cookie);
}

export async function deleteVisitor(cookie: string): Promise<void> {
    await prep(getDb(), `DELETE FROM visitors WHERE canary_id = ?`).run(cookie);
}

export async function deleteBanned(id: string, deleteBy: 'cookie' | 'ip' = 'cookie'): Promise<void> {
    const db = getDb();
    if (deleteBy === 'ip') {
        await prep(db, `DELETE FROM banned WHERE ip_address = ?`).run(id);
        await prep(db, `DELETE FROM visitors WHERE ip_address = ?`).run(id);
    } else {
        await prep(db, `DELETE FROM banned WHERE canary_id = ?`).run(id);
    }
}

export async function seedBannedRow(ip: string, country: string, ua: string, reason: string, score: number): Promise<void> {
    const cookie = `ban-seed-${ip}`;
    const db = getDb();
    await prep(db, `INSERT IGNORE INTO visitors (canary_id, ip_address) VALUES (?, ?)`).run(cookie, ip);
    await prep(db,
        `INSERT INTO banned (canary_id, ip_address, country, user_agent, reason, score)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE country = ?, user_agent = ?, reason = ?, score = ?`
    ).run(cookie, ip, country, ua, reason, score, country, ua, reason, score);
}

export async function seedVisitorWithReputation(cookie: string, isBot: number, score: number, ip = '127.0.0.1'): Promise<void> {
    const now = nowMysql();
    await prep(getDb(),
        `INSERT INTO visitors
             (canary_id, ip_address, is_bot, suspicious_activity_score,
              browser, browserType, os, device_type, proxy, hosting, request_count, first_seen, last_seen)
         VALUES (?, ?, ?, ?, 'Chrome', 'browser', 'Windows', 'desktop', 0, 0, 3, ?, ?)
         ON DUPLICATE KEY UPDATE is_bot = ?, suspicious_activity_score = ?, first_seen = ?, last_seen = ?`
    ).run(cookie, ip, isBot, score, now, now, isBot, score, now, now);
}

export async function fullCleanup(cookie: string): Promise<void> {
    await deleteBanned(cookie);
    await deleteVisitor(cookie);
}
