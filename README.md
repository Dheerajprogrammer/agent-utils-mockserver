# @agent-utils/mockserver

@agent-utils/mockserver transparently intercepts HTTP traffic with [MSW](https://mswjs.io/). Your application continues to use `fetch`, Axios, React Query, RTK Query, SWR, Angular `HttpClient`, or `XMLHttpRequest` normally; only the application bootstrap changes.

[Documentation](https://dheerajprogrammer.github.io/agent-utils-mockserver/) · [npm](https://www.npmjs.com/package/@agent-utils/mockserver) · [Report an issue](https://github.com/Dheerajprogrammer/agent-utils-mockserver/issues) · [Sponsor](https://github.com/sponsors/Dheerajprogrammer)

<iframe src="https://github.com/sponsors/Dheerajprogrammer/button" title="Sponsor Dheerajprogrammer" height="32" width="114" style="border: 0; border-radius: 6px;"></iframe>

## Install

```bash
npm install @agent-utils/mockserver msw
```

`msw` is a peer dependency, so install it in every application that uses @agent-utils/mockserver.

For browser applications, generate MSW's worker once from the application root:

```bash
npx msw init public/ --save
```

This creates `public/mockServiceWorker.js`. Commit it to your application repository.

## Quick start

Register routes before starting the server. Existing request code remains unchanged.

```ts
import { createMockServer } from "@agent-utils/mockserver";

export const mock = createMockServer({ mode: "mock", logger: true });

mock.get("/api/users", () => [
  { id: 1, name: "John" },
  { id: 2, name: "Ada" }
]);

mock.get("/api/users/:id", ({ params, query, headers, cookies }) => ({
  id: Number(params.id),
  page: query.page,
  authorization: headers.authorization,
  session: cookies.session
}));

await mock.start();
```

```ts
// No changes to application request code.
const users = await fetch("/api/users").then((response) => response.json());
```

## Modes

| Mode | Behaviour |
| --- | --- |
| `mock` | Intercepts requests. Registered routes return mocks; unregistered routes return a mock 404. |
| `real` | Does not intercept; all requests use their normal backend URL. |
| `hybrid` | Mock routes are intercepted and every other request uses its normal backend URL. |

```ts
const mock = createMockServer({
  mode: "hybrid",
  mockRoutes: ["/api/orders", "/api/payments"],
  logger: true
});

mock.get("/api/orders/:id", ({ params }) => ({ id: params.id, status: "processing" }));
await mock.start();
```

In hybrid mode, a registered route is also treated as a mock route. Real traffic is passed through unchanged, so configure your app's normal backend base URL (for example with a Vite proxy or an Angular environment file).

## React (Vite, CRA, Next.js client)

Create `src/mocks/browser.ts`:

```ts
import { createMockServer } from "@agent-utils/mockserver";

export const mock = createMockServer({
  mode: import.meta.env.VITE_API_MODE === "real" ? "real" : "hybrid",
  mockRoutes: ["/api/users"]
});

mock.get("/api/users", () => [
  { id: 1, name: "Ada Lovelace" }
]);

mock.post("/api/users", ({ body }) => ({
  status: 201,
  body: { id: 2, ...(body as { name: string }) }
}));
```

Start mocking before rendering in `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

async function bootstrap() {
  if (import.meta.env.DEV) {
    const { mock } = await import("./mocks/browser");
    await mock.start();
  }
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode><App /></React.StrictMode>
  );
}

bootstrap();
```

Your component stays conventional:

```tsx
import { useEffect, useState } from "react";

export function Users() {
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => { fetch("/api/users").then(r => r.json()).then(setUsers); }, []);
  return <ul>{users.map(user => <li key={user.id}>{user.name}</li>)}</ul>;
}
```

For Next.js, start the mock server only from a client-side module (`"use client"`) and never during server rendering. Use the Node entry point below for server-side tests.

## Angular

Create `src/mocks/browser.ts`:

```ts
import { createMockServer } from "@agent-utils/mockserver";

export const mock = createMockServer({ mode: "hybrid", mockRoutes: ["/api/users"] });
mock.get("/api/users", () => [{ id: 1, name: "Grace Hopper" }]);
```

Start it with an `APP_INITIALIZER` so it is ready before Angular bootstraps. In `src/app/app.config.ts`:

```ts
import { APP_INITIALIZER, ApplicationConfig } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { mock } from "../mocks/browser";

function startMocks() {
  return () => mock.start();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    { provide: APP_INITIALIZER, useFactory: startMocks, multi: true }
  ]
};
```

Then use `HttpClient` as usual:

```ts
this.http.get<{ id: number; name: string }[]>("/api/users").subscribe(console.log);
```

For NgModule-based applications, add the same `APP_INITIALIZER` provider to `AppModule.providers`.

## Node.js and tests

Use the Node-specific entry point in Vitest, Jest, integration scripts, or SSR test environments. Start it before tests and always stop it afterwards.

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createNodeMockServer } from "@agent-utils/mockserver/node";

const mock = createNodeMockServer({ mode: "mock" });
mock.get("/users/:id", ({ params }) => ({
  id: params.id,
  name: "Linus"
}));

beforeAll(() => mock.start());
afterAll(() => mock.stop());

describe("API client", () => {
  it("gets a user", async () => {
    const response = await fetch("https://api.example.test/users/42");
    expect(await response.json()).toEqual({ id: "42", name: "Linus" });
  });
});
```

## Routes and responses

```ts
mock.post("/api/login", ({ body }) => {
  if ((body as { password?: string })?.password !== "demo") {
    return { status: 401, body: { message: "Invalid credentials" } };
  }
  return {
    status: 200,
    headers: { "x-mock": "true" },
    body: { token: "mock-token" }
  };
});

mock.get("/api/slow", { delay: 1_000, handler: () => ({ ok: true }) });
mock.get("/api/offline", { timeout: true });
```

Use `mock.auth({ token: "mock-token" })` and call `mock.protected("/api/users")` after registering a route to require `Authorization: Bearer mock-token`.

## Stateful resources and Faker

```ts
import { createMockServer, faker } from "@agent-utils/mockserver";

const mock = createMockServer({ mode: "mock" });
mock.resource("users", {
  count: 10,
  factory: () => ({
    id: faker.number.int({ min: 1, max: 100_000 }),
    name: faker.person.fullName(),
    email: faker.internet.email()
  })
});
```

This registers `GET /users`, `GET /users/:id`, `POST /users`, `PUT /users/:id`, `PATCH /users/:id`, and `DELETE /users/:id`. Changes persist for the lifetime of the mock server.

## Runtime controls and dashboard

```ts
mock.disable(); // all requests use their normal backend
mock.enable();
mock.toggle();

// Node only: opens a dashboard at http://127.0.0.1:4000
// (use createNodeMockServer from "@agent-utils/mockserver/node")
mock.dashboard({ port: 4000 });
```

## Generate from OpenAPI

```bash
npx @agent-utils/mockserver generate ./openapi.yaml ./mocks
```

The command creates starter `.mock.ts` modules grouped by the first path segment. Import each generated module and invoke its default export with your mock instance during application setup.
