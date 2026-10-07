import { setupServer } from "msw/node";
import { MockApi } from "./core.js";
import { startDashboard } from "./dashboard.js";
import { createHandlers } from "./msw.js";
import type { ServerOptions } from "./types.js";

export * from "./types.js";
export { faker } from "@faker-js/faker";
export class NodeMockServer extends MockApi {
  private server?: ReturnType<typeof setupServer>;
  start() { const server = setupServer(...createHandlers(this)); server.listen({ onUnhandledRequest: "bypass" }); this.server = server; return this; }
  stop() { this.server?.close(); return this; }
  reset() { this.server?.resetHandlers(); return this; }
  dashboard(options?: import("./types.js").DashboardOptions) { return startDashboard(this, options); }
}
export function createNodeMockServer(options: ServerOptions = {}) { return new NodeMockServer(options); }
