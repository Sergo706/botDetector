import { promises as fs } from 'node:fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'node:url';
import path from 'path';

import {
  urlListOfGoogleIPs,
  bingIPList,
  openAiIPList,
  appleIPList,
  ahrefsIPList,
  duckDuckGoIPList,
  commonCrawlerIPList,
  xAndTwitterIPList,
  facebookIPList,
  pinterestIPList,
  telegramIPList,
  semrushIPList,
} from '../db/json/urls.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const historyPath  = path.resolve(__dirname, '../db/json/ip-history.json');
const databasePath = path.resolve(__dirname, '../db/json/ip-database.json');

const providers = {
  googleips:     urlListOfGoogleIPs,
  bing:          bingIPList,
  openai:        openAiIPList,
  apple:         appleIPList,
  ahrefs:        ahrefsIPList,
  duckDuckGo:    duckDuckGoIPList,
  commonCrawler: commonCrawlerIPList,
  xAndTwitter:   xAndTwitterIPList,
  facebook:      facebookIPList,
  pinterest:     pinterestIPList,
  telegram:      telegramIPList,
  semrush:       semrushIPList,
};


const JSON_PROVIDERS = new Set([
  'googleips','bing','openai','apple','ahrefs'
]);
const SIMPLE_REGEX_PROVIDERS = new Set([
  'pinterest','duckDuckGo'
]);



const ipCidrRegex = /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:\/(?:3[0-2]|[12][0-9]|[0-9]))/g;
const ipRegexNoCidr = /(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)/g;


const execFileAsync = promisify(execFile);

async function fetchProvider(name: string, urls: string[]) {
  const raws = await Promise.all(
    urls.map(u =>
      fetch(u).then(res => {
        if (!res.ok) throw new Error(`fetch ${name} ${u} → ${res.status}`);
        return res.json();
      })
    )
  );
  return Array.isArray(raws[0]) ? raws.flat() : raws;
}

async function fetchPageWithCurl(url: string) {
  try {
    const { stdout } = await execFileAsync('curl', ['-s', url]);
    return stdout;
  } catch (err) {
    console.warn(`curl failed for ${url}: ${err}`);
    return '';
  }
}

async function fetchIPsFromDocs(urls: string[], regex: RegExp) {

  const texts = await Promise.all(urls.map(fetchPageWithCurl));

  const allMatches = texts.flatMap(txt =>
    [...txt.matchAll(new RegExp(regex, 'g'))].map(m => m[0])
  );
  return Array.from(new Set(allMatches));
}

async function appendSnapshot(filePath: string, provider: string, data: any[]) {
  let history = [];
  try {
    history = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    if (!Array.isArray(history))
      throw new Error('Expected JSON array');
  } catch (err) {
    if (err instanceof Error && (err as any).code !== 'ENOENT') throw err;
  }
  history.push({ provider, fetchedAt: new Date().toISOString(), data });
  await fs.writeFile(filePath, JSON.stringify(history, null, 2), 'utf-8');
}

async function writeJson(filePath: string, obj: Record<string, any>) {
  await fs.writeFile(filePath, JSON.stringify(obj, null, 2), 'utf-8');
  console.log(`Wrote ${filePath}`);
}

async function build() {
  const ipDb: Record<string, any[]> = {};
  for (const [name, urls] of Object.entries(providers)) {
    let data;
    if (JSON_PROVIDERS.has(name)) {
      data = await fetchProvider(name, urls);
    } else if (SIMPLE_REGEX_PROVIDERS.has(name)) {
      data = await fetchIPsFromDocs(urls, ipRegexNoCidr);
    } else {
      data = await fetchIPsFromDocs(urls, ipCidrRegex);
    }

    ipDb[name] = data;
    await appendSnapshot(historyPath, name, data);
    }
    return ipDb;
  }

  (async () => {
    try {
    const ipDb = await build();
    await writeJson(databasePath, ipDb);
    } catch (err) {
    console.error(err);
    process.exit(1);
    }
  })();
