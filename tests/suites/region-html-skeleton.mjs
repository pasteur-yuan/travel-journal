// 29 個地區頁的 HTML 骨架應該完全一致；差異只能來自實際內容（景點／美食卡片數量、
// overview 的敘述文字與 facts 值）。這裡直接讀原始檔案比對骨架，不開瀏覽器——
// 抓的是靜態檔案本身的結構漂移，例如某幾個地區頁多留了一張沒被清掉的佔位卡。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { suite } from "../harness.mjs";
import { REGIONS, REGION_NAMES } from "../regions.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const FIXED_SECTIONS = [
  { id: "overview", label: "01", eyebrow: "A SLOW JOURNEY" },
  { id: "spots", label: "02", eyebrow: "PLACES", h2: "景點" },
  { id: "food", label: "03", eyebrow: "TABLE", h2: "美食" },
  { id: "stays", label: "04", eyebrow: "STAY &amp; MOVE", h2: "住宿與交通" },
  { id: "notes", label: "05", eyebrow: "JOURNAL", h2: "旅行筆記" }
];
const NAV_LINKS = [
  ["#overview", "旅程摘要"], ["#spots", "景點"], ["#food", "美食"],
  ["#stays", "住宿"], ["#notes", "旅行筆記"]
];
const SCRIPTS = [
  "../../../assets/js/themes.js",
  "../../../assets/js/theme-switcher.js",
  "../../../assets/js/region-detail.js"
];

export const regionSkeleton = suite("地區頁 · HTML 骨架一致性", async (b, t) => {
  for (const slug of REGIONS) {
    const path = join(repoRoot, "countries", "japan", slug, "index.html");
    const html = readFileSync(path, "utf8");
    const p = (label, ok, detail) => t.check(`${slug}：${label}`, ok, detail);

    p("doctype 與 html lang 正確",
      html.startsWith('<!doctype html>\n<html lang="zh-Hant">'));

    p("head 樣板正確（title／favicon／font-awesome／style.css 路徑深度）",
      html.includes("<title>出去玩</title>")
        && html.includes('href="../../../assets/images/favicon.svg"')
        && html.includes('href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"')
        && html.includes('href="../../../assets/css/style.css"'));

    const bodyTag = html.match(/<body([^>]*)>/);
    p("body 沒有多餘 class", bodyTag?.[1] === "", bodyTag?.[1]);

    const heroMatch = html.match(/<section class="region-hero region-hero-([a-z-]+)">/);
    p("region-hero class 與資料夾名稱一致",
      heroMatch?.[1] === slug, `class 上是 ${heroMatch?.[1]}`);
    p("region-hero-content 有 eyebrow／h1／p",
      /<div class="region-hero-content"><span class="eyebrow">[^<]+<\/span><h1>[^<]+<\/h1><p>[^<]+<\/p><\/div>/.test(html));

    const navLinks = html.match(/<nav class="region-section-nav"[^>]*>(.*?)<\/nav>/s)?.[1] ?? "";
    const actualNav = [...navLinks.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map((m) => [m[1], m[2]]);
    p("導覽列 5 個連結、順序與文字正確",
      JSON.stringify(actualNav) === JSON.stringify(NAV_LINKS), JSON.stringify(actualNav));

    const sectionMatches = [...html.matchAll(
      /<section id="(\w+)" class="region-section"><div class="region-section-label">(\d+)<\/div><div><p class="eyebrow">([^<]+)<\/p><h2>([^<]*)/g
    )];
    const actualSections = sectionMatches.map((m) => ({ id: m[1], label: m[2], eyebrow: m[3], h2: m[4] }));
    p("五個章節 id／編號／eyebrow 依序出現",
      actualSections.length === 5
        && FIXED_SECTIONS.every((expected, i) =>
          actualSections[i]?.id === expected.id
          && actualSections[i]?.label === expected.label
          && actualSections[i]?.eyebrow === expected.eyebrow),
      JSON.stringify(actualSections));
    const nonOverviewOk = FIXED_SECTIONS.slice(1).every((expected, i) =>
      actualSections[i + 1]?.h2 === expected.h2);
    p("spots／food／stays／notes 的標題文字固定正確（overview 是自由敘述，不檢查）",
      nonOverviewOk, JSON.stringify(actualSections.slice(1).map((s) => s.h2)));

    p("footer 文字正確", html.includes('<footer class="site-footer">Travel Journal</footer>'));

    const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
    p("三個 script 依序載入，且無 defer",
      JSON.stringify(scripts) === JSON.stringify(SCRIPTS) && !html.includes("defer"),
      JSON.stringify(scripts));

    const breadcrumbCurrent = html.match(/<span class="breadcrumb-current" aria-current="page">([^<]+)<\/span>/)?.[1];
    p("breadcrumb 顯示的地區名與 tests/regions.mjs 一致",
      breadcrumbCurrent === REGION_NAMES[slug], breadcrumbCurrent);
  }
});
