import { test, expect } from "@playwright/test";
import { clerkSetup, clerk } from "@clerk/testing/playwright";
import { createClerkClient } from "@clerk/backend";

// CI runs E2E with placeholder Clerk keys (see ci.yml) and deliberately does
// not exercise authenticated flows. This test needs a real dev instance
// (pk_test_*/sk_test_*) with password users enabled.
const hasRealClerkKeys =
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
  Boolean(process.env.CLERK_SECRET_KEY) &&
  /^pk_test_[A-Za-z0-9]+$/.test(
    String(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""),
  ) &&
  /^sk_test_[A-Za-z0-9]+$/.test(String(process.env.CLERK_SECRET_KEY ?? ""));

async function createProject(
  page: import("@playwright/test").Page,
  name: string,
) {
  const res = await page.request.post("/api/projects", { data: { name } });
  expect(res.status()).toBe(201);
  const body = await res.json();
  return body as { id: string; name: string };
}

// In dev mode Next.js compiles routes on demand, so the first navigation into a
// workspace can take a while.
const NAV_TIMEOUT = 30_000;

test.describe("Projects sidebar", () => {
  test.skip(
    !hasRealClerkKeys,
    "Requires real Clerk dev keys; CI uses placeholders",
  );

  test("clicking a project in the sidebar opens it and shows a pointer cursor", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    // Fetch a testing token and register the bot-detection bypass.
    await clerkSetup();

    const email = `sidebar-${Date.now()}@example.com`;
    const password = "hunter2-sidebar-test";

    // Create a dedicated user for this test run (password is required by the
    // instance; sign-in below uses an email-based ticket instead of the form).
    const backend = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    await backend.users.createUser({ emailAddress: [email], password });

    // Sign in on a public route that loads Clerk.
    await page.goto("/sign-in");
    await clerk.signIn({ page, emailAddress: email });

    // Seed two projects through the authenticated API.
    const alpha = await createProject(page, "Alpha");
    const beta = await createProject(page, "Beta");

    await page.goto("/editor");

    // Open the sidebar from the home page.
    await page.getByRole("button", { name: "Open sidebar" }).click();

    const alphaRow = page.getByRole("button", { name: "Alpha" });
    const betaRow = page.getByRole("button", { name: "Beta" });

    // All project rows are clickable, so they expose a pointer cursor.
    await expect(alphaRow).toHaveCSS("cursor", "pointer");
    await expect(betaRow).toHaveCSS("cursor", "pointer");

    // Opening a project navigates to its workspace.
    await alphaRow.click();
    await expect(page).toHaveURL(new RegExp(`/editor/${alpha.id}$`), {
      timeout: NAV_TIMEOUT,
    });

    // The current project is highlighted in the sidebar and still shows a
    // pointer cursor over its item.
    await page
      .getByRole("button", { name: "Open sidebar" })
      .click({ timeout: NAV_TIMEOUT });
    const activeRow = page.getByRole("button", { name: "Alpha" });
    await expect(activeRow).toHaveCSS("cursor", "pointer");

    // Switching to another project navigates to its workspace.
    await page.getByRole("button", { name: "Beta" }).click();
    await expect(page).toHaveURL(new RegExp(`/editor/${beta.id}$`), {
      timeout: NAV_TIMEOUT,
    });
  });

  test("keyboard actions on the project actions menu do not open the project", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await clerkSetup();

    const email = `sidebar-keyboard-${Date.now()}@example.com`;
    const password = "hunter2-sidebar-test";

    const backend = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    await backend.users.createUser({ emailAddress: [email], password });

    await page.goto("/sign-in");
    await clerk.signIn({ page, emailAddress: email });

    const project = await createProject(page, "Keyboard test project");
    await page.goto("/editor");
    await page.getByRole("button", { name: "Open sidebar" }).click();

    const row = page.getByRole("button", { name: project.name });
    const projectActions = row.getByRole("button", { name: "Project actions" });

    await projectActions.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: "Rename", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Rename", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toContainText("Rename Project");

    await page.getByRole("button", { name: "Cancel" }).click();
    await page.keyboard.press("Escape");

    await projectActions.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: "Delete", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Delete", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toContainText("Delete Project");

    await expect(page).not.toHaveURL(new RegExp(`/editor/${project.id}$`), {
      timeout: NAV_TIMEOUT,
    });
  });
});
