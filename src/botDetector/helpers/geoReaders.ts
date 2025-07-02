
import { LRUCache } from "lru-cache";
import { Reader } from "@maxmind/geoip2-node";
import { GeoResponse } from "../types/geoTypes.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const asnReader     = await Reader.open(path.join(__dirname, '..', 'geoData', 'GeoLite2-ASN.mmdb'),
{ watchForUpdates: true });

export const cityReader    = await Reader.open(path.join(__dirname, '..','geoData', 'GeoLite2-City.mmdb'),
  { watchForUpdates: true });

export const countryReader = await Reader.open(path.join(__dirname, '..', 'geoData', 'GeoLite2-Country.mmdb'), 
    { watchForUpdates: true });


export const geoCache = new LRUCache<string, GeoResponse>({ max: 5_000, ttl: 1000 * 60 * 60 * 2 });
