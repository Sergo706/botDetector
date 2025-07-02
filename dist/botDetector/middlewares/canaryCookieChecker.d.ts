import { Request, Response, NextFunction } from "express";
declare global {
    namespace Express {
        interface Request {
            newVisitorId?: number;
            botDetection: {
                success: boolean;
                banned: boolean;
                time: string;
                ipAddress: string;
            };
        }
    }
}
export declare const validator: (req: Request, res: Response, next: NextFunction) => Promise<void>;
