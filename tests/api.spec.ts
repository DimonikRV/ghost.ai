import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  test("health check returns ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  test("projects API is not accessible unauthenticated", async ({ request }) => {
    const response = await request.get("/api/projects");
    expect(response.status()).not.toBe(200);
  });

  test("liveblocks-auth API is not accessible unauthenticated", async ({ request }) => {
    const response = await request.post("/api/liveblocks-auth", {
      data: {},
    });
    expect(response.status()).not.toBe(200);
  });

  test("AI design API is not accessible unauthenticated", async ({ request }) => {
    const response = await request.post("/api/ai/design", {
      data: {},
    });
    expect(response.status()).not.toBe(200);
  });

  test("trigger-test API reports success or failure", async ({ request }) => {
    const response = await request.get("/api/trigger-test");
    expect([200, 500]).toContain(response.status());
    const body = await response.json();
    expect(typeof body.success).toBe("boolean");
  });
});
