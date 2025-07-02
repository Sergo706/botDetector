export interface VisitorTrackingData {
  cookie: string | null;
  device: string;
  ipAddress: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  district: string;
  lat: string;
  lon: string;
  timezone: string;
  currency: string;
  isp: string;
  org: string;
  as: string;
  browser: string;
  proxy: boolean;
  hosting: boolean;
  is_bot: boolean;
  is_ai_bot: boolean;
  deviceVendor: string;
  deviceModel: string;
  browserType: string;
  browserVersion: string;
  os: string;
}
