import type { Handler, HandlerResult, HeadersMap, HttpMethod, MockRequest, MockResponse, RegisteredRoute, ResourceFactory, RouteOptions, ServerOptions } from "./types.js";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const isResponse = (value: unknown): value is MockResponse => !!value && typeof value === "object" && ("status" in value || "body" in value || "headers" in value || "delay" in value || "timeout" in value);
const stripTrailing = (path: string) => path.length > 1 ? path.replace(/\/+$/, "") : path;

export class MockApi {
  readonly routes: RegisteredRoute[] = [];
  readonly requests: Array<{ method: string; path: string; status: number; at: string }> = [];
  private enabled = true;
  private token?: string;
  private database = new Map<string, Array<Record<string, unknown>>>();
  private options: Required<Pick<ServerOptions, "mode" | "logger" | "onUnhandledRequest">> & ServerOptions;

  constructor(options: ServerOptions = {}) { this.options = { mode: "mock", logger: false, onUnhandledRequest: "bypass", ...options }; }
  get mode() { return this.options.mode; }
  setMode(mode: ServerOptions["mode"]) { this.options.mode = mode ?? "mock"; return this; }
  enable() { this.enabled = true; return this; }
  disable() { this.enabled = false; return this; }
  toggle() { this.enabled = !this.enabled; return this.enabled; }
  isEnabled() { return this.enabled; }
  auth(config: { token: string }) { this.token = config.token; return this; }
  protected(path: string, method: HttpMethod = "GET") { const route = this.routes.find(r => r.method === method && r.path === stripTrailing(path)); if (route) route.options.protected = true; else this.register(method, path, () => ({ status: 404, body: { message: "No protected handler configured" } }), { protected: true }); return this; }
  get<T = unknown, B = unknown>(path: string, handler?: Handler<T, B> | RouteOptions<T, B>) { return this.add("GET", path, handler); }
  post<T = unknown, B = unknown>(path: string, handler?: Handler<T, B> | RouteOptions<T, B>) { return this.add("POST", path, handler); }
  put<T = unknown, B = unknown>(path: string, handler?: Handler<T, B> | RouteOptions<T, B>) { return this.add("PUT", path, handler); }
  patch<T = unknown, B = unknown>(path: string, handler?: Handler<T, B> | RouteOptions<T, B>) { return this.add("PATCH", path, handler); }
  delete<T = unknown, B = unknown>(path: string, handler?: Handler<T, B> | RouteOptions<T, B>) { return this.add("DELETE", path, handler); }
  private add<T, B>(method: HttpMethod, path: string, value?: Handler<T, B> | RouteOptions<T, B>) {
    const options = (typeof value === "function" ? { handler: value } : value ?? {}) as RouteOptions;
    return this.register(method, path, (options.handler ?? (() => undefined)) as Handler, options as RouteOptions);
  }
  private register(method: HttpMethod, path: string, handler: Handler, options: RouteOptions) {
    this.routes.push({ method, path: stripTrailing(path), handler, options, hits: 0 }); return this;
  }
  resource<T extends Record<string, unknown>>(name: string, seed: T[] | ResourceFactory<T>) {
    const rows = Array.isArray(seed) ? structuredClone(seed) : Array.from({ length: seed.count }, (_, i) => seed.factory(i));
    this.database.set(name, rows);
    const root = `/${name}`;
    this.get(root, ({ query }) => { const page = Number(query.page ?? 1), limit = Number(query.limit ?? rows.length); return rows.slice((page - 1) * limit, page * limit); });
    this.get(`${root}/:id`, ({ params }) => rows.find(r => String(r.id) === params.id) ?? { status: 404, body: { message: "Not found" } });
    this.post<T, Partial<T>>(root, ({ body }) => { const id = body?.id ?? this.nextId(rows); const created = { ...body, id } as unknown as T; rows.push(created); return { status: 201, body: created }; });
    const update = ({ params, body }: MockRequest<Partial<T>>) => { const index = rows.findIndex(r => String(r.id) === params.id); if (index < 0) return { status: 404, body: { message: "Not found" } }; rows[index] = { ...rows[index], ...body }; return rows[index]; };
    this.put(root + "/:id", update); this.patch(root + "/:id", update);
    this.delete(root + "/:id", ({ params }) => { const index = rows.findIndex(r => String(r.id) === params.id); if (index < 0) return { status: 404, body: { message: "Not found" } }; rows.splice(index, 1); return { status: 204, body: undefined }; });
    return this;
  }
  private nextId(rows: Array<Record<string, unknown>>) { return Math.max(0, ...rows.map(r => Number(r.id) || 0)) + 1; }
  shouldMock(method: string, pathname: string) {
    if (!this.enabled || this.options.mode === "real") return false;
    if (this.options.mode === "mock") return true;
    return this.options.mockRoutes?.some(route => pathname === route || pathname.startsWith(stripTrailing(route) + "/")) || this.routes.some(r => r.method === method && this.matches(r.path, pathname));
  }
  find(method: string, pathname: string) { return this.routes.find(r => r.method === method && this.matches(r.path, pathname)); }
  matches(template: string, path: string) { return new RegExp("^" + template.replace(/:[^/]+/g, "[^/]+") + "/?$").test(path); }
  params(template: string, path: string) { const keys = [...template.matchAll(/:([^/]+)/g)].map(m => m[1]); const values = path.split("/").filter(Boolean); const templ = template.split("/").filter(Boolean); return Object.fromEntries(keys.map(key => [key, decodeURIComponent(values[templ.findIndex(p => p === `:${key}`)] ?? "")])); }
  async execute(route: RegisteredRoute, request: Request): Promise<MockResponse> {
    route.hits++;
    const url = new URL(request.url); let body: unknown;
    try { body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.clone().json(); } catch { try { body = await request.clone().text(); } catch { body = undefined; } }
    const headers = Object.fromEntries(request.headers.entries()) as HeadersMap;
    const cookies = Object.fromEntries((headers.cookie ?? "").split(";").filter(Boolean).map(x => { const [k, ...v] = x.trim().split("="); return [k, decodeURIComponent(v.join("="))]; }));
    const input: MockRequest = { params: this.params(route.path, url.pathname), query: Object.fromEntries(url.searchParams.entries()), body, headers, cookies, request };
    if (route.options.protected && headers.authorization !== `Bearer ${this.token}`) return { status: 401, body: { message: "Unauthorized" } };
    const result: HandlerResult<unknown> = await route.handler(input);
    const response = isResponse(result) ? { ...route.options, ...result } : { ...route.options, body: result };
    this.requests.unshift({ method: request.method, path: url.pathname, status: response.status ?? 200, at: new Date().toISOString() }); this.requests.splice(100);
    if (this.options.logger) console.info(`[${this.options.mode.toUpperCase()}] ${request.method} ${url.pathname}`);
    return response;
  }
}

export { METHODS };
