# Browser apps

Use the default package entry point in client-side applications such as Vite, Create React App, and Angular.

## React and Vite

Create `src/mocks/browser.ts`:

```ts
import { createMockServer } from "@agent-utils/mockserver";

export const mock = createMockServer({
  mode: import.meta.env.VITE_API_MODE === "real" ? "real" : "hybrid",
  mockRoutes: ["/api/users"]
});

mock.get("/api/users", () => [{ id: 1, name: "Ada Lovelace" }]);
```

Start it before rendering the application:

```ts
async function bootstrap() {
  if (import.meta.env.DEV) {
    const { mock } = await import("./mocks/browser");
    await mock.start();
  }
  // Render the app here.
}

bootstrap();
```

## Angular

Create the server in a browser-only module, then start it via an `APP_INITIALIZER` so it is ready before Angular bootstraps. Your `HttpClient` calls need no changes.

For Next.js, only start the browser mock server from a client component or client-side module. Do not start it during server rendering; use the Node entry point for server-side tests instead.
