import { sleep, suite } from "../harness.mjs";

export const map = suite("首頁 · 世界地圖", async (b, t) => {
  await b.desktop();
  await b.goto("/index.html", { settle: 1600 });

  t.check("地圖容器存在", await b.eval(`!!document.querySelector("#world-map")`));
  t.check("夜晚區域已依 UTC 時間定位", await b.eval(
    `(() => { const l = document.querySelector("#night-zone").style.left; return !!l && l !== "0px"; })()`),
    await b.eval(`document.querySelector("#night-zone").style.left`));

  const nightWrap = await b.eval(`(() => {
    const viewport = document.querySelector(".night-zone-viewport");
    const read = (selector) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return rect && { left: rect.left, right: rect.right };
    };
    const sample = (hour) => {
      if (!viewport || typeof window.updateDayNight !== "function") return null;
      window.updateDayNight(new Date(Date.UTC(2026, 0, 1, hour, 0, 0)));
      const bounds = viewport.getBoundingClientRect();
      return {
        bounds: { left: bounds.left, right: bounds.right },
        primary: read('[data-night-zone-offset="0"]'),
        before: read('[data-night-zone-offset="-1"]'),
        after: read('[data-night-zone-offset="1"]')
      };
    };
    const result = {
      exists: !!viewport,
      overflow: viewport && getComputedStyle(viewport).overflow,
      layers: document.querySelectorAll(".night-zone").length,
      enteringLeft: sample(11),
      enteringRight: sample(13)
    };
    window.updateDayNight?.();
    return result;
  })()`);
  t.check("夜晚區域限制在地圖裁切視窗內",
    nightWrap.exists && nightWrap.overflow === "hidden",
    JSON.stringify(nightWrap));
  t.check("夜晚區域保留左右環繞副本", nightWrap.layers === 3, `${nightWrap.layers} 個圖層`);
  t.check("遮罩越過左緣時會從右側同步出現", (() => {
    const state = nightWrap.enteringLeft;
    if (!state) return false;
    return state.primary.left < state.bounds.left && state.after.left < state.bounds.right && state.after.right > state.bounds.right;
  })(), JSON.stringify(nightWrap.enteringLeft));
  t.check("遮罩越過右緣時會從左側同步出現", (() => {
    const state = nightWrap.enteringRight;
    if (!state) return false;
    return state.primary.right > state.bounds.right && state.before.left < state.bounds.left && state.before.right > state.bounds.left;
  })(), JSON.stringify(nightWrap.enteringRight));

  const hasCharts = await b.eval(`!!(window.am5 && window.am5map)`);
  if (!hasCharts) {
    t.skip("amCharts marker 相關檢查", "amCharts CDN 未載入（離線環境）");
    return;
  }

  const markers = await b.eval(`[...document.querySelectorAll(".country-marker")].map(m => ({
    flag: m.textContent, label: m.getAttribute("aria-label"),
    left: parseFloat(m.style.left), top: parseFloat(m.style.top), tag: m.tagName
  }))`);
  t.check("marker 由資料產生", markers.length >= 1, `${markers.length} 個`);
  t.check("marker 是可聚焦的 button", markers.every((m) => m.tag === "BUTTON"),
    markers.map((m) => m.tag).join());
  t.check("marker 有 aria-label", markers.every((m) => m.label?.length > 0),
    JSON.stringify(markers.map((m) => m.label)));
  t.check("marker 已換算成容器座標", markers.every((m) => m.left > 0 && m.top > 0),
    JSON.stringify(markers.map((m) => [m.left, m.top])));

  await b.hover(".country-marker");
  const tip = await b.eval(`(() => {
    const tip = document.querySelector("#country-tooltip");
    return { visible: tip.classList.contains("is-visible"), text: tip.textContent,
             hidden: tip.getAttribute("aria-hidden"),
             focused: document.querySelector("#world-map").classList.contains("is-country-focused") };
  })()`);
  t.check("hover marker 顯示 tooltip", tip.visible && tip.text.includes("UTC"), JSON.stringify(tip));
  t.check("tooltip 同步更新 aria-hidden", tip.hidden === "false", tip.hidden);
  t.check("hover marker 時地圖進入 focus 狀態", tip.focused);

  // 滑出地圖後 tooltip 必須隱藏
  await b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5, button: "none" });
  await sleep(300);
  t.check("滑鼠離開 marker 後 tooltip 隱藏", await b.eval(
    `!document.querySelector("#country-tooltip").classList.contains("is-visible")`));

  // 在地圖上移動時，時區標籤要跟著換算
  const label = await b.eval(`(() => {
    const map = document.querySelector("#world-map");
    const r = map.getBoundingClientRect();
    map.dispatchEvent(new PointerEvent("pointermove", {
      clientX: r.left + r.width * 0.75, clientY: r.top + r.height / 2, bubbles: true }));
    return document.querySelector("#timezone-label").textContent;
  })()`);
  t.check("地圖上移動會更新時區標籤", /^UTC [+−]\d{2}:00$/.test(label), label);

  // 桌面版點擊 marker 要立即轉導，不受手機版兩段式觸控邏輯影響。
  await b.click(".country-marker");
  await sleep(300);
  t.check("桌面版點擊 marker 立即轉導（不受手機版兩段式觸控影響）",
    await b.eval(`location.pathname.includes("countries/japan")`));

  t.check("首頁無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const mapMobile = suite("首頁 · 世界地圖（手機版兩段式 marker）", async (b, t) => {
  await b.mobile();
  await b.goto("/index.html", { settle: 1600 });

  const hasCharts = await b.eval(`!!(window.am5 && window.am5map)`);
  if (!hasCharts) {
    t.skip("手機版 marker 相關檢查", "amCharts CDN 未載入（離線環境）");
    return;
  }

  t.check("地圖底層設定 touch-action:pan-y（非 marker 區域上下滑動時交還頁面捲動）",
    await b.eval(`getComputedStyle(document.getElementById("timezone-chart")).touchAction`) === "pan-y",
    await b.eval(`getComputedStyle(document.getElementById("timezone-chart")).touchAction`));
  t.check("地圖底層不可選取",
    await b.eval(`getComputedStyle(document.getElementById("timezone-chart")).userSelect`) === "none",
    await b.eval(`getComputedStyle(document.getElementById("timezone-chart")).userSelect`));
  // touch-action 實機測試無效（amCharts5 在 canvas 上對 touchstart 呼叫
  // preventDefault()，compositor 並未略過接手捲動），改用 pointer-events: none
  // 讓 canvas 完全跳出 hit-test；這裡直接送出觸控拖曳序列驗證頁面真的會捲動，
  // 而不是只檢查計算樣式（touch-action 那兩項計算樣式檢查即使修法失效也會過）。
  t.check("手機版地圖底層跳出 hit-test（pointer-events: none）",
    await b.eval(`getComputedStyle(document.getElementById("timezone-chart")).pointerEvents`) === "none",
    await b.eval(`getComputedStyle(document.getElementById("timezone-chart")).pointerEvents`));

  const dragScrollBox = await b.eval(`(() => {
    const el = document.querySelector(".world-map");
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, vh: window.innerHeight };
  })()`);
  const dragX = dragScrollBox.left + dragScrollBox.width * 0.5;
  const dragStartY = Math.min(Math.max(dragScrollBox.top + dragScrollBox.height * 0.5, 60), dragScrollBox.vh - 60);
  await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: dragX, y: dragStartY }] });
  await sleep(20);
  for (const dy of [10, 30, 60, 100, 150, 200]) {
    await b.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: dragX, y: dragStartY - dy }] });
    await sleep(20);
  }
  await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(300);
  const scrollYAfterDrag = await b.eval(`window.scrollY`);
  t.check("手指在地圖非 marker 區域上下滑動時頁面正常捲動（不被地圖攔截）",
    scrollYAfterDrag > 100, `scrollY=${scrollYAfterDrag}`);
  await b.eval(`window.scrollTo(0, 0)`);
  await sleep(200);

  // 左右拖曳不會撐大頁面寬度、把整頁卡在拖到一半的位置回不去。光暈的 --map-pointer-x
  // 直接讀游標相對座標、沒有上限夾制，手指靠近地圖右側時 18rem 寬的光暈本體會整個
  // 推出手機版 viewport 外；.world-map 沒裁乾淨的話 document 的 scrollWidth 會被撐大，
  // 瀏覽器就會把左右拖曳當成頁面橫向捲動處理。
  const dragXBox = await b.eval(`(() => {
    const el = document.querySelector(".world-map");
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, vh: window.innerHeight };
  })()`);
  const dragStartX = dragXBox.left + dragXBox.width * 0.8;
  const dragY = Math.min(Math.max(dragXBox.top + dragXBox.height * 0.5, 60), dragXBox.vh - 60);
  await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: dragStartX, y: dragY }] });
  await sleep(20);
  for (const dx of [10, 30, 60, 100, 150, 200]) {
    await b.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: dragStartX - dx, y: dragY }] });
    await sleep(20);
  }
  const widthDuringDrag = await b.eval(`({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  })`);
  await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(300);
  const scrollXAfterDrag = await b.eval(`window.scrollX`);
  t.check("手指在地圖上左右拖曳不會撐大頁面寬度（地圖光暈裁在卡片內）",
    widthDuringDrag.scrollWidth === widthDuringDrag.clientWidth, JSON.stringify(widthDuringDrag));
  t.check("手指在地圖上左右拖曳後頁面沒有被拖到卡住（scrollX 回到 0）",
    scrollXAfterDrag === 0, `scrollX=${scrollXAfterDrag}`);

  // 「只保留已探索國家的可點擊 icon」：手機版時區多邊形本身不應保留原生互動，
  // 避免它接手觸控手勢、攔截本該交給頁面捲動的滑動。
  const interactive = await b.eval(`(() => {
    const root = am5.registry.rootElements[0];
    const chart = root.container.children.getIndex(0);
    const flags = [];
    chart.series.each((series) => { if (series.mapPolygons) flags.push(series.mapPolygons.template.get("interactive")); });
    return flags;
  })()`);
  t.check("手機版時區多邊形皆非原生互動", interactive.every((f) => !f), JSON.stringify(interactive));

  const markerPoint = await b.eval(`(() => {
    const m = document.querySelector(".country-marker");
    const r = m.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);

  // 第一次點擊：只固定顯示 tooltip，不轉導。
  await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [markerPoint] });
  await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(300);
  const afterFirstTap = await b.eval(`({
    url: location.pathname,
    tooltipVisible: document.querySelector("#country-tooltip")?.classList.contains("is-visible"),
    focused: document.querySelector("#world-map").classList.contains("is-country-focused")
  })`);
  t.check("手機版第一次點擊 marker 只顯示 tooltip、不轉導",
    !afterFirstTap.url.includes("countries/japan") && afterFirstTap.tooltipVisible && afterFirstTap.focused,
    JSON.stringify(afterFirstTap));

  // 第二次點擊同一個 marker：轉導。
  await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [markerPoint] });
  await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(300);
  t.check("手機版第二次點擊同一個 marker 才轉導",
    await b.eval(`location.pathname.includes("countries/japan")`));

  // 回上一頁，測試點擊地圖外側會收起已固定的 tooltip。
  await b.goto("/index.html", { settle: 1200 });
  const point2 = await b.eval(`(() => {
    const m = document.querySelector(".country-marker");
    const r = m.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point2] });
  await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(300);
  const pinned = await b.eval(`document.querySelector("#country-tooltip").classList.contains("is-visible")`);
  t.check("點擊地圖外側前，tooltip 確實已固定", pinned);

  const outsidePoint = await b.eval(`(() => {
    const el = document.querySelector(".site-header .brand");
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [outsidePoint] });
  await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(300);
  const afterOutsideTap = await b.eval(`({
    url: location.pathname,
    tooltipVisible: document.querySelector("#country-tooltip")?.classList.contains("is-visible"),
    focused: document.querySelector("#world-map").classList.contains("is-country-focused")
  })`);
  t.check("點擊地圖外側會收起已固定的 tooltip、不會轉導",
    !afterOutsideTap.url.includes("countries/japan") && !afterOutsideTap.tooltipVisible && !afterOutsideTap.focused,
    JSON.stringify(afterOutsideTap));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const summary = suite("首頁 · 已探索與旅行足跡（由時間軸推導）", async (b, t) => {
  await b.desktop();
  await b.goto("/index.html", { settle: 1200 });

  const data = await b.eval(`(() => {
    const entries = [...document.querySelectorAll(".timeline-entry")];
    const countries = [...new Set(entries.map(e => e.dataset.country).filter(Boolean))];
    // 地區改用 tag 方式統計：一個節點可能同時標記多個地區（見 dataset.regions，
    // 逗號分隔），地區數是攤平去重後的真實地區數，不是「節點數」。
    const regions = new Set(entries.flatMap(e => (e.dataset.regions || "").split(",").filter(Boolean)));
    return {
      countries, regionCount: regions.size, entryCount: entries.length,
      legend: [...document.querySelectorAll(".map-legend > span:not(.map-legend-label)")].map(s => s.textContent),
      stats: [...document.querySelectorAll(".map-stats > span:not(.map-stats-label)")].map(s => s.textContent.trim())
    };
  })()`);

  t.check("每個時間軸項目都有 data-country / data-regions",
    data.countries.length > 0 && data.regionCount > 0,
    `國家 ${data.countries.length}、地區 ${data.regionCount}`);
  t.check("已探索清單等於時間軸出現過的國家",
    JSON.stringify(data.legend) === JSON.stringify(data.countries),
    `清單 ${JSON.stringify(data.legend)} vs 資料 ${JSON.stringify(data.countries)}`);
  t.check("國家數與清單一致",
    data.stats[0] === `${String(data.countries.length).padStart(2, "0")} 國家`, data.stats[0]);
  t.check("地區數由地區 tag 真實統計（可能不等於節點數）",
    data.stats[1] === `${String(data.regionCount).padStart(2, "0")} 地區`, data.stats[1]);
  t.check("不再顯示旅行節點統計",
    data.stats.length === 2, JSON.stringify(data.stats));
  t.check("數字皆為兩位數補零", data.stats.every((s) => /^\d{2} /.test(s)), JSON.stringify(data.stats));
});

const toggleState = (b, sel) => b.eval(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  return { expanded: el.classList.contains("is-expanded"), aria: el.getAttribute("aria-expanded") };
})()`);

export const legendStatsToggle = suite("首頁 · 已探索與旅行足跡點擊收折", async (b, t) => {
  await b.desktop();
  await b.goto("/index.html", { settle: 1200 });

  // 原本只靠 CSS :hover／:focus-within 展開，.map-legend 過去沒有 tabindex，
  // 觸控與鍵盤完全展開不了。改成點擊／Enter／Space 明確切換，且要能與既有
  // hover／focus 表現共存（hover 是暫時預覽，點擊是釘住），兩者不衝突。
  const initial = await toggleState(b, ".map-legend");
  t.check("已探索：初始為收折狀態", !initial.expanded && initial.aria === "false", JSON.stringify(initial));

  await b.click(".map-legend");
  const afterClick = await toggleState(b, ".map-legend");
  t.check("已探索：點擊後展開，aria-expanded 同步", afterClick.expanded && afterClick.aria === "true",
    JSON.stringify(afterClick));

  await b.click(".map-legend");
  const afterSecondClick = await toggleState(b, ".map-legend");
  t.check("已探索：再次點擊收折", !afterSecondClick.expanded && afterSecondClick.aria === "false",
    JSON.stringify(afterSecondClick));

  // 鍵盤：Tab 聚焦後 Enter／Space 切換，跟滑鼠點擊走同一套邏輯。
  await b.focus(".map-stats");
  await b.press("Enter");
  const afterEnter = await toggleState(b, ".map-stats");
  t.check("旅行足跡：鍵盤 Enter 可展開", afterEnter.expanded && afterEnter.aria === "true", JSON.stringify(afterEnter));
  await b.press("Enter");
  const afterEnter2 = await toggleState(b, ".map-stats");
  t.check("旅行足跡：再次 Enter 收折", !afterEnter2.expanded && afterEnter2.aria === "false", JSON.stringify(afterEnter2));
  await b.press(" ");
  const afterSpace = await toggleState(b, ".map-stats");
  t.check("旅行足跡：Space 也可切換", afterSpace.expanded && afterSpace.aria === "true", JSON.stringify(afterSpace));

  // 點擊地圖外側會收起已展開的資訊框（兩個都測，且互不干擾彼此的狀態）。
  await b.click(".map-legend"); // 展開已探索
  const bothExpanded = { legend: await toggleState(b, ".map-legend"), stats: await toggleState(b, ".map-stats") };
  t.check("點擊外側前，已探索與旅行足跡都已展開", bothExpanded.legend.expanded && bothExpanded.stats.expanded,
    JSON.stringify(bothExpanded));
  await b.click(".site-header .brand");
  await sleep(100);
  const afterOutsideClick = { legend: await toggleState(b, ".map-legend"), stats: await toggleState(b, ".map-stats") };
  t.check("點擊外側後，兩個資訊框都收折", !afterOutsideClick.legend.expanded && !afterOutsideClick.stats.expanded,
    JSON.stringify(afterOutsideClick));

  // 兩個資訊框各自獨立：只展開一個，另一個不受影響。
  await b.click(".map-legend");
  const onlyLegend = { legend: await toggleState(b, ".map-legend"), stats: await toggleState(b, ".map-stats") };
  t.check("只點已探索時，旅行足跡不受影響", onlyLegend.legend.expanded && !onlyLegend.stats.expanded,
    JSON.stringify(onlyLegend));
  await b.click(".map-legend");

  // hover 既有行為不受影響：不點擊，單純 hover 仍要能展開（暫時預覽，跟點擊釘住並存）。
  await b.hover(".map-legend");
  await sleep(350);
  const hoverOpacity = await b.eval(
    `getComputedStyle(document.querySelector(".map-legend > span:not(.map-legend-label)")).opacity`);
  t.check("純 hover（沒有點擊）仍可展開內容，不受新邏輯影響", hoverOpacity === "1", hoverOpacity);
  const hoverNotPinned = await toggleState(b, ".map-legend");
  t.check("純 hover 不會設定 aria-expanded（只有點擊才是釘住狀態）",
    !hoverNotPinned.expanded && hoverNotPinned.aria === "false", JSON.stringify(hoverNotPinned));

  // 手機版：觸控 tap 走一樣的 click 事件路徑。
  await b.mobile();
  await b.goto("/index.html", { settle: 1200 });
  await b.tap(".map-legend");
  const mobileExpanded = await toggleState(b, ".map-legend");
  t.check("手機版：tap 可展開已探索", mobileExpanded.expanded && mobileExpanded.aria === "true",
    JSON.stringify(mobileExpanded));
  await b.tap(".map-legend");
  const mobileCollapsed = await toggleState(b, ".map-legend");
  t.check("手機版：再次 tap 收折", !mobileCollapsed.expanded && mobileCollapsed.aria === "false",
    JSON.stringify(mobileCollapsed));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
