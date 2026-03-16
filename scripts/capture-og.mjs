/**
 * Capture OG image (1200x630) from the running dev server.
 *
 * Usage:
 *   1. Start the dev server:  npm run dev
 *   2. Run this script:       node scripts/capture-og.mjs
 *
 * Outputs: public/og-image.png
 */

import { chromium } from "@playwright/test";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "public", "og-image.png");
const URL = "http://localhost:4321";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1, // 1x — social platforms display at CSS pixels
});

await page.goto(URL, { waitUntil: "networkidle" });

// Let animations settle
await page.waitForTimeout(1000);

// Hide the export controls and interaction hint for a cleaner image
await page.evaluate(() => {
  document
    .querySelectorAll(".export-controls, .interaction-note")
    .forEach((el) => (el.style.display = "none"));
});

await page.screenshot({ path: OUTPUT, type: "png" });
await browser.close();

console.log(`OG image saved to ${OUTPUT}`);
