// 共用工具：在真實 trips.js 資料之外，額外注入合成的旅程資料，用來測試
// 「需要兩個以上年份互相切換」這類單靠現有真實資料測不出來的行為（例如年份
// 切換動畫、FLIP、殘留 hover）。時間軸節點現在完全由 assets/js/trips.js 的
// 全域 trips 動態產生，main.js 不再讀 HTML 裡寫死的 .timeline-entry，所以
// 注入方式是產生一份 index.html 的暫存變體，在 trips.js 執行之後、main.js
// 執行之前插入 <script>trips.push(...)</script>，而不是把 <a class="timeline-entry">
// 直接塞進 HTML（main.js 已經不會去讀它）。
// 暫存檔案名前綴 _test- 已列入 .gitignore，每個案例結束後刪除。
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const baseHtml = readFileSync(join(repoRoot, "index.html"), "utf8");
const ANCHOR = '<script src="assets/js/main.js"></script>';

export const tripScript = ({
  label = "測試", date, country = "🇹🇹 測試國", regions = ["測試地區"],
  teaser = "測試", description = "測試", itinerary
} = {}) => {
  const trip = {
    label, date: date ?? null, country, regions, teaser, description,
    itinerary: itinerary || [{ date: date || "2024-01-01", theme: "", stops: [
      { time: "00:00", place: "測試", type: "", note: "", transport: "" }
    ] }]
  };
  return `<script>trips.push(${JSON.stringify(trip)});</script>`;
};

export async function withTripVariant(b, injectedScripts, fn) {
  const injected = Array.isArray(injectedScripts) ? injectedScripts.join("") : injectedScripts;
  const name = `_test-timeline-${Math.random().toString(36).slice(2, 8)}.html`;
  const file = join(repoRoot, name);
  writeFileSync(file, baseHtml.replace(ANCHOR, injected + ANCHOR));
  try {
    await b.goto(`/${name}`, { settle: 1200 });
    return await fn();
  } finally {
    try { unlinkSync(file); } catch { /* 已刪除 */ }
  }
}
