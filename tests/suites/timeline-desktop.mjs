import { sleep, suite } from "../harness.mjs";

const YEAR = new Date().getFullYear();
const marker = (y) => `.timeline-year-group[data-year="${y}"] .timeline-year-marker`;
const group = (y) => `.timeline-year-group[data-year="${y}"]`;

export const desktop = suite("時間軸 · 桌面版", async (b, t) => {
  await b.desktop();
  await b.goto("/index.html", { settle: 1400 });

  const built = await b.eval(`(() => {
    const groups = [...document.querySelectorAll(".timeline-year-group")];
    return {
      years: groups.map(g => g.dataset.year),
      active: groups.filter(g => g.classList.contains("is-active")).map(g => g.dataset.year),
      markerTags: [...new Set(groups.map(g => g.querySelector(".timeline-year-marker")?.tagName))],
      alternating: groups.map(g => g.classList.contains("cards-up") ? "up" : "down"),
      leftoverSpans: document.querySelectorAll("span.timeline-year-marker").length
    };
  })()`);

  t.check("年份群組由資料建立", built.years.length >= 2, built.years.join(", "));
  t.check("預設展開今年", built.active.join() === String(YEAR), built.active.join());
  t.check("年份標記重建為 button", built.markerTags.join() === "BUTTON", built.markerTags.join());
  t.check("HTML 中的靜態 span 標記已被清除", built.leftoverSpans === 0, `${built.leftoverSpans} 個`);
  t.check("年份群組上下交錯", built.alternating[0] !== built.alternating[1], built.alternating.join(","));

  // hover 旅程點展開卡片
  const firstYear = built.years[0];
  await b.click(marker(firstYear));
  await sleep(1100);
  t.check("點年份後 is-switching 已清除",
    await b.eval(`!document.querySelector(".timeline-track").classList.contains("is-switching")`));
  t.check("點年份切換 active 群組",
    await b.eval(`document.querySelector('${group(firstYear)}').classList.contains("is-active")`));

  await b.hover(`${group(firstYear)} .timeline-entry`);
  t.check("桌面版 hover 旅程點展開資訊卡", await b.eval(
    `document.querySelector('${group(firstYear)} .timeline-entry').classList.contains("is-expanded")`));
  t.check("展開的卡片實際可見", await b.eval(
    `getComputedStyle(document.querySelector('${group(firstYear)} .timeline-entry .timeline-card')).visibility === "visible"`));

  // 滑鼠移開後收合
  await b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5, button: "none" });
  await b.eval(`document.querySelector('${group(firstYear)} .timeline-entry')
    .dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse", bubbles: false }))`);
  await sleep(250);
  t.check("滑鼠移開後資訊卡收合", await b.eval(
    `!document.querySelector('${group(firstYear)} .timeline-entry').classList.contains("is-expanded")`));

  // 未來且沒有旅程的預留年份不可點擊
  const reserved = await b.eval(`(() => {
    const groups = [...document.querySelectorAll(".timeline-year-group")];
    const future = groups.filter(g => Number(g.dataset.year) > ${YEAR});
    return future.map(g => ({
      year: g.dataset.year,
      entries: g.querySelectorAll(".timeline-entry").length,
      disabled: g.querySelector(".timeline-year-marker").disabled
    }));
  })()`);
  t.check("有預留下一個年份", reserved.length >= 1, JSON.stringify(reserved));
  t.check("未來且無旅程的年份不可點擊",
    reserved.filter((r) => r.entries === 0).every((r) => r.disabled), JSON.stringify(reserved));
  t.check("未來但已有旅程的年份可點擊",
    reserved.filter((r) => r.entries > 0).every((r) => !r.disabled), JSON.stringify(reserved));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
