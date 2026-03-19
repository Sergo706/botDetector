import { beforeAll } from "vitest";
import { configuration } from "../src/botDetector/config/config.js";
import { defaultSettings } from "./config.js";

beforeAll(async () => {
    await configuration(defaultSettings);
});
