import { BanReasonCode } from "../types/checkersTypes.js";
export declare function calculateGeoLocation(country: string, region: string, regionName: string, lat: string, lon: string, district: string, city: string, timezone: string): {
    score: number;
    reasons: BanReasonCode[];
};
