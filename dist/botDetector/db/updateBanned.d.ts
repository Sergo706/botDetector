import type { BannedInfo } from '../types/checkersTypes.js';
export declare function updateBannedIP(cookie: string, ipAddress: string, country: string, user_agent: string, info: BannedInfo): Promise<void>;
