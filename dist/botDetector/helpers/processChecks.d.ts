import { BanReasonCode } from "../types/checkersTypes.js";
export declare function processChecks(checks: Array<() => Promise<{
    score: number;
    reasons?: BanReasonCode[];
}>>, botScore: number, reasons: BanReasonCode[], phaseLabel?: string): Promise<number>;
