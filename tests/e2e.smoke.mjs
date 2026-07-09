/**
 * Optional end-to-end smoke test. Builds (or reuses) the standalone bundle,
 * opens it in a real browser, and asserts that:
 *   - the app mounts with no console/page errors,
 *   - the extracted fill factors are all physical (0 < FF < 100 %),
 *   - the efficiency column appears once area & irradiance are entered,
 *   - the deterministic assistant answers from the dataset.
 *
 * Run with:  npm run test:e2e
 * Requires a Chromium that Playwright can launch. If none is available the test
 * SKIPS (exit 0) rather than failing, so it never blocks a CI that hasn't
 * provisioned browsers.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("⚠ playwright not installed — skipping e2e smoke test.");
  process.exit(0);
}

const bundle = resolve("dist-standalone/index.html");
if (!existsSync(bundle)) {
  console.error("✗ dist-standalone/index.html not found. Run `npm run build:standalone` first.");
  process.exit(1);
}

// Prefer Playwright's own browser; fall back to a pre-provisioned system
// Chromium (CHROMIUM_PATH env var, or the conventional /opt/pw-browsers link)
// so CI containers that ship a browser but skip the download still run this.
let browser;
const fallbacks = [process.env.CHROMIUM_PATH, "/opt/pw-browsers/chromium"].filter((p) => p && existsSync(p));
for (const executablePath of [undefined, ...fallbacks]) {
  try {
    browser = await chromium.launch({ args: ["--no-sandbox"], executablePath });
    break;
  } catch (e) {
    if (executablePath === fallbacks[fallbacks.length - 1] || fallbacks.length === 0) {
      console.log("⚠ no launchable Chromium (" + e.message.split("\n")[0] + ") — skipping e2e smoke test.");
      process.exit(0);
    }
  }
}

const errors = [];
try {
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("ERR_")) errors.push("console: " + m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

  await page.goto("file://" + bundle, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Continue in demo mode" }).click();
  await page.waitForTimeout(700);
  // First load shows the Solavin orientation panel — verify it, then close it.
  const welcomeShown = await page.getByText("ANATOMY OF A LIGHT I-V CURVE").count();
  const closeWelcome = page.getByRole("button", { name: "Start analysing" });
  if (await closeWelcome.count()) await closeWelcome.first().click();
  await page.waitForTimeout(400);
  const dismiss = page.getByRole("button", { name: "Dismiss" });
  if (await dismiss.count()) await dismiss.first().click();

  // Visit every visualization tab (including the synced dual view).
  await page.getByRole("button", { name: "Visualizations", exact: true }).click();
  await page.waitForTimeout(400);
  for (const tab of ["P-V", "I-V + P-V", "Radar", "Compare", "I-V"]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    await page.waitForTimeout(300);
  }

  // Metrics + efficiency.
  await page.getByRole("button", { name: "Metrics & Export", exact: true }).click();
  await page.waitForTimeout(600);
  const ffValues = await page.evaluate(() => {
    const t = [...document.querySelectorAll("table")].find((tb) => tb.innerText.includes("FF"));
    if (!t) return null;
    return [...t.querySelectorAll("tbody tr")].map((tr) => parseFloat(tr.querySelectorAll("td")[4].innerText));
  });
  await page.fill('input[placeholder="0.01"]', "0.01");
  await page.fill('input[placeholder="1000"]', "1000");
  await page.waitForTimeout(300);
  const hasEff = await page.evaluate(() => document.body.innerText.includes("η"));

  // Assistant.
  await page.getByRole("button", { name: /Lab Assistant/ }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Fill factor" }).click();
  await page.waitForTimeout(600);
  const assistantOk = await page.evaluate(() => document.body.innerText.includes("Fill factor measures"));

  const ffOk = Array.isArray(ffValues) && ffValues.length > 0 && ffValues.every((f) => f > 0 && f < 100);

  const fail = [];
  if (errors.length) fail.push("runtime errors: " + JSON.stringify(errors));
  if (!welcomeShown) fail.push("orientation (welcome) panel did not appear on first load");
  if (!ffOk) fail.push("fill factors not all in (0,100)%: " + JSON.stringify(ffValues));
  if (!hasEff) fail.push("efficiency column missing");
  if (!assistantOk) fail.push("assistant did not answer fill-factor query");

  if (fail.length) {
    console.error("✗ e2e smoke test FAILED:\n - " + fail.join("\n - "));
    process.exitCode = 1;
  } else {
    console.log("✓ e2e smoke test passed — FF values:", ffValues.map((f) => f.toFixed(1)).join(", "), "%");
  }
} finally {
  await browser.close();
}
