import { describe, expect, it } from "vitest";
import { MockApi } from "./core.js";
import { createNodeMockServer } from "./node.js";

describe("MockApi", () => {
  it("extracts dynamic params and query values", () => {
    const api = new MockApi();
    expect(api.matches("/products/:productId/reviews/:reviewId", "/products/2/reviews/3")).toBe(true);
    expect(api.params("/users/:id", "/users/a%20b")).toEqual({ id: "a b" });
  });
  it("creates CRUD routes and persists writes", async () => {
    const api = new MockApi(); api.resource("users", [{ id: 1, name: "John" }]);
    const post = api.find("POST", "/users")!;
    await api.execute(post, new Request("http://test/users", { method: "POST", body: JSON.stringify({ name: "Ada" }), headers: { "content-type": "application/json" } }));
    const list = await api.execute(api.find("GET", "/users")!, new Request("http://test/users"));
    expect(list.body).toEqual([{ id: 1, name: "John" }, { id: 2, name: "Ada" }]);
  });
  it("intercepts normal fetch traffic in Node", async () => {
    const api = createNodeMockServer();
    api.get("/health", () => ({ ok: true })).start();
    const response = await fetch("https://example.test/health");
    expect(await response.json()).toEqual({ ok: true });
    api.stop();
  });
});
