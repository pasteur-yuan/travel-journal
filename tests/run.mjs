// 測試執行器：node tests/run.mjs [關鍵字] [--jobs=N]
// 傳入關鍵字只執行名稱相符的測試群組，例如 node tests/run.mjs timeline
// --jobs=N 指定同時執行的瀏覽器數量（也可用環境變數 TEST_JOBS），--jobs=1 為完全序列。
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readdirSync } from "node:fs";
import { cpus } from "node:os";
import { Browser, createRecorder, startServer } from "./harness.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");

const args = process.argv.slice(2);
const filter = args.find((a) => !a.startsWith("--"))?.toLowerCase();
const jobsArg = args.find((a) => a.startsWith("--jobs="))?.split("=")[1] ?? process.env.TEST_JOBS;
// 每個 job 是一個獨立的 Chrome，吃掉的是整顆核心而不是一個執行緒。
// 實測（12 核）：1→244s、2→124s、4→99s、6→86s、8→98s，超過半數核心後開始互搶而變慢。
const requestedJobs = Math.max(1, Number(jobsArg) || Math.min(6, Math.max(1, Math.floor(cpus().length / 2))));

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

selected.forEach((s, index) => { s.index = index; });
const parallelSuites = selected.filter((s) => !s.serial);
const serialSuites = selected.filter((s) => s.serial);
const jobs = Math.min(requestedJobs, Math.max(1, parallelSuites.length));

const server = await startServer(repoRoot);
const browsers = await Promise.all(
  Array.from({ length: jobs }, () => Browser.launch(server.origin))
);

// 結果依原始順序輸出：某個群組完成後，只要它之前的群組都完成了就立刻印出，
// 這樣既保持順序穩定，又不必等全部跑完才看得到進度。
const results = new Array(selected.length).fill(null);
let nextToPrint = 0;
let passed = 0, failed = 0, skipped = 0;
const failures = [];
const started = Date.now();

function flush() {
  while (nextToPrint < results.length && results[nextToPrint]) {
    const r = results[nextToPrint];
    console.log(`\n${r.status} ${r.name}  (${r.total} 項, ${r.seconds}s)`);
    r.lines.forEach((line) => console.log(line));
    nextToPrint += 1;
  }
}

async function runSuite(browser, s) {
  const t = createRecorder();
  const suiteStart = Date.now();
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

  const lines = [];
  for (const c of t.checks) {
    if (c.skipped) lines.push(`    ○ ${c.name} — ${c.detail}`);
    else if (!c.passed) lines.push(`    ✗ ${c.name}  →  ${c.detail}`);
  }
  if (crashed) {
    failed += 1;
    lines.push(`    ✗ 測試群組中斷：${crashed.message}`);
    failures.push(`${s.name}: ${crashed.message}`);
  }
  bad.forEach((c) => failures.push(`${s.name} › ${c.name}  →  ${c.detail}`));

  results[s.index] = {
    name: s.name,
    status: crashed || bad.length ? "✗" : "✓",
    total: t.checks.length,
    seconds: ((Date.now() - suiteStart) / 1000).toFixed(1),
    lines
  };
  flush();
}

// 平行階段：每個 worker 綁一個瀏覽器，從共用佇列取下一個群組。
const queue = [...parallelSuites];
await Promise.all(browsers.map(async (browser) => {
  while (queue.length) await runSuite(browser, queue.shift());
}));

// 序列階段：對時間敏感的群組獨佔機器執行，避免與其他 Chrome 互搶 CPU。
for (const s of serialSuites) await runSuite(browsers[0], s);

await Promise.all(browsers.map((b) => b.close()));
await server.close();

const seconds = ((Date.now() - started) / 1000).toFixed(1);
const suiteSeconds = results.reduce((sum, r) => sum + Number(r?.seconds || 0), 0);
console.log("\n" + "─".repeat(72));
const parallelNote = jobs > 1
  ? `${jobs} 個瀏覽器平行、群組累計 ${suiteSeconds.toFixed(1)}s`
  : "序列執行";
console.log(`通過 ${passed}　失敗 ${failed}　略過 ${skipped}　（${selected.length} 個群組，${seconds}s，${parallelNote}）`);
if (failures.length) {
  console.log("\n失敗項目：");
  failures.forEach((f) => console.log(`  • ${f}`));
}
process.exit(failed ? 1 : 0);
