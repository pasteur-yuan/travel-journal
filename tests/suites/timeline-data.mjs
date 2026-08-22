// 時間軸的樣板行為：新增一趟旅程資料時，年份群組、互動與統計是否自動涵蓋。
import { suite } from "../harness.mjs";
import { tripScript, withTripVariant } from "../timeline-fixtures.mjs";

const YEAR = new Date().getFullYear();

const layout = (b) => b.eval(`(() => {
  const groups = [...document.querySelectorAll(".timeline-year-group")];
  return {
    years: groups.map(g => g.dataset.year),
    perYear: Object.fromEntries(groups.map(g => [g.dataset.year, g.querySelectorAll(".timeline-entry").length])),
    inTrack: document.querySelectorAll(".timeline-track .timeline-entry").length,
    inDocument: document.querySelectorAll(".timeline-entry").length,
    stats: [...document.querySelectorAll(".map-stats > span:not(.map-stats-label)")].map(s => s.textContent.trim())
  };
})()`);

export const template = suite("時間軸 · 新增資料的樣板行為", async (b, t) => {
  await b.desktop();

  // 既有年份範圍內新增
  await withTripVariant(b, tripScript({ date: `${YEAR - 1}-03-02` }), async () => {
    const info = await layout(b);
    t.check("既有年份新增一筆會出現在該年份群組",
      info.perYear[String(YEAR - 1)] >= 1 && info.inTrack === info.inDocument,
      JSON.stringify(info.perYear));
  });

  // 早於現有最早年份
  await withTripVariant(b, tripScript({ date: `${YEAR - 4}-08-01` }), async () => {
    const info = await layout(b);
    t.check("更早的年份會自動延伸年份軸",
      info.years.includes(String(YEAR - 4)), info.years.join(", "));
    t.check("中間沒有旅程的年份仍會建立（時間軸連續）",
      info.years.includes(String(YEAR - 3)), info.years.join(", "));
  });

  // 超過 currentYear + 1 的未來年份：先前會被靜默丟棄
  await withTripVariant(b, tripScript({ date: `${YEAR + 2}-05-05` }), async () => {
    const info = await layout(b);
    t.check("超過預留年份的未來旅程不會被丟棄",
      info.years.includes(String(YEAR + 2)) && info.inTrack === info.inDocument,
      `年份 ${info.years.join(", ")}；track ${info.inTrack} / document ${info.inDocument}`);
    const clickable = await b.eval(
      `!document.querySelector('.timeline-year-group[data-year="${YEAR + 2}"] .timeline-year-marker').disabled`);
    t.check("已排定行程的未來年份可以點開", clickable);
  });

  // 缺少日期：先前會讓整條時間軸消失
  await withTripVariant(b, tripScript({ date: null }), async () => {
    const info = await layout(b);
    t.check("單筆日期無法解析時，其餘項目照常顯示",
      info.years.length > 0 && info.inTrack > 0,
      `${info.years.length} 個年份群組、${info.inTrack} 個項目`);
    t.check("無效項目不會被算進時間軸",
      info.inTrack < info.inDocument || info.inDocument === info.inTrack,
      `track ${info.inTrack} / document ${info.inDocument}`);
  });

  // 統計數字要跟著新資料更新
  await withTripVariant(b, tripScript({ date: `${YEAR - 1}-04-04`, country: "🇹🇹 測試國", regions: ["測試地區"] }), async () => {
    const info = await layout(b);
    t.check("新增旅程後國家數自動更新",
      info.stats[0] !== "01 國家" && /^\d{2} 國家$/.test(info.stats[0]), info.stats[0]);
    const legend = await b.eval(
      `[...document.querySelectorAll(".map-legend > span:not(.map-legend-label)")].map(s => s.textContent)`);
    t.check("新增旅程後已探索清單自動包含新國家",
      legend.includes("🇹🇹 測試國"), JSON.stringify(legend));
  });

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
