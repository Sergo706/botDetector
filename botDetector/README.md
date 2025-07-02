# Bot Detector Service

## Overview
The Bot Detector Service is a sophisticated system designed to identify and classify incoming web requests as originating from humans or automated bots. It employs a multi-layered approach involving a pipeline of "cheap" (low-resource) and "heavy" (resource-intensive) checks, various caching mechanisms, and a cumulative scoring system to detect, analyze, and mitigate potentially malicious bot activity. This service is specifically developed and tested for deployment on **Linux server** environments.

## Table of Contents

- [Features](#features)
- [Platform Compatibility](#platform-compatibility)
- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
  - [Core Logic](#core-logic)
  - [Checkers](#checkers)
  - [Helpers](#helpers)
  - [Databases & GeoData](#databases--geodata)
  - [Database Operations](#database-operations)
  - [Penalties](#penalties)
  - [Caching](#caching)
  - [Middleware & Routing](#middleware--routing)
  - [Types](#types)
  - [Utilities](#utilities)
- [Configuration](#configuration)
  - [Overriding Settings](#overriding-settings)
  - [Extending Banned Countries](#extending-banned-countries)
  - [Settings Breakdown](#settings-breakdown)
- [TODOs](#todos)

## Features

- **Multi-Phase Detection Pipeline**:
  - **Phase 1 (Cheap Checks)**: Initial screening using readily available data like User-Agent strings (`badUaChecker.ts`), IP format validation (`ipValidation.ts`), basic header analysis (`headersAndUACalc.ts`), browser/device fingerprint checks (`browserTypesAneDevicesCalc.ts`), and timezone/locale consistency checks (`acceptLangMap.ts`, `timezoneMap.ts`). Includes checks for known good bot IP ranges (`goodBots.ts` via `checkBotsIps.ts`).
  - **Phase 2 (Heavy Checks)**: More intensive checks triggered if the request isn't immediately classified. Includes reverse DNS lookups for good bot domain verification (`goodBots.ts` via `checkGoodBotDomain.ts`), detailed geolocation analysis (`geoLocationCalc.ts`), behavioral rate limiting (`rateTracker.ts`), proxy/ISP/hosting detection (`proxyISPAndCookieCalc.ts`), advanced header/cipher analysis (`botDetecorHeaders.ts`, `cipherChecks.ts`), and path traversal detection (`pathTravelers.ts`).
- **Scoring System**: Assigns penalty points based on failed checks. Requests exceeding the configured `banScore` are flagged as bots. Known good bots bypass this scoring.
- **Good Bot Identification**: Uses a combination of IP range matching (`ip-database.json`) and reverse DNS lookups against known suffixes (`suffix.json`) to reliably identify legitimate crawlers (Googlebot, Bingbot, etc.) and exempt them from scoring.
- **In-Memory Caching**: Optimizes performance by caching results for DNS lookups (`dnsLookupCache.ts`), good bot IP checks (`botIpCache.ts`), rate limiting counters (`rateLimitarCache.ts`), canary cookie validation (`cannaryCache.ts`), and potentially user reputation (`reputationCache.ts`).
- **Persistent Storage**: Uses SQLite or MySQL (configurable) to store visitor data, scores, ban status, and history (`db/schema.ts`, `db/update*.ts`).
- **Extensibility**: Modular design allows adding new checkers and penalty mechanisms.
- **Configuration**: Granular control over enabled checks, score thresholds, penalty weights, database settings, and Telegram notifications via `settings.ts`.
- **Fingerprinting**: Utilizes a canary cookie (`canaryCookieChecker.ts`, `utils/cookieGenerator.ts`) for basic client fingerprinting and tracking.

## Platform Compatibility

This service relies on functionalities and dependencies optimized for **Linux**. While Node.js itself is cross-platform, specific behaviors related to network operations (like DNS lookups), file system interactions, or dependencies might differ or fail on non-Linux systems (Windows, macOS). **Deployment on Linux is strongly recommended.**

## Installation

1.  **Clone Repository**:
    ```bash
    git clone <your_repo_url>
    cd backend # Navigate into the main backend directory
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **GeoIP Databases**: Download or obtain the MaxMind GeoLite2 databases (`GeoLite2-ASN.mmdb`, `GeoLite2-City.mmdb`, `GeoLite2-Country.mmdb`) and place them in the `src/services/botDetector/geoData/` directory.
4.  **Environment Configuration**: Set up any necessary environment variables (e.g., database credentials, Telegram bot token). Consider using a `.env` file managed by a library like `dotenv`. (Note: `.env` file management is not explicitly included in this service's code).
5.  **Initial Configuration**: Review and potentially adjust default settings in `src/services/botDetector/settings.ts`. Runtime overrides are also possible (see [Configuration](#configuration)).
6.  **Database Setup**: Ensure the configured database (SQLite file path or MySQL server) is accessible and initialized. The schema is defined in `src/services/botDetector/db/schema.ts`. You might need to run initial migrations or setup scripts depending on your ORM or database strategy (not explicitly provided here).

## Usage

The bot detector is integrated into an Express application primarily through middleware associated with a specific route.

1.  **Import Route**: In your main Express application file (e.g., `src/app.ts`), import the `checkRoute` from the bot detector's routing file.
2.  **Apply Middleware**: Mount the `checkRoute` in your Express application's middleware stack. This route typically bundles the `canaryCookieChecker` middleware, which orchestrates the fingerprinting and bot detection process for incoming requests.

```typescript
// Example: src/app.ts
import express from 'express';
import cookieParser from 'cookie-parser'; // Required for cookie handling
import { config } from './config/secret.js'; // Your application's config
import checkRoute from './services/botDetector/routes/visitorLog.js'; // Import the bot detector route
import { loadUaPatterns } from './services/botDetector/checkers/badUaChecker.js'; // Utility to preload patterns
import { botDetectorSettings } from './services/botDetector/settings.js'; // Import settings function if overriding

const app = express();

// --- Runtime Configuration Example (Optional) ---
// botDetectorSettings({ banScore: 30 }); // Override settings before routes are defined
// ---------------------------------------------

// --- Essential Middleware ---
// Configure 'trust proxy' if your app is behind a reverse proxy (e.g., Nginx, Load Balancer)
// This is crucial for getting the correct client IP address via req.ip
app.set("trust proxy", "loopback, linklocal, uniquelocal"); // Adjust based on your proxy setup

app.use(express.json());
app.use(cookieParser()); // Cookie parser middleware is essential for the canary cookie

// --- Bot Detector Integration ---
// Mount the route. The middleware within this route handles detection.
app.use(checkRoute);
// -----------------------------

// --- Your Other Application Routes & Middleware ---
// app.use('/api/users', userRoutes);
// app.use('/api/products', productRoutes);
// ...
// -------------------------------------------------

const PORT = config.express.port ? parseInt(config.express.port) : 3000;
const SERVER = config.express.server || '0.0.0.0';

(async () => {
  try {
    await loadUaPatterns(); // Pre-load bad UA patterns for efficiency
    // Add database connection logic here if needed
    app.listen(PORT, SERVER, () => {
      console.log(`Express API listening on ${SERVER}:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();

```

**Key Integration Point**: The core detection logic is triggered within `src/services/botDetector/middlewares/canaryCookieChecker.ts`, which is part of the `checkRoute`. This middleware parses necessary request data (IP, UA, Geo) and calls the main `uaAndGeoBotDetector` function located in `src/services/botDetector/botDetector.ts`.

## Architecture

The service is structured modularly within `src/services/botDetector/`.

### Core Logic
- `botDetector.ts`: Contains the main `uaAndGeoBotDetector` function that orchestrates the execution of various checkers based on request data (IP, UA, Geo, Headers, Cookie) and accumulates the score.
- `settings.ts`: Defines the default configuration, types, and provides functions (`botDetectorSettings`, `addBannedCountries`) for runtime customization.

### Checkers
Located in `src/services/botDetector/checkers/`. Each file implements specific checks:
- `acceptLangMap.ts`: Checks consistency between `Accept-Language` header and IP geolocation.
- `badUaChecker.ts`: Matches User-Agent against a list of known bad patterns.
- `botDetecorHeaders.ts`: Performs advanced analysis on various HTTP headers.
- `browserTypesAneDevicesCalc.ts`: Scores based on browser, OS, and device characteristics derived from the UA string.
- `cipherChecks.ts`: (If implemented) Analyzes TLS/SSL cipher suites.
- `geoLocationCalc.ts`: Penalizes requests from banned countries or with suspicious/missing geo-data.
- `goodBots.ts`: Orchestrates IP range and DNS checks for known good bots.
- `headersAndUACalc.ts`: Basic checks on standard headers (Host, Accept, etc.) and UA properties.
- `ipValidation.ts`: Validates the format of the IP address.
- `pathTravelers.ts`: Detects potential directory traversal patterns in the request path.
- `proxyISPAndCookieCalc.ts`: Checks for proxies, hosting providers, ISP reputation, and presence/validity of the canary cookie.
- `rateTracker.ts`: Tracks request frequency per client (using canary cookie) to detect abnormally high rates.
- `timezoneMap.ts`: Checks consistency between client timezone (if available) and IP geolocation.

### Helpers
Utility functions supporting the checkers and core logic, located in `src/services/botDetector/helpers/`:
- `bannedCountries.ts`: Manages the list of banned country codes.
- `checkBotsIps.ts`: Performs IP range checks against the good bot database.
- `checkGoodBotDomain.ts`: Performs reverse DNS lookups and suffix validation for good bots.
- `geoReaders.ts`: Provides functions to read data from the MaxMind MMDB files.
- `getIPInformation.ts`: Fetches and combines ASN, City, and Country data for an IP address.
- `getIpsOfGoodBots.ts`: Extracts and prepares IP ranges from the JSON database.
- `localeCountryMap.ts`: Maps locales to countries for consistency checks.
- `normalize.ts`: Utility for data normalization (e.g., path normalization).
- `processChecks.ts`: Helper to execute an array of check functions sequentially and handle scoring/errors.
- `reputation.ts`: (Likely placeholder/future) Functions related to user reputation scoring.
- `UAparser.ts`: Parses the User-Agent string into a structured object.

### Databases & GeoData
- **JSON Data**: `src/services/botDetector/db/json/`
  - `ip-database.json`: Contains IP ranges for known good bots (Google, Bing, etc.).
  - `suffix.json`: Lists valid domain suffixes for good bot DNS verification.
  - `urls.ts`: (Purpose unclear from name, likely related to specific URL checks if implemented).
- **GeoIP Data**: `src/services/botDetector/geoData/`
  - `GeoLite2-ASN.mmdb`, `GeoLite2-City.mmdb`, `GeoLite2-Country.mmdb`: MaxMind databases for IP geolocation and ASN lookup.

### Database Operations
Functions for interacting with the persistent store (SQLite/MySQL), located in `src/services/botDetector/db/`:
- `schema.ts`: Defines the database table structure (likely using an ORM like Drizzle, TypeORM, or similar).
- `updateBanned.ts`: Updates the ban status for a visitor.
- `updateIsBot.ts`: Updates the bot classification flag for a visitor.
- `updateVisitors.ts`: Inserts or updates visitor records.
- `updateVisitorScore.ts`: Updates the accumulated bot score for a visitor.

### Penalties
Logic for handling detected bots, located in `src/services/botDetector/penalties/`:
- `banIP.ts`: Implements the action taken when a request exceeds the `banScore` (e.g., logging, updating DB).
- `temporaryBan.ts`: (Potentially placeholder/TODO) Logic for applying temporary bans.

### Caching
In-memory caches to improve performance, located in `src/services/botDetector/helpers/cache/`:
- `botIpCache.ts`: Caches good bot IP check results.
- `cannaryCache.ts`: Caches canary cookie validation results.
- `dnsLookupCache.ts`: Caches reverse DNS lookup results.
- `rateLimitarCache.ts`: Stores timestamps for rate limiting checks.
- `reputationCache.ts`: (If implemented) Caches user reputation scores.

### Middleware & Routing
Integration points with Express, located in `src/services/botDetector/`:
- `middlewares/canaryCookieChecker.ts`: The core middleware that sets/checks the canary cookie and triggers the `uaAndGeoBotDetector`.
- `routes/visitorLog.ts`: Defines the Express route (`checkRoute`) that applies the `canaryCookieChecker` middleware.

### Types
TypeScript type definitions for various modules:
- `types/botDetectorTypes.ts`
- `types/checkersTypes.ts`
- `types/fingerPrint.ts`
- `types/geoTypes.ts`
- `types/UAparserTypes.ts`

### Utilities
General utility functions:
- `utils/cookieGenerator.ts`: Generates the canary cookie value.
- `utils/telegramLogger.ts`: Sends notifications/logs via Telegram (if configured).
- Note: There are also utils at the root level (`src/utils/`) like `cryptoCookies.ts`, `dataToObject.ts` which might be used by the bot detector or the broader application.

## Configuration

Configuration is managed via `src/services/botDetector/settings.ts`. You can modify defaults directly or override them at runtime using the exported helper functions.

### Overriding Settings

Import `botDetectorSettings` early in your application startup sequence (e.g., in `src/app.ts` *before* defining routes that use the detector) to merge your custom configuration with the defaults.

```typescript
import { botDetectorSettings, settings } from './services/botDetector/settings';

// Example: Increase ban score, disable DNS checks, change a penalty
botDetectorSettings({
  banScore: 35, // Require a higher score to ban
  checks: {
    ...settings.checks, // IMPORTANT: Spread existing checks to keep other defaults
    enableDnsChecks: false, // Disable reverse DNS lookups for good bots
  },
  penalties: {
    ...settings.penalties, // IMPORTANT: Spread existing penalties
    headlessBrowser: 20, // Increase penalty for headless browsers
  }
});
```

**Key Point**: When overriding nested objects like `checks` or `penalties`, always use the spread operator (`...settings.checks`) on the default settings object to avoid accidentally removing other default values within that section.

### Extending Banned Countries

Dynamically add country codes (lowercase, ISO 3166-1 alpha-2) to the banned list at runtime.

```typescript
import { addBannedCountries } from './services/botDetector/settings';

addBannedCountries('ua'); // Ban Ukraine
addBannedCountries(['ir', 'kp']); // Ban Iran and North Korea
```

### Settings Breakdown

The `settings` object contains the following key sections:

-   `banScore` (Number): The score threshold triggering a ban.
-   `maxScore` (Number): The maximum possible score (prevents runaway scores).
-   `proxy` (Boolean): General flag, potentially used by specific proxy checks.
-   `restoredReputaionPoints` (Number): Points potentially restored for reputation (if implemented).
-   `banUnlistedBots` (Boolean): If true, may apply stricter rules or a base score to bots not on the known good list.
-   `penalties` (Object): Defines the score points added by specific checks upon detection. Contains numerous keys corresponding to different checks (e.g., `ipInvalid`, `headlessBrowser`, `bannedCountries`, `proxyDetected`, `behaviorTooFast.penalty`, etc.). Review `settings.ts` for the full list.
-   `checksTimeRateControl` (Object): Controls how often checks are run for a returning visitor (identified by cookie).
    -   `checkEveryReqest` (Boolean): Run checks on every single request if true.
    -   `checkEvery` (Number): If `checkEveryReqest` is false, run checks only if this many milliseconds have passed since the last check for this visitor.
-   `checks` (Object): Master toggles (boolean) to enable/disable major categories of checks (e.g., `enableIpChecks`, `enableGeoChecks`, `enableUaChecks`, `enableHeaderChecks`, `enableBehaviorChecks`, `enableDnsChecks`).
-   `storage` (Object): Configuration for the persistent database.
    -   `type` (String): `'sqlite'` or `'mysql'`.
    -   `sqlite` / `mysql`: Contains connection parameters (e.g., `dbName`, `host`, `user`, `password`, `port`) specific to the chosen type.
-   `telegram` (Object): Settings for Telegram bot notifications.
    -   `enabled` (Boolean): Enable/disable Telegram alerts.
    -   `botToken`, `allowedUserID`, `chatId`: API token and target chat details.

## TODOs
Based on the files present in `src/services/botDetector/TODO/`, the following features/improvements are planned:

-   **captcha.ts**: Integration of CAPTCHA challenges.
-   **honeyPot.ts**: Implementation of honeypot traps.
-   **penaltiesAdjuster.ts**: Logic for dynamic penalty adjustments.
-   **temporaryBan.ts**: Functionality for time-limited bans (file exists in `penalties/` but might be incomplete or part of TODO).
-   **unBan.ts**: Automated process for lifting temporary bans.
-   **whitelist.ts**: Mechanism to explicitly whitelist IPs, ranges, or User-Agents.

Consult `src/services/botDetector/TODO/IdeasforBotSystem.md` for further conceptual details and brainstorming.
