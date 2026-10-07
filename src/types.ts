export type Mode = "mock" | "real" | "hybrid";
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type HeadersMap = Record<string, string>;

export interface MockRequest<TBody = unknown> {
  params: Record<string, string>;
  query: Record<string, string>;
  body: TBody | undefined;
  headers: HeadersMap;
  cookies: Record<string, string>;
  request: Request;
}
export interface MockResponse<T = unknown> { status?: number; headers?: HeadersMap; body?: T; delay?: number; timeout?: boolean }
export type HandlerResult<T> = T | MockResponse<T> | undefined;
export type Handler<T = unknown, B = unknown> = (request: MockRequest<B>) => HandlerResult<T> | Promise<HandlerResult<T>>;
export interface RouteOptions<T = unknown, B = unknown> { handler?: Handler<T, B>; delay?: number; timeout?: boolean; status?: number; headers?: HeadersMap; protected?: boolean }
export interface RegisteredRoute { method: HttpMethod; path: string; handler: Handler; options: RouteOptions; hits: number }
export interface ResourceFactory<T> { count: number; factory: (index: number) => T }
export interface ServerOptions { mode?: Mode; target?: string; mockRoutes?: string[]; logger?: boolean; onUnhandledRequest?: "bypass" | "warn" | "error" }
export interface DashboardOptions { port?: number; host?: string }
