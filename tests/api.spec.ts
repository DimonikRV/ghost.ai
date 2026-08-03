import { test, expect } from "@playwright/test";

test.describe("API Routes", () => {
  test("projects API returns response", async ({ request }) => {
    const response = await request.get("/api/projects");
    expect(response.status()).toBeDefined();
  });

  test("liveblocks-auth API responds", async ({ request }) => {
    const response = await request.post("/api/liveblocks-auth", {
      data: {},
    });
    expect(response.status()).toBeDefined();
  });

  test("AI design API responds", async ({ request }) => {
    const response = await request.post("/api/ai/design", {
      data: {},
    });
    expect(response.status()).toBeDefined();
  });
});
