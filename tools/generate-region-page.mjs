// 產生新地區頁的骨架 HTML，取代「複製現有地區頁再手改」的流程。
// 零依賴、只在本機手動執行，不是自動化建置的一部分——輸出的檔案跟手寫的完全一樣，
// 是純靜態 HTML，不會讓網站多一分對 JS 的執行期依賴。
//
// 用法：node tools/generate-region-page.mjs <slug> <地區名稱> <hero副標題> [--country=japan] [--force]
// 範例：node tools/generate-region-page.mjs hyogo 兵庫 "溫泉與城郭的關西日常"
//
// 只會寫入 countries/<country>/<slug>/index.html 這一個檔案。地區頁骨架完成後，
// 還有這些既有頁面／資料需要另外手動補上（本工具不會動它們）：
//   - assets/js/region-detail.js 的 regionNames、regionSearchNames、
//     regionContent、regionalVenueData 補上 <slug> 對應的 key
//   - countries/<country>/index.html 加一筆 region-showcase-item
//   - assets/css/style.css 加 .region-hero-<slug> 背景
//   - tests/regions.mjs 的 REGION_NAMES 加一筆（地區頁清單的單一來源）
// 這份清單本身也會在腳本執行完後印出來。

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith("--"))
    .map((a) => { const [k, v] = a.slice(2).split("="); return [k, v ?? true]; })
);
const [slug, displayName, heroSubtitle] = args;
const country = flags.country || "japan";
const force = Boolean(flags.force);

if (!slug || !displayName || !heroSubtitle) {
  console.error(
    "用法：node tools/generate-region-page.mjs <slug> <地區名稱> <hero副標題> [--country=japan] [--force]\n" +
    '範例：node tools/generate-region-page.mjs hyogo 兵庫 "溫泉與城郭的關西日常"'
  );
  process.exit(1);
}
if (!/^[a-z]+(-[a-z]+)*$/.test(slug)) {
  console.error(`slug 只能是小寫英文字母與連字號，例如 "ise-shima"，收到的是「${slug}」`);
  process.exit(1);
}

const countryDir = join(repoRoot, "countries", country);
if (!existsSync(countryDir)) {
  console.error(`找不到 countries/${country}/，先確認國家頁已經存在。`);
  process.exit(1);
}
const targetDir = join(countryDir, slug);
const targetFile = join(targetDir, "index.html");
if (existsSync(targetFile) && !force) {
  console.error(`countries/${country}/${slug}/index.html 已經存在，加 --force 才會覆寫。`);
  process.exit(1);
}

// 讀 countries/<country>/index.html 的 breadcrumb 名稱，避免這裡另外寫死一份對照表；
// 找不到就退而求其次用 country 本身。
const countryPageFile = join(countryDir, "index.html");
const countryPageHtml = existsSync(countryPageFile) ? readFileSync(countryPageFile, "utf8") : "";
const countryBreadcrumbName = countryPageHtml.match(/aria-current="page">([^<]+)</)?.[1] || country;

const html = `<!doctype html>
<html lang="zh-Hant">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>出去玩</title><link rel="icon" type="image/svg+xml" href="../../../assets/images/favicon.svg"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"><link rel="stylesheet" href="../../../assets/css/style.css"></head>
<body><header class="site-header"><nav class="breadcrumb" aria-label="頁面位置"><a class="brand" href="../../../index.html"><i class="fa-solid fa-plane-up" aria-hidden="true"></i><span>出去玩</span></a><span class="breadcrumb-separator" aria-hidden="true">/</span><a href="../index.html">${countryBreadcrumbName}</a><span class="breadcrumb-separator" aria-hidden="true">/</span><span class="breadcrumb-current" aria-current="page">${displayName}</span></nav><nav class="theme-switcher" aria-label="主題切換"><button class="theme-toggle" type="button" data-theme-toggle aria-label="切換為暗色液態玻璃" title="切換暗色主題" aria-pressed="false"><i class="fa-solid fa-circle-half-stroke" aria-hidden="true"></i></button></nav></header>
<main class="region-detail container"><section class="region-hero region-hero-${slug}"><div class="region-hero-content"><span class="eyebrow">Japan / Region</span><h1>${displayName}</h1><p>${heroSubtitle}</p></div></section><nav class="region-section-nav" aria-label="${displayName}頁面分類"><a href="#overview">旅程摘要</a><a href="#spots">景點</a><a href="#food">美食</a><a href="#stays">住宿</a></nav><div class="region-sections">
<section id="overview" class="region-section"><div class="region-section-label">01</div><div><p class="eyebrow">A SLOW JOURNEY</p><h2>待補充</h2><p class="region-lead">待補充地區描述。</p><div class="region-facts"><div><span>旅行主題</span><strong>待補充</strong></div><div><span>目前紀錄</span><strong>待補充</strong></div><div><span>旅行狀態</span><strong>持續整理</strong></div></div></div></section>
<section id="spots" class="region-section"><div class="region-section-label">02</div><div><p class="eyebrow">PLACES</p><h2>景點</h2><div class="region-card-grid"><article class="region-content-card region-content-card-image"><div><span>景點 01</span><h3>${displayName}的風景</h3><p>把值得再次造訪的風景與散步路線記在這裡。</p></div></article><article class="region-content-card"><span>景點 02</span><h3>地方與日常</h3><p>補上地點、造訪日期與旅途中的片段。</p></article></div></div></section>
<section id="food" class="region-section"><div class="region-section-label">03</div><div><p class="eyebrow">TABLE</p><h2>美食</h2><div class="region-content-list"><article><span>01</span><div><h3>地方餐桌</h3><p>記錄店家、料理與當下的味道。</p></div></article><article><span>02</span><div><h3>旅行中的一餐</h3><p>讓食物成為理解地方生活的另一條線索。</p></div></article></div></div></section>
<section id="stays" class="region-section"><div class="region-section-label">04</div><div><p class="eyebrow">STAY &amp; MOVE</p><h2>住宿與交通</h2><div class="region-facts region-facts-wide"><div><span>住宿</span><strong>待補充</strong></div><div><span>移動方式</span><strong>待補充</strong></div></div></div></section></div></main><footer class="site-footer">Travel Journal</footer><script src="../../../assets/js/themes.js"></script><script src="../../../assets/js/theme-switcher.js"></script><script src="../../../assets/js/region-detail.js"></script></body></html>
`;

mkdirSync(targetDir, { recursive: true });
writeFileSync(targetFile, html);

console.log(`已寫入 countries/${country}/${slug}/index.html\n`);
console.log("骨架完成，還有這些既有檔案要手動補上（本工具不會動它們）：");
console.log(`  1. assets/js/region-detail.js 的 regionNames、regionSearchNames、regionContent、regionalVenueData 補上 "${slug}" 這個 key`);
console.log(`  2. countries/${country}/index.html 加一筆 region-showcase-item（連到 ${slug}/index.html）`);
console.log(`  3. assets/css/style.css 加 .region-hero-${slug} 的背景圖`);
console.log(`  4. tests/regions.mjs 的 REGION_NAMES 加一筆：${slug}: "${displayName}"`);
console.log(`  5. assets/images/${slug}.svg 或實拍照片（主視覺，暫時可用漸層佔位圖）`);
console.log("\n完成後跑 node tests/run.mjs 骨架 確認新頁面通過結構一致性檢查。");
