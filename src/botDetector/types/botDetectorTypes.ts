import { BgpRecord, TorRecord } from "@riavzon/shield-base";
import { GeoResponse } from "./geoTypes.js";
import { ParsedUAResult } from "./UAparserTypes.js";
import { Request } from 'express';


export interface ValidationContext<TCustom = Record<string, never>> {
  req: Request;
  ipAddress: string;
  parsedUA: Partial<ParsedUAResult>;
  geoData: Partial<GeoResponse>;
  cookie?: string;
  proxy: {
      isProxy: boolean;
      proxyType?: string;
  };
  anon: boolean;
  bgp: Partial<Omit<BgpRecord, 'range'>>
  tor: Partial<Omit<TorRecord, 'range'>>
  threatLevel: 1 | 2 | 3 | 4 | null;
  custom: TCustom;
}