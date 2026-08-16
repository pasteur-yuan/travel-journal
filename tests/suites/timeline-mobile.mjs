import { sleep, suite } from "../harness.mjs";

const marker = (y) => `.timeline-year-group[data-year="${y}"] .timeline-year-marker`;
const firstDot = (y) => `.timeline-year-group[data-year="${y}"] .timeline-entry .timeline-dot`;

const state = (b) => b.eval(`(() => ({
  scrollY: Math.round(window.scrollY),
  active: [...document.querySelectorAll(".timeline-year-group.is-active")].map(g => g.dataset.year),
  expanded: [...document.querySelectorAll(".timeline-entry.is-expanded")].map(e => e.dataset.date),
  visibleCards: [...document.querySelectorAll(".timeline-entry")].filter(e => {
    const c = e.querySelector(".timeline-card");
    return c && getComputedStyle(c).visibility === "visible";
  }).map(e => e.dataset.date)
}))()`);

/**
 * 量測一次觸控前後的捲動位置，用來確認頁面沒有自己捲動。
 * 必須先把目標捲進畫面並靜置，再開始量測——否則測試自身的 scrollIntoView
 * 會被誤算成受測程式造成的捲動。
 */
async function tapAndWatch(b, selector) {
  await b.scrollIntoView(selector);
  const before = await b.eval("Math.round(window.scrollY)");
  await b.tap(selector, { scroll: false });
  const after = await b.eval("Math.round(window.scrollY)");
  return { before, after };
}

export const mobile = suite("時間軸 · 手機版互動", async (b, t) => {
  await b.mobile();
  await b.goto("/index.html", { settle: 1400 });

  const years = await b.eval(
    `[...document.querySelectorAll(".timeline-year-group")].map(g => g.dataset.year)`);
  const [y1, y2] = years;

  // 單次點擊即可切換年份（先前因殘留旗標需要點兩下）
  let scroll = await tapAndWatch(b, marker(y1));
  let s = await state(b);
  t.check("單次點擊年份即切換", s.active.join() === y1, s.active.join());
  t.check("切換年份時頁面不捲動", scroll.before === scroll.after, `${scroll.before} → ${scroll.after}`);

  // 圓點展開資訊卡
  scroll = await tapAndWatch(b, firstDot(y1));
  s = await state(b);
  t.check("點圓點展開資訊卡", s.expanded.length === 1, JSON.stringify(s.expanded));
  t.check("展開的卡片實際可見", s.visibleCards.length === 1, JSON.stringify(s.visibleCards));
  t.check("點圓點時頁面不捲動", scroll.before === scroll.after, `${scroll.before} → ${scroll.after}`);

  // 第二次點擊同一圓點收回，年份維持展開
  const expandedHeight = await b.eval(
    `document.querySelector('.timeline-year-group[data-year="${y1}"] .timeline-entry').getBoundingClientRect().height`);
  scroll = await tapAndWatch(b, firstDot(y1));
  s = await state(b);
  const collapsedHeight = await b.eval(
    `document.querySelector('.timeline-year-group[data-year="${y1}"] .timeline-entry').getBoundingClientRect().height`);
  t.check("再點一次圓點收回資訊卡", s.expanded.length === 0 && s.visibleCards.length === 0,
    `expanded=${JSON.stringify(s.expanded)} visible=${JSON.stringify(s.visibleCards)}`);
  t.check("收回時年份群組維持展開", s.active.join() === y1, s.active.join());
  t.check("收回後回到原始佔位高度", collapsedHeight < expandedHeight,
    `${expandedHeight.toFixed(0)}px → ${collapsedHeight.toFixed(0)}px`);
  t.check("收回時頁面不捲動", scroll.before === scroll.after, `${scroll.before} → ${scroll.after}`);

  // 第三次點擊可再度展開
  await b.tap(firstDot(y1));
  s = await state(b);
  t.check("第三次點擊可再度展開", s.expanded.length === 1, JSON.stringify(s.expanded));

  // 切換到另一個年份，舊卡片必須自動收折
  scroll = await tapAndWatch(b, marker(y2));
  s = await state(b);
  t.check("單次點擊即切換到另一年份", s.active.join() === y2, s.active.join());
  t.check("切換年份後舊資訊卡自動收折", s.expanded.length === 0, JSON.stringify(s.expanded));
  t.check("切換年份後沒有殘留可見卡片（sticky hover 防護）",
    s.visibleCards.length === 0, JSON.stringify(s.visibleCards));
  t.check("切換年份時頁面不捲動", scroll.before === scroll.after, `${scroll.before} → ${scroll.after}`);

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const glide = suite("時間軸 · 手機版年份滑動（FLIP）", async (b, t) => {
  await b.mobile();
  await b.goto("/index.html", { settle: 1400 });

  const years = await b.eval(
    `[...document.querySelectorAll(".timeline-year-group")].map(g => g.dataset.year)`);
  const transforms = () => b.eval(
    `[...document.querySelectorAll(".timeline-year-group")]
       .map(g => getComputedStyle(g).transform).filter(v => v && v !== "none")
       .map(v => Math.abs(parseFloat(v.split(",")[5] || "0")))`);

  await b.tap(marker(years[1]), { settle: 500 });

  // 不等待完成，直接取樣動畫中的位移
  const point = await b.eval(`(() => {
    const el = document.querySelector('${marker(years[0])}');
    el.scrollIntoView({ block: "center", behavior: "instant" });
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  })()`);
  await sleep(200);
  const scrollBefore = await b.eval("Math.round(window.scrollY)");
  await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

  await sleep(150);
  const mid = await transforms();
  await sleep(400);
  const later = await transforms();
  await sleep(900);
  const settled = await transforms();
  const scrollAfter = await b.eval("Math.round(window.scrollY)");

  t.check("切換年份時其他年份正在滑動", mid.length > 0, `${mid.length} 個群組帶有 transform`);
  t.check("位移隨時間衰減（慢速煞停）",
    later.length === 0 || Math.max(...later, 0) < Math.max(...mid, 0),
    `${Math.max(...mid, 0).toFixed(1)}px → ${Math.max(...later, 0).toFixed(1)}px`);
  t.check("滑動結束後 transform 已清除", settled.length === 0, JSON.stringify(settled));
  t.check("整段滑動期間頁面未捲動", scrollBefore === scrollAfter, `${scrollBefore} → ${scrollAfter}`);

  // 文件高度鎖定：切換年份不應改變頁面總高
  const heights = await b.eval(`(async () => {
    const markers = [...document.querySelectorAll(".timeline-year-marker")].filter(m => !m.disabled);
    const seen = [];
    for (const m of markers) {
      m.click();
      await new Promise(r => setTimeout(r, 300));
      seen.push(document.documentElement.scrollHeight);
    }
    return seen;
  })()`);
  t.check("切換年份不改變文件總高度（避免捲動被夾制）",
    new Set(heights).size === 1, JSON.stringify(heights));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const stickyHover = suite("時間軸 · 觸控裝置的殘留 hover 防護", async (b, t) => {
  await b.mobile();
  await b.goto("/index.html", { settle: 1400 });

  const activeYear = await b.eval(
    `document.querySelector(".timeline-year-group.is-active")?.dataset.year`);
  const entry = `.timeline-year-group[data-year="${activeYear}"] .timeline-entry`;

  // iOS 在點擊後會讓 :hover 殘留在元素上。headless 不會自動產生這個狀態，
  // 因此這裡用真實滑鼠移入重現它，確認資訊卡不會因此脫離 is-expanded 的控制
  // ——只驗證模擬的 hover:none 媒體特性是測不出這件事的。
  await b.hover(entry);
  const hovered = await b.eval(`(() => {
    const el = document.querySelector('${entry}');
    const card = el.querySelector(".timeline-card");
    const dot = el.querySelector(".timeline-dot");
    const cardStyle = getComputedStyle(card);
    return {
      expanded: el.classList.contains("is-expanded"),
      hovered: el.matches(":hover"),
      visibility: cardStyle.visibility,
      opacity: cardStyle.opacity,
      height: Math.round(card.getBoundingClientRect().height),
      dotScale: Number((getComputedStyle(dot).transform.match(/matrix\\(([\\d.]+)/) || [0, 1])[1])
    };
  })()`);

  t.check("測試前提：元素確實處於 :hover 狀態", hovered.hovered, JSON.stringify(hovered));
  t.check("殘留 hover 不會讓未展開的資訊卡顯示",
    hovered.visibility === "hidden" && hovered.opacity === "0",
    `visibility=${hovered.visibility} opacity=${hovered.opacity}`);
  t.check("殘留 hover 不會撐開卡片高度（避免版面位移）",
    hovered.height <= 60, `${hovered.height}px`);
  t.check("殘留 hover 不會讓圓點維持放大高亮",
    hovered.dotScale < 1.1, `scale=${hovered.dotScale}`);

  // 由 JS 控制的展開狀態仍必須有效
  await b.tap(`${entry} .timeline-dot`);
  t.check("is-expanded 仍能正常展開資訊卡", await b.eval(
    `getComputedStyle(document.querySelector('${entry} .timeline-card')).visibility === "visible"`));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const reducedMotion = suite("時間軸 · prefers-reduced-motion", async (b, t) => {
  await b.mobile();
  await b.reducedMotion(true);
  await b.goto("/index.html", { settle: 1400 });

  const years = await b.eval(
    `[...document.querySelectorAll(".timeline-year-group")].map(g => g.dataset.year)`);
  await b.tap(marker(years[1]));
  await sleep(120);
  const during = await b.eval(
    `[...document.querySelectorAll(".timeline-year-group")]
       .map(g => getComputedStyle(g).transform).filter(v => v && v !== "none").length`);

  t.check("reduced-motion 下不套用 FLIP 位移", during === 0, `${during} 個群組帶有 transform`);
  t.check("reduced-motion 下年份仍可正常切換",
    (await state(b)).active.join() === years[1]);
  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");

  await b.reducedMotion(false);
});
