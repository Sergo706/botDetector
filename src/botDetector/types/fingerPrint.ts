export type  userValidation = {    
    cookie: string | null   
    userAgent: string
    ipAddress: string
    country: string | null
    region: string | null
    regionName: string | null
    city: string | null
    district: string | null
    lat: string  | null
    lon: string
    timezone: string | null
    currency: string | null
    isp: string | null
    org: string | null
    as: string  | null
    device_type: string | null
    browser: string | null
    proxy: boolean
    hosting: boolean
    is_bot: boolean
    first_seen: string | null
    last_seen: string | null
    request_count: number
    deviceVendor: string | 'unknown'
    deviceModel: string | 'unknown'
    browserType: string | 'unknown'
    browserVersion: string | 'unknown'
    os: string | 'unknown'
    activity_score: string | 'unknown'
    }
    
