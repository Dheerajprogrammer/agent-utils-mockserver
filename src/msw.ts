import { delay, http, HttpResponse, passthrough } from "msw";
import { METHODS, MockApi } from "./core.js";
import type { ServerOptions } from "./types.js";

export function createHandlers(api: MockApi) {
  return METHODS.map(method => http[method.toLowerCase() as "get"]("*", async ({ request }) => {
    const url = new URL(request.url);
    if (!api.shouldMock(method, url.pathname)) return passthrough();
    const route = api.find(method, url.pathname);
    if (!route) return HttpResponse.json({ message: `No mock route for ${method} ${url.pathname}` }, { status: 404 });
    const result = await api.execute(route, request);
    if (result.timeout) return new Promise<Response>(() => {});
    if (result.delay) await delay(result.delay);
    const headers = new Headers(result.headers);
    if (result.body === undefined) return new HttpResponse(null, { status: result.status ?? 204, headers });
    return HttpResponse.json(result.body, { status: result.status ?? 200, headers });
  }));
}

export class BrowserMockServer extends MockApi {
  private worker?: import("msw/browser").SetupWorker;
  constructor(options: ServerOptions = {}) { super(options); }
  async start(options: import("msw/browser").StartOptions = {}) {
    const { setupWorker } = await import("msw/browser");
    this.worker = setupWorker(...createHandlers(this));
    await this.worker.start({ onUnhandledRequest: "bypass", ...options }); return this;
  }
  stop() { this.worker?.stop(); return this; }
}
