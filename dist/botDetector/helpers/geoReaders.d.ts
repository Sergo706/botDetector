import { LRUCache } from "lru-cache";
import { GeoResponse } from "../types/geoTypes.js";
export declare const asnReader: import("@maxmind/geoip2-node").ReaderModel;
export declare const cityReader: import("@maxmind/geoip2-node").ReaderModel;
export declare const countryReader: import("@maxmind/geoip2-node").ReaderModel;
export declare const geoCache: LRUCache<string, GeoResponse, unknown>;
