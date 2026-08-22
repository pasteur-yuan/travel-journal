// 在指定地區頁的 #notes 章節補回 .region-note 容器（<span> 標籤、<p> 描述都留空）。
// 零依賴、只在本機手動執行，跟 generate-region-page.mjs 同一類：直接寫回純靜態 HTML，
// 不讓網站多一分對 JS 的執行期依賴。
//
// 背景：站上所有地區頁的 #notes 原本都內建一則「待補充」佔位筆記，2026-08-22
// 應要求全部拿掉（見 TASKS.md 1.1），只留章節標題。region-detail.js 寫入第一則
// 筆記時是找 '#notes .region-note' 把 <span>/<p> 的文字換掉，容器不存在就整段
// 靜默跳過、畫面上什麼都不會出現。要幫某個地區加回第一則筆記時，先跑這支工具
// 補回容器，再去 region-detail.js 的 regionContent[地區].note 填實際內容——
// 容器本身留空即可，實際文字一律由 JS 覆寫，不要在這裡重複填一份。
//
// 用法：node tools/ensure-region-note.mjs <slug> [--country=japan]
// 範例：node tools/ensure-region-note.mjs hokkaido

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith("--"))
    .map((a) => { const [k, v] = a.slice(2).split("="); return [k, v ?? true]; })
);
const [slug] = args;
const country = flags.country || "japan";

if (!slug) {
  console.error(
    "用法：node tools/ensure-region-note.mjs <slug> [--country=japan]\n" +
    "範例：node tools/ensure-region-note.mjs hokkaido"
  );
  process.exit(1);
}

const targetFile = join(repoRoot, "countries", country, slug, "index.html");
if (!existsSync(targetFile)) {
  console.error(`找不到 countries/${country}/${slug}/index.html，先確認地區頁已經存在（新地區用 generate-region-page.mjs）。`);
  process.exit(1);
}

const html = readFileSync(targetFile, "utf8");
const notesSectionMatch = html.match(
  /<section id="notes" class="region-section">.*?<\/section>/s
);
if (!notesSectionMatch) {
  console.error(`countries/${country}/${slug}/index.html 裡找不到 #notes 章節，這個檔案的結構可能跟其他地區頁不一致，先手動檢查。`);
  process.exit(1);
}
const notesSection = notesSectionMatch[0];

if (notesSection.includes('<div class="region-note">')) {
  console.log(`countries/${country}/${slug}/index.html 已經有 .region-note 容器了，不用重複加。`);
  process.exit(0);
}

const anchor = "<h2>旅行筆記</h2>";
if (!notesSection.includes(anchor)) {
  console.error(`#notes 章節裡找不到 "${anchor}"，結構跟預期不同，先手動檢查再處理。`);
  process.exit(1);
}

const newNotesSection = notesSection.replace(
  anchor,
  `${anchor}<div class="region-note"><span></span><p></p></div>`
);
const newHtml = html.replace(notesSection, newNotesSection);
writeFileSync(targetFile, newHtml);

console.log(`已在 countries/${country}/${slug}/index.html 補回 .region-note 容器（內容留空）。`);
console.log(`接著把實際內容寫進 assets/js/region-detail.js 的 regionContent.${slug}.note = ['年 / 月', '一句話敘述']，`);
console.log("JS 載入時會自動把文字寫進這個容器，不用在 HTML 裡重複填一次。");
