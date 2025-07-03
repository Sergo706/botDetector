import { Response } from "express";
type cookies = {
    httpOnly: boolean;
    sameSite: boolean | "lax" | "strict" | "none";
    maxAge: number;
    secure: boolean;
    expires?: Date;
    domain?: string;
    path?: string;
};
export declare function makeCookie(res: Response, name: string, value: string, options: cookies): void;
export {};
