import { sleep, suite } from "../harness.mjs";

export const map = suite("首頁 · 世界地圖", async (b, t) => {
  await b.desktop();
  await b.goto("/index.html", { settle: 1600 });

  t.check("地圖容器存在", await b.eval(`!!document.querySelector("#world-map")`));
  t.check("夜晚區域已依 UTC 時間定位", await b.eval(
    `(() => { const l = document.querySelector("#night-zone").style.left; return !!l && l !== "0px"; })()`),
    await b.eval(`document.querySelector("#night-zone").style.left`));

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

  t.check("首頁無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const summary = suite("首頁 · 已探索與旅行足跡（由時間軸推導）", async (b, t) => {
  await b.desktop();
  await b.goto("/index.html", { settle: 1200 });

  const data = await b.eval(`(() => {
    const entries = [...document.querySelectorAll(".timeline-entry")];
    const countries = [...new Set(entries.map(e => e.dataset.country).filter(Boolean))];
    const regions = new Set(entries.filter(e => e.dataset.country && e.dataset.region)
      .map(e => e.dataset.country + "/" + e.dataset.region));
    return {
      countries, regionCount: regions.size, entryCount: entries.length,
      legend: [...document.querySelectorAll(".map-legend > span:not(.map-legend-label)")].map(s => s.textContent),
      stats: [...document.querySelectorAll(".map-stats > span:not(.map-stats-label)")].map(s => s.textContent.trim())
    };
  })()`);

  t.check("每個時間軸項目都有 data-country / data-region",
    data.countries.length > 0 && data.regionCount > 0,
    `國家 ${data.countries.length}、地區 ${data.regionCount}`);
  t.check("已探索清單等於時間軸出現過的國家",
    JSON.stringify(data.legend) === JSON.stringify(data.countries),
    `清單 ${JSON.stringify(data.legend)} vs 資料 ${JSON.stringify(data.countries)}`);
  t.check("國家數與清單一致",
    data.stats[0] === `${String(data.countries.length).padStart(2, "0")} 國家`, data.stats[0]);
  t.check("地區數由 國家+地區 組合推導",
    data.stats[1] === `${String(data.regionCount).padStart(2, "0")} 地區`, data.stats[1]);
  t.check("旅行節點數等於時間軸項目數",
    data.stats[2] === `${String(data.entryCount).padStart(2, "0")} 旅行節點`, data.stats[2]);
  t.check("數字皆為兩位數補零", data.stats.every((s) => /^\d{2} /.test(s)), JSON.stringify(data.stats));
});
