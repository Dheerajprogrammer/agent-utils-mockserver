# Modes

Set `mode` when creating a mock server.

| Mode | Registered routes | Other requests |
| --- | --- | --- |
| `mock` | Return mocks | Return a mock 404 |
| `real` | Do not intercept | Use the normal backend |
| `hybrid` | Return mocks | Use the normal backend |

```ts
const mock = createMockServer({
  mode: "hybrid",
  mockRoutes: ["/api/orders", "/api/payments"]
});

mock.get("/api/orders/:id", ({ params }) => ({
  id: params.id,
  status: "processing"
}));
```

In hybrid mode, registered routes are mock routes automatically. Configure the normal backend URL in your application (for example through an environment value or a Vite proxy).

At runtime, use `enable()`, `disable()`, or `toggle()` to change whether the mock server intercepts requests.
