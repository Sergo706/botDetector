import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { getLibraryRoot, resolveDataPath } from '~~/src/botDetector/db/findDataPath.js';

describe('getLibraryRoot', () => {
  it('returns the directory that contains package.json', () => {
    const root = getLibraryRoot();
    expect(fs.existsSync(path.join(root, 'package.json'))).toBe(true);
  });

  it('walks up from a nested directory to find package.json', () => {
    const nestedDir = path.join(getLibraryRoot(), 'src', 'botDetector', 'db');
    const root = getLibraryRoot(nestedDir);
    expect(fs.existsSync(path.join(root, 'package.json'))).toBe(true);
  });

  it('throws when no package.json exists up the tree', () => {
    expect(() => getLibraryRoot('/')).toThrow('Could not find library root');
  });
});

describe('resolveDataPath', () => {
  it('resolves an existing mmdb file', () => {
    const paths =[ 
      resolveDataPath('asn.mmdb'),
      resolveDataPath('firehol_l1.mmdb'),
      resolveDataPath('tor.mmdb'),
      resolveDataPath('city.mmdb')
    ];

    for (const pathToCheck of paths) {
      expect(path.isAbsolute(pathToCheck)).toBe(true);
      expect(pathToCheck).toContain('_data-sources');
      expect(fs.existsSync(pathToCheck)).toBe(true);
    }

  });

  it('finds the json file', () => {
    const paths = resolveDataPath('suffix.json')
    expect(path.isAbsolute(paths)).toBe(true);
    expect(paths).toContain('_data-sources');
    expect(fs.existsSync(paths)).toBe(true);
  })

  it('finds the useragent lmdb directory', () => {
    const paths = resolveDataPath('useragent-db/useragent.mdb')
    expect(path.isAbsolute(paths)).toBe(true);
    expect(paths).toContain('_data-sources');
    expect(fs.existsSync(paths)).toBe(true);
  })

  it('finds the ja4 lmdb directory', () => {
    const p = resolveDataPath('ja4-db/ja4.mdb');
    expect(path.isAbsolute(p)).toBe(true);
    expect(p).toContain('_data-sources');
    expect(fs.existsSync(p)).toBe(true);
  })

  it('throws with an informative message when the file does not exist', () => {
    expect(() => resolveDataPath('nonexistent.mmdb')).toThrow(
      '[Bot Detector] Data file "nonexistent.mmdb" not found'
    );
  });
});