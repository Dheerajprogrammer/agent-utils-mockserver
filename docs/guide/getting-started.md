# Getting started

`@agent-utils/mockserver` uses [Mock Service Worker](https://mswjs.io/) to intercept HTTP traffic. Keep your application requests unchanged and control behavior at startup instead.

## Install

```bash
npm install @agent-utils/mockserver msw
```

`msw` is a peer dependency and must be installed by every consuming application.

For browser applications, create MSW's service worker once and commit it:

```bash
npx msw init public/ --save
```

## Your first route

Register routes before calling `start()`.

```ts
import { createMockServer } from "@agent-utils/mockserver";

const mock = createMockServer({ mode: "mock", logger: true });

mock.get("/api/users", () => [
  { id: 1, name: "Ada Lovelace" }
]);

await mock.start();
```

Application code stays ordinary:

```ts
const users = await fetch("/api/users").then((response) => response.json());
```

Continue with [modes](/guide/modes) to choose how unmocked requests behave.
