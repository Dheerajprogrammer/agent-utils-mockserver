# Node.js and tests

Import from the Node-specific entry point in Vitest, Jest, integration scripts, and SSR test environments.

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createNodeMockServer } from "@agent-utils/mockserver/node";

const mock = createNodeMockServer({ mode: "mock" });
mock.get("/users/:id", ({ params }) => ({ id: params.id, name: "Linus" }));

beforeAll(() => mock.start());
afterAll(() => mock.stop());

describe("API client", () => {
  it("gets a user", async () => {
    const response = await fetch("https://api.example.test/users/42");
    expect(await response.json()).toEqual({ id: "42", name: "Linus" });
  });
});
```

Call `reset()` between tests when route handlers or state need restoring. Node mock servers can also expose a small inspection dashboard:

```ts
mock.dashboard({ port: 4000 });
```
