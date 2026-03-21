import type { IResult } from 'ua-parser-js';

export interface ParsedUAResult {
    device: string;
    deviceVendor?: string;
    deviceModel?: string;
    browser?: string;
    browserType?: string;
    browserVersion?: string;
    botAI: boolean;
    bot: boolean;
    os?: string;
    allResults: IResult;
  }
