import { Request } from 'express';
import type { ParsedUAResult } from './botDetector/types/UAparserTypes.js';
import type { GeoResponse } from './botDetector/types/geoTypes.js';
export declare function uaAndGeoBotDetector(req: Request, ipAddress: string, userAgent: string, geo: GeoResponse, parsedUA: ParsedUAResult): Promise<boolean>;
