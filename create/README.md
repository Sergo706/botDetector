# @riavzon/bot-detector-create

Zero-config setup for [@riavzon/bot-detector](https://github.com/Sergo706/botDetector).
Run one command and get a fully configured bot detection middleware with all
data sources downloaded, compiled, and a SQLite database ready to go.

## Usage

Run this in the root of your Express project:

```bash
npx @riavzon/bot-detector-create
```

The command does the following:

1. Installs `@riavzon/bot-detector`, `express`, `cookie-parser`, and
   `better-sqlite3` into your project.
2. Triggers the data source installer and downloads and compiles all threat
   intelligence feeds.
3. Writes a `botDetectorConfig.ts` file at your project root with all 17
   checkers pre-configured at their default values.
4. Writes a `mainBotDetector.ts` file at your project root, a ready-to-run
   Express entry point that imports the config and mounts the middleware.
5. Runs `load-schema` to create the `visitors` and `banned` tables in a local
   `bot_detector.sqlite` file.

## What you get

`botDetectorConfig.ts` is a fully annotated configuration file. Every option
is shown explicitly so you know exactly what's active and what you can tune.

```ts
import { defineConfiguration } from '@riavzon/bot-detector';

await defineConfiguration({
    store: {
        main: {
            driver: 'sqlite',
            name: './bot_detector.sqlite',
        },
    },
    // ... all 17 checkers with default penalties
});
```

The defaults use SQLite and in-process memory cache, When you're ready for production, swap the adapters:

```ts
// MySQL
store: { main: { driver: 'mysql-pool', host: '...', user: '...', ... } }

// Redis cache
storage: { driver: 'redis', url: process.env.REDIS_URL }

// Upstash (serverless)
storage: { driver: 'upstash', url: process.env.UPSTASH_URL, token: process.env.UPSTASH_TOKEN }
```

## What you get

`mainBotDetector.ts` is a ready-to-run Express entry point. It imports the
config, mounts the middleware, and starts the server:

```ts
import './botDetectorConfig.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import { detectBots } from '@riavzon/bot-detector';

const app = express();
app.use(cookieParser());
app.use(detectBots());

app.get('/', (req, res) => {
    res.json({ banned: req.botDetection?.banned });
});

app.listen(3000);
```

## Mount the middleware

`botDetectorConfig.ts` must be imported before any routes. If you prefer to
wire it into your own entry point instead of using `mainBotDetector.ts`:

```ts
import './botDetectorConfig.js';
import { detectBots } from '@riavzon/bot-detector';
// ... rest of your app
```

## Keep data sources fresh

Threat intelligence feeds update continuously. Run a refresh at least once
every 24 hours:

```bash
npx @riavzon/bot-detector refresh
```

Add it to a cron job or a scheduled CI step to keep detection accurate.

## Requirements

- Node.js 18 or later
- npm

## License

Apache-2.0