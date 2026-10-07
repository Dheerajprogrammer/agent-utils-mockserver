# Routes and resources

## HTTP routes

Use `get`, `post`, `put`, `patch`, or `delete` to register a route.

```ts
mock.post("/api/login", ({ body }) => {
  if ((body as { password?: string })?.password !== "demo") {
    return { status: 401, body: { message: "Invalid credentials" } };
  }
  return { status: 200, headers: { "x-mock": "true" }, body: { token: "mock-token" } };
});
```

Handlers receive `params`, `query`, `body`, `headers`, `cookies`, and the original `request`. Return a body directly, or a response object with `status`, `headers`, `body`, `delay`, or `timeout`.

```ts
mock.get("/api/slow", { delay: 1_000, handler: () => ({ ok: true }) });
mock.get("/api/offline", { timeout: true });
```

## Authentication

```ts
mock.auth({ token: "mock-token" });
mock.protected("/api/users");
```

Call `protected()` after registering the route to require `Authorization: Bearer mock-token`.

## Stateful resources

`resource()` generates CRUD handlers with state that lasts for the server lifetime.

```ts
import { faker } from "@agent-utils/mockserver";

mock.resource("users", {
  count: 10,
  factory: () => ({
    id: faker.number.int({ min: 1, max: 100_000 }),
    name: faker.person.fullName(),
    email: faker.internet.email()
  })
});
```

This registers `GET /users`, `GET /users/:id`, `POST /users`, `PUT /users/:id`, `PATCH /users/:id`, and `DELETE /users/:id`.
