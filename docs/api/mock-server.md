# Mock server API

## `createMockServer(options)`

Creates a browser mock server.

```ts
import { createMockServer } from "@agent-utils/mockserver";

const mock = createMockServer({ mode: "mock" });
```

## `createNodeMockServer(options)`

Creates a Node.js mock server. Import it from `@agent-utils/mockserver/node`.

## Options

| Option | Type | Description |
| --- | --- | --- |
| `mode` | `"mock" \| "real" \| "hybrid"` | Controls interception behavior. Defaults to mock mode. |
| `target` | `string` | Base target for requests when applicable. |
| `mockRoutes` | `string[]` | Paths treated as mocks in hybrid mode. |
| `logger` | `boolean` | Enables request logging. |
| `onUnhandledRequest` | `"bypass" \| "warn" \| "error"` | Behavior for requests without a handler. |

## Lifecycle controls

| Method | Description |
| --- | --- |
| `start()` | Starts request interception. |
| `stop()` | Stops interception (Node server). |
| `reset()` | Resets Node request handlers. |
| `enable()` / `disable()` / `toggle()` | Changes interception at runtime. |
| `dashboard(options)` | Starts the Node dashboard. |
