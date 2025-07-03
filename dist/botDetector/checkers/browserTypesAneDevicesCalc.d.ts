import { BanReasonCode } from "../types/checkersTypes.js";
export declare function calculateBrowserDetailsAndDevice(browserType: string, browserName: string, os: string, deviceType: string, deviceVendor: string, browserVersion: string, deviceModel: string): {
    score: number;
    reasons: BanReasonCode[];
};
