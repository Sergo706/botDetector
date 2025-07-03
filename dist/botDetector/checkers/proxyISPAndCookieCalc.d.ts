import { BanReasonCode } from "../types/checkersTypes.js";
export declare function calculateProxyIspAndCookie(cookie: string, proxy: boolean, hosting: boolean, isp: string, org: string, as: string): {
    score: number;
    reasons: BanReasonCode[];
};
