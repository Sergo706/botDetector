import { BanReasonCode } from '../types/checkersTypes.js';
import { Request } from 'express';
export declare function calculateUaAndHeaderScore(req: Request): {
    score: number;
    reasons: BanReasonCode[];
};
