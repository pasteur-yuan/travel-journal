// 測試執行器：node tests/run.mjs [關鍵字]
// 傳入關鍵字只執行名稱相符的測試群組，例如 node tests/run.mjs timeline
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readdirSync } from "node:fs";
import { Browser, createRecorder, startServer } from "./harness.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const filter = process.argv[2]?.toLowerCase();

const files = readdirSync(join(here, "suites")).filter((f) => f.endsWith(".mjs")).sort();
const suites = [];
for (const file of files) {
  const mod = await import(join(here, "suites", file));
  for (const entry of Object.values(mod)) {
    if (entry?.name && typeof entry.fn === "function") suites.push({ ...entry, file });
  }
}

const selected = filter
  ? suites.filter((s) => s.name.toLowerCase().includes(filter) || s.file.includes(filter))
  : suites;

if (!selected.length) {
  console.error(`沒有符合「${filter}」的測試群組。可用群組：\n` +
    suites.map((s) => `  ${s.file}  ${s.name}`).join("\n"));
  process.exit(1);
}

const server = await startServer(repoRoot);
const browser = await Browser.launch(server.origin);

let passed = 0, failed = 0, skipped = 0;
const failures = [];
const started = Date.now();

for (const s of selected) {
  const t = createRecorder();
  let crashed = null;
  try {
    await s.fn(browser, t);
  } catch (error) {
    crashed = error;
  }
  const bad = t.checks.filter((c) => !c.passed);
  const skips = t.checks.filter((c) => c.skipped);
  passed += t.checks.filter((c) => c.passed && !c.skipped).length;
  failed += bad.length;
  skipped += skips.length;

  const status = crashed || bad.length ? "✗" : "✓";
  console.log(`\n${status} ${s.name}  (${t.checks.length} 項)`);
  for (const c of t.checks) {
    if (c.skipped) console.log(`    ○ ${c.name} — ${c.detail}`);
    else if (!c.passed) console.log(`    ✗ ${c.name}  →  ${c.detail}`);
  }
  if (crashed) {
    failed += 1;
    console.log(`    ✗ 測試群組中斷：${crashed.message}`);
    failures.push(`${s.name}: ${crashed.message}`);
  }
  bad.forEach((c) => failures.push(`${s.name} › ${c.name}  →  ${c.detail}`));
}

await browser.close();
await server.close();

const seconds = ((Date.now() - started) / 1000).toFixed(1);
console.log("\n" + "─".repeat(72));
console.log(`通過 ${passed}　失敗 ${failed}　略過 ${skipped}　（${selected.length} 個群組，${seconds}s）`);
if (failures.length) {
  console.log("\n失敗項目：");
  failures.forEach((f) => console.log(`  • ${f}`));
}
process.exit(failed ? 1 : 0);
