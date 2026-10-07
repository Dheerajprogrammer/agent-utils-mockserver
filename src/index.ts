export { MockApi } from "./core.js";
export * from "./types.js";
export { faker } from "@faker-js/faker";
import { BrowserMockServer } from "./msw.js";
import type { ServerOptions } from "./types.js";

/** Browser entry point. Call start() after registering all routes. */
export function createMockServer(options: ServerOptions = {}) { return new BrowserMockServer(options); }
