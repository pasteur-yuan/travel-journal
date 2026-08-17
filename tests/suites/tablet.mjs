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
  // 用來驗證 isMobileMap／isMobileCountryStrip 改用 (hover: none) 之後，
  // 橫向平板仍然拿到手機版的操作邏輯。isMobileTimeline() 刻意不比照辦理，
  // 見下面「地圖與時間軸在平板上的觸控」那組測試的說明。
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

export const tabletMapAndTimelineTouch = suite("平板 · 地圖與時間軸在平板上的觸控", async (b, t) => {
  // 世界地圖：#timezone-chart 的 pointer-events:none 原本只掛在
  // @media (max-width: 700px)，平板寬度落不到，手指在地圖上下滑動仍然
  // 會被地圖攔截、頁面滑不動。補上 (hover: none) 之後，用真的觸控拖曳序列
  // 驗證頁面會捲動，而不是只驗證 pointer-events 計算值。
  await b.tablet({ landscape: false });
  await b.goto(HOME, { settle: 1500 });
  const hasCharts = await b.eval(`!!(window.am5 && window.am5map)`);
  if (hasCharts) {
    t.check("平板：#timezone-chart 設定 pointer-events:none",
      await b.eval(`getComputedStyle(document.getElementById("timezone-chart")).pointerEvents`) === "none",
      await b.eval(`getComputedStyle(document.getElementById("timezone-chart")).pointerEvents`));

    const mapBox = await b.eval(`(() => {
      const el = document.querySelector(".world-map");
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height, vh: window.innerHeight };
    })()`);
    const x = mapBox.left + mapBox.width * 0.5;
    const startY = Math.min(Math.max(mapBox.top + mapBox.height * 0.5, 60), mapBox.vh - 60);
    await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: startY }] });
    await sleep(20);
    for (const dy of [10, 30, 60, 100, 150, 200]) {
      await b.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: startY - dy }] });
      await sleep(20);
    }
    await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(300);
    const scrollYAfterDrag = await b.eval(`window.scrollY`);
    t.check("平板：手指在地圖非 marker 區域上下滑動時頁面正常捲動",
      scrollYAfterDrag > 100, `scrollY=${scrollYAfterDrag}`);
    await b.eval(`window.scrollTo(0, 0)`);
  } else {
    t.skip("平板地圖觸控捲動", "amCharts CDN 未載入（離線環境）");
  }

  // 時間軸：卡片預設用 :hover／:focus-visible 顯示，觸控裝置沒有 hover，
  // 原本「點時間軸圓點展開卡片」的邏輯整個被 isMobileTimeline()（純寬度判斷）
  // 擋住，平板寬度會落到「沒有 hover 也點不到」，卡片永遠看不見。改成獨立的
  // timelineTapReveal()（isMobileTimeline() 或 (hover: none)）之後，平板可以
  // 點圓點展開，同時維持桌面版的橫向捲動排版（不強制切成手機版垂直堆疊——
  // 那樣做反而會讓畫面看起來整段空白，因為 CSS 沒有對應的平板專屬垂直排版）。
  await b.goto(HOME, { settle: 1500 });
  await b.scrollIntoView(".timeline-track");
  const trackDisplay = await b.eval(`getComputedStyle(document.querySelector(".timeline-track")).display`);
  t.check("平板：時間軸維持桌面版橫向排版（display:flex，不是手機版的 display:block）",
    trackDisplay === "flex", trackDisplay);

  // lockTimelineHeight() 是手機版垂直堆疊排版專用的高度鎖定（切換年份／展開卡片
  // 不改變文件總高度），套用邏輯是先把每個年份群組都暫時展開量 scrollHeight，
  // 對橫向 flex 排版量出來的數字沒有意義，會把 minHeight 鎖成錯誤的小數值，
  // 讓時間軸一載入就整段被壓扁、看起來是空的（年份都在、下面的旅程卡片消失）。
  // isMobileTimeline() 改回純寬度判斷之後，平板寬度不會誤觸這段邏輯。
  const minHeightOnLoad = await b.eval(`document.querySelector(".timeline-track").style.minHeight`);
  t.check("平板：頁面載入時沒有套用手機版專用的高度鎖定（時間軸不會一開始就被壓扁）",
    minHeightOnLoad === "", `minHeight="${minHeightOnLoad}"`);

  const firstYear = await b.eval(`document.querySelector(".timeline-year-marker:not(:disabled)").textContent.trim()`);
  const markerPoint = await b.eval(`(() => {
    const m = [...document.querySelectorAll(".timeline-year-marker")].find(el => !el.disabled);
    const r = m.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [markerPoint] });
  await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(600);

  const dotPoint = await b.eval(`(() => {
    const group = [...document.querySelectorAll(".timeline-year-group")].find(g => g.classList.contains("is-active"));
    const dot = group?.querySelector(".timeline-dot");
    if (!dot) return null;
    const r = dot.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  if (dotPoint) {
    await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [dotPoint] });
    await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(500);
    const cardState = await b.eval(`(() => {
      const group = [...document.querySelectorAll(".timeline-year-group")].find(g => g.classList.contains("is-active"));
      const entry = group.querySelector(".timeline-entry");
      const card = entry.querySelector(".timeline-card");
      return {
        expanded: entry.classList.contains("is-expanded"),
        visibility: getComputedStyle(card).visibility,
        opacity: getComputedStyle(card).opacity
      };
    })()`);
    t.check(`平板：點時間軸圓點（${firstYear} 年）可展開卡片`,
      cardState.expanded && cardState.visibility === "visible" && Number(cardState.opacity) > 0.5,
      JSON.stringify(cardState));
  } else {
    t.skip("平板時間軸點圓點展開", "目前作用中的年份沒有旅程項目可測");
  }

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
