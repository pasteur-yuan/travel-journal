// 全站健康檢查：每個頁面都要能載入、資源路徑正確、導覽可用。
// GitHub Pages 大小寫敏感，相對路徑錯誤在本機 file:// 下常常看不出來。
import { suite } from "../harness.mjs";
import { REGIONS, REGION_NAMES, regionPage } from "../regions.mjs";

const PAGES = [
  ["首頁", "/index.html"],
  ["日本國家頁", "/countries/japan/index.html"],
  ...REGIONS.map((region) => [REGION_NAMES[region], regionPage(region)])
];

export const health = suite("全站 · 頁面載入與資源路徑", async (b, t) => {
  await b.desktop();

  for (const [name, path] of PAGES) {
    await b.goto(path, { settle: 900 });

    // 只看本機資源；CDN（amCharts / Font Awesome / Google Fonts）失效不算頁面問題
    // 未宣告 favicon 時 Chrome 會自行探測 /favicon.ico；這不是頁面引用的本機資源。
    const localFailures = b.failedRequests.filter((r) => r.includes("127.0.0.1") && !r.endsWith("/favicon.ico"));
    t.check(`${name}：本機資源全部載入成功`,
      localFailures.length === 0, localFailures.slice(0, 2).join("；") || "none");
    t.check(`${name}：無 JS 例外`, b.errors.length === 0, b.errors.join(" | ") || "none");

    const shape = await b.eval(`(async () => {
      const brand = document.querySelector(".brand");
      const favicon = document.querySelector('link[rel~="icon"]');
      const styles = [...document.styleSheets].filter(s => s.href && s.href.includes("127.0.0.1"));
      const faviconIsSuitcase = favicon
        ? await fetch(favicon.href).then((res) => res.text()).then((svg) => svg.includes(">🧳</text>")).catch(() => false)
        : false;
      return {
        title: document.title,
        lang: document.documentElement.lang,
        faviconHref: favicon?.href,
        faviconIsSuitcase,
        brandHref: brand?.getAttribute("href"),
        localStylesLoaded: styles.every(s => { try { return s.cssRules.length > 0; } catch { return false; } }),
        rootScrollbar: getComputedStyle(document.documentElement).scrollbarWidth,
        bodyScrollbar: getComputedStyle(document.body).scrollbarWidth,
        current: document.querySelectorAll('[aria-current="page"]').length,
        footer: document.querySelector(".site-footer")?.textContent?.trim(),
        images: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src)
      };
    })()`);

    t.check(`${name}：分頁標題為出去玩且有語言標記`,
      shape.title === "出去玩" && shape.lang === "zh-Hant", `${shape.title} / ${shape.lang}`);
    t.check(`${name}：使用本地行李箱 emoji favicon`,
      (shape.faviconHref || "").endsWith("/assets/images/favicon.svg") && shape.faviconIsSuitcase,
      `${shape.faviconHref} / suitcase=${shape.faviconIsSuitcase}`);
    t.check(`${name}：頁面垂直捲動條維持隱藏`,
      shape.rootScrollbar === "none" && shape.bodyScrollbar === "none",
      `html=${shape.rootScrollbar}, body=${shape.bodyScrollbar}`);
    t.check(`${name}：本機樣式表確實套用`, shape.localStylesLoaded);
    t.check(`${name}：Logo 可回首頁`,
      (shape.brandHref || "").endsWith("index.html"), shape.brandHref);
    t.check(`${name}：圖片全部載入`, shape.images.length === 0, shape.images.slice(0, 2).join("；") || "none");

    if (path !== "/index.html") {
      t.check(`${name}：麵包屑標記目前頁面`, shape.current === 1, `${shape.current} 個 aria-current`);
    }
  }
});

export const links = suite("全站 · 內部連結有效性", async (b, t) => {
  await b.desktop();
  const checked = new Set();
  const broken = [];

  for (const [, path] of PAGES) {
    await b.goto(path, { settle: 700 });
    const hrefs = await b.eval(`[...document.querySelectorAll("a[href]")]
      .map(a => a.href).filter(h => h.startsWith("http://127.0.0.1") && !h.includes("#"))`);
    for (const href of hrefs) {
      if (checked.has(href)) continue;
      checked.add(href);
      const res = await fetch(href, { method: "HEAD" }).catch(() => null);
      if (!res || res.status >= 400) broken.push(`${href} → ${res ? res.status : "無回應"}`);
    }
  }

  t.check("站內連結全部有效", broken.length === 0,
    broken.slice(0, 3).join("；") || `已檢查 ${checked.size} 個連結`);
});

export const accessibility = suite("全站 · 可及性基本要求", async (b, t) => {
  await b.desktop();

  for (const [name, path] of PAGES) {
    await b.goto(path, { settle: 800 });
    const issues = await b.eval(`(() => {
      const iconOnly = [...document.querySelectorAll("button, a")].filter(el => {
        const text = el.textContent.replace(/\\s/g, "");
        return text.length === 0 && !el.querySelector("img[alt]:not([alt=''])");
      }).filter(el => !el.getAttribute("aria-label") && !el.getAttribute("title"));
      const decorativeIcons = [...document.querySelectorAll(".brand i, .region-showcase-arrow i")]
        .filter(i => i.getAttribute("aria-hidden") !== "true");
      return {
        unlabelled: iconOnly.map(el => el.className || el.tagName),
        decorative: decorativeIcons.length
      };
    })()`);

    t.check(`${name}：icon-only 控制項都有標籤`,
      issues.unlabelled.length === 0, JSON.stringify(issues.unlabelled));
    t.check(`${name}：裝飾性圖示標記 aria-hidden`,
      issues.decorative === 0, `${issues.decorative} 個未標記`);
  }
});
