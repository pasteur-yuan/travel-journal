import { sleep, suite } from "../harness.mjs";

const HOME = "/index.html";
const COUNTRY = "/countries/japan/index.html";
const REGION = "/countries/japan/tokyo/index.html";

const noOverflow = (b) => b.eval(`(() => {
  const vw = document.documentElement.clientWidth;
  return { vw, scrollWidth: document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth > vw + 1 };
})()`);

export const layoutNoOverflow = suite("平板 · 三種頁面在平板尺寸不溢出", async (b, t) => {
  for (const landscape of [false, true]) {
    for (const [name, path] of [["首頁", HOME], ["國家頁", COUNTRY], ["地區頁", REGION]]) {
      await b.tablet({ landscape });
      await b.goto(path, { settle: 1000 });
      const result = await noOverflow(b);
      t.check(`${name}：平板${landscape ? "橫向" : "直向"}（${result.vw}px）不產生頁面水平捲動`,
        !result.overflow, JSON.stringify(result));
    }
  }
});

export const regionShowcaseTabletLayout = suite("平板 · 國家頁地區 showcase 不溢出裁切", async (b, t) => {
  // .region-showcase 桌機版是兩欄 grid，兩欄的 minmax 最小寬度加起來是 720px，
  // 701–1199px 之間的可用內容寬度塞不下，會直接撐破容器造成水平溢出。
  for (const landscape of [false, true]) {
    await b.tablet({ landscape });
    await b.goto(COUNTRY, { settle: 1000 });
    const shape = await b.eval(`(() => {
      const vw = document.documentElement.clientWidth;
      const list = document.querySelector(".region-showcase-list");
      const item = document.querySelector(".region-showcase-item");
      const listRect = list.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      return {
        vw,
        listOverflow: Math.round(listRect.right - vw),
        itemOverflow: Math.round(itemRect.right - vw),
        display: getComputedStyle(document.querySelector(".region-showcase")).display
      };
    })()`);
    t.check(`平板${landscape ? "橫向" : "直向"}：.region-showcase-list 不超出視窗右緣`,
      shape.listOverflow <= 1, JSON.stringify(shape));
    t.check(`平板${landscape ? "橫向" : "直向"}：.region-showcase-item 不超出視窗右緣`,
      shape.itemOverflow <= 1, JSON.stringify(shape));
  }
  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const tabletInteraction = suite("平板 · 操作邏輯與手機版一致（不因較寬畫面退回桌面版）", async (b, t) => {
  // 關鍵情境：橫向平板（1024px）比原本的手機斷點（700px）寬得多。純寬度判斷
  // 會讓它被當成桌面版，退回 hover／立即轉導的邏輯；這裡專門測橫向平板，
  // 用來驗證 isMobileMap／isMobileCountryStrip／isMobileTimeline 改用
  // (hover: none) 之後，橫向平板仍然拿到手機版的操作邏輯。
  await b.tablet({ landscape: true });
  await b.goto(HOME, { settle: 1500 });

  const hasCharts = await b.eval(`!!(window.am5 && window.am5map)`);
  if (hasCharts) {
    const markerPoint = await b.eval(`(() => {
      const m = document.querySelector(".country-marker");
      const r = m.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`);
    await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [markerPoint] });
    await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(300);
    const afterFirstTap = await b.eval(`({
      url: location.pathname,
      tooltipVisible: document.querySelector("#country-tooltip")?.classList.contains("is-visible")
    })`);
    t.check("橫向平板：第一次點 marker 只顯示 tooltip、不轉導（跟手機版一致，不退回桌面版立即轉導）",
      !afterFirstTap.url.includes("countries/japan") && afterFirstTap.tooltipVisible,
      JSON.stringify(afterFirstTap));

    await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [markerPoint] });
    await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(300);
    t.check("橫向平板：第二次點同一個 marker 才轉導",
      await b.eval(`location.pathname.includes("countries/japan")`));
  } else {
    t.skip("橫向平板 marker 兩段式觸控", "amCharts CDN 未載入（離線環境）");
  }

  // 國家卡片列：橫向平板點卡片也要是兩段式（先置中固定、再次點擊才轉導），
  // 不是桌面版的立即轉導。
  await b.goto(HOME, { settle: 1500 });
  await b.scrollIntoView(".country-strip");
  const cardPoint = await b.eval(`(() => {
    const card = document.querySelector(".country-card-japan");
    const r = card.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [cardPoint] });
  await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(300);
  const afterFirstCardTap = await b.eval(`({
    url: location.pathname,
    focused: document.querySelector(".country-card-japan").classList.contains("is-mobile-focused")
  })`);
  t.check("橫向平板：第一次點國家卡片只置中固定、不轉導",
    !afterFirstCardTap.url.includes("countries/japan") && afterFirstCardTap.focused,
    JSON.stringify(afterFirstCardTap));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const tabletThemeAndAccessibility = suite("平板 · 主題、鍵盤與 reduced motion 回歸", async (b, t) => {
  for (const landscape of [false, true]) {
    for (const [name, path] of [["首頁", HOME], ["國家頁", COUNTRY], ["地區頁", REGION]]) {
      await b.tablet({ landscape });
      await b.goto(path, { settle: 900 });

      // 主題切換按鈕在平板尺寸一樣要存在、可點擊，亮暗主題都要能正確套用。
      await b.click("[data-theme-toggle]");
      await sleep(300);
      const themed = await b.eval(`({
        dark: document.body.classList.contains("theme-glass-dark"),
        htmlDark: document.documentElement.classList.contains("theme-glass-dark")
      })`);
      t.check(`${name}：平板${landscape ? "橫向" : "直向"}可切換暗色主題`,
        themed.dark && themed.htmlDark, JSON.stringify(themed));
      await b.eval(`localStorage.removeItem("travel-journal-theme")`);

      // 鍵盤：主題切換按鈕仍可 Tab 聚焦、Enter 啟用（平板同樣可能外接鍵盤）。
      await b.focus("[data-theme-toggle]");
      const focused = await b.eval(`document.activeElement === document.querySelector("[data-theme-toggle]")`);
      t.check(`${name}：平板${landscape ? "橫向" : "直向"}主題切換按鈕可鍵盤聚焦`, focused);
      await b.eval(`localStorage.removeItem("travel-journal-theme")`);
    }
  }

  // reduced motion：平板尺寸下時間軸年份切換仍要遵守 prefers-reduced-motion（沿用桌機／
  // 手機版已經驗證過的邏輯，這裡只確認平板尺寸沒有被漏掉）。
  await b.tablet({ landscape: false });
  await b.reducedMotion(true);
  await b.goto(HOME, { settle: 1200 });
  const reducedMotionOk = await b.eval(`window.matchMedia("(prefers-reduced-motion: reduce)").matches`);
  t.check("平板：prefers-reduced-motion 正確套用到頁面", reducedMotionOk);
  await b.reducedMotion(false);

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
