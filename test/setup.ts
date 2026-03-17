import { beforeAll } from "vitest";
import { configuration } from "../src/botDetector/config/config.js";
import { defaultSettings } from "./config.js";
import { ValidationContext } from "../src/botDetector/types/botDetectorTypes.js";
import { Request } from "express";

beforeAll(async () => {
    await configuration(defaultSettings);
});

export const createMockContext = (overrides: Partial<ValidationContext> = {}): ValidationContext => {
  const defaults: ValidationContext = {
    req: { get: () => '' } as unknown as Request,
    ipAddress: '127.0.0.1',
    parsedUA: {},
    geoData: {},
    cookie: '',
    proxy: { isProxy: false },
    anon: false,
    bgp: {},
    tor: {},
    threatLevel: null,
  };
  return { ...defaults, ...overrides };
};