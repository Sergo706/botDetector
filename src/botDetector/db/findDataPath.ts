import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __moduleDir = path.dirname(fileURLToPath(import.meta.url));

export function getLibraryRoot(currentDir: string = __moduleDir): string {
  if (fs.existsSync(path.join(currentDir, 'package.json'))) {
    return currentDir;
  }
  
  const parentDir = path.resolve(currentDir, '..');
  if (parentDir === currentDir) throw new Error('Could not find library root');
  return getLibraryRoot(parentDir);
}

export function resolveDataPath(fileName: string): string | never {
  const root = getLibraryRoot();
  
  const possiblePaths = [
    path.resolve(root, '_data-sources', fileName),
    path.resolve(root, 'dist', '_data-sources', fileName),
  ];

  for (const path of possiblePaths) {
    if (fs.existsSync(path)) return path;
  }

  if (fileName !== 'banned.mmdb' && fileName !== 'highRisk.mmdb') {
    throw new Error(
      `[Bot Detector] Data file "${fileName}" not found. ` +
      `Run 'bot-detector init' to download required data files.`
    );
  }

  return '';
}
