// 首頁時間軸的旅程彈窗：資訊卡展開後點擊卡片（或鍵盤 Enter／Space）開啟，
// 顯示該趟旅程完整的時間軸式停留點清單——搬自原本地區頁旅行筆記的彈窗樣式。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runInNewContext } from "node:vm";
import { sleep, suite } from "../harness.mjs";

// 讀 trips.js 的原始碼取得真實的 trips 當比對基準，不在測試裡另外寫一份資料——
// 避免兩邊各自維護、彼此漂移。
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const tripsSource = readFileSync(join(repoRoot, "assets", "js", "trips.js"), "utf8");
const trips = runInNewContext(`${tripsSource}\ntrips;`);

export const timelineEntries = suite("首頁時間軸 · 節點只反映真實旅程", async (b, t) => {
  await b.desktop();
  await b.goto("/index.html", { settle: 1200 });

  const info = await b.eval(`({
    count: document.querySelectorAll(".timeline-entry").length,
    dates: [...document.querySelectorAll(".timeline-entry")].map(e => e.dataset.date)
  })`);
  t.check("時間軸節點數等於 trips.js 的旅程數（沒有殘留假資料，也沒有漏掉真實資料）",
    info.count === trips.length, `畫面 ${info.count} 個，trips.js ${trips.length} 筆`);
  t.check("每個節點的日期都對應到一筆真實 trip",
    info.dates.every((d) => trips.some((trip) => trip.date === d)), JSON.stringify(info.dates));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const modal = suite("首頁時間軸 · 旅程彈窗", async (b, t) => {
  await b.desktop();
  await b.goto("/index.html", { settle: 1200 });

  if (!trips.length) {
    t.skip("資訊卡展開後點擊卡片會開啟彈窗", "trips.js 目前沒有任何旅程資料");
    t.skip("彈窗內容符合 trips 資料", "trips.js 目前沒有任何旅程資料");
    t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
    return;
  }
  const trip = trips[0];

  // hover 展開資訊卡（桌面版既有行為，這裡不是重點，只是彈窗的前置條件）。
  await b.hover(".timeline-entry");
  const revealed = await b.eval(
    `document.querySelector(".timeline-entry").classList.contains("is-expanded")`);
  t.check("hover 後資訊卡展開（開彈窗的前置條件）", revealed);

  // 點擊已展開的卡片開啟彈窗。
  await b.click(".timeline-card");
  await sleep(400);
  const opened = await b.eval(`({
    open: document.querySelector(".spot-modal").classList.contains("is-open"),
    hidden: document.querySelector(".spot-modal").getAttribute("aria-hidden"),
    label: document.querySelector("#trip-modal-label")?.textContent,
    title: document.querySelector("#trip-modal-title")?.textContent,
    dayCount: document.querySelectorAll(".spot-modal-itinerary-day").length,
    stopCount: document.querySelectorAll(".spot-modal-itinerary-stop").length,
    firstStopTime: document.querySelector(".spot-modal-itinerary-time")?.textContent?.trim(),
    firstStopPlace: document.querySelector(".spot-modal-itinerary-place")?.textContent?.trim(),
    hasTable: !!document.querySelector(".spot-modal-table-wrap"),
    bodyLocked: document.body.classList.contains("modal-is-open"),
    focusInside: document.querySelector(".spot-modal").contains(document.activeElement)
  })`);
  t.check("展開狀態下點擊卡片會開啟彈窗", opened.open);
  t.check("開啟時解除 aria-hidden", opened.hidden === "false", opened.hidden);
  t.check("彈窗沒有四欄表格（首頁彈窗只顯示行程軌跡）", !opened.hasTable);
  t.check("開啟時鎖住背景捲動", opened.bodyLocked);
  t.check("焦點移入彈窗", opened.focusInside);
  t.check("彈窗標籤對應 trip.label", opened.label === trip.label, `${opened.label} vs ${trip.label}`);
  t.check("彈窗標題對應 trip.description", opened.title === trip.description,
    `${opened.title} vs ${trip.description}`);
  const expectedStops = trip.itinerary.reduce((sum, day) => sum + day.stops.length, 0);
  t.check("天數與站數符合 trip.itinerary",
    opened.dayCount === trip.itinerary.length && opened.stopCount === expectedStops,
    `畫面 ${opened.dayCount} 天 ${opened.stopCount} 站，trips.js ${trip.itinerary.length} 天 ${expectedStops} 站`);
  const firstStop = trip.itinerary[0].stops[0];
  t.check("第一站的時間與地名符合 trip.itinerary",
    opened.firstStopTime === firstStop.time && opened.firstStopPlace === firstStop.place,
    `畫面 ${opened.firstStopTime} ${opened.firstStopPlace} vs ${firstStop.time} ${firstStop.place}`);

  // Escape 關閉，焦點回到原本觸發的元素。
  await b.press("Escape");
  await sleep(250);
  const closed = await b.eval(`({
    open: document.querySelector(".spot-modal").classList.contains("is-open"),
    bodyLocked: document.body.classList.contains("modal-is-open")
  })`);
  t.check("Escape 可關閉彈窗", !closed.open && !closed.bodyLocked, JSON.stringify(closed));

  // 背景點擊關閉。
  await b.hover(".timeline-entry");
  await b.click(".timeline-card");
  await sleep(300);
  await b.eval(`document.querySelector(".spot-modal-backdrop").click()`);
  await sleep(250);
  t.check("點背景可關閉彈窗",
    await b.eval(`!document.querySelector(".spot-modal").classList.contains("is-open")`));

  // 關閉按鈕。
  await b.hover(".timeline-entry");
  await b.click(".timeline-card");
  await sleep(300);
  await b.eval(`document.querySelector(".spot-modal-close").click()`);
  await sleep(250);
  t.check("關閉按鈕可關閉彈窗",
    await b.eval(`!document.querySelector(".spot-modal").classList.contains("is-open")`));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const modalAccessibility = suite("首頁時間軸 · 旅程彈窗可及性", async (b, t) => {
  await b.desktop();
  await b.goto("/index.html", { settle: 1200 });

  if (!trips.length) {
    t.skip("鍵盤 Enter 開啟旅程彈窗", "trips.js 目前沒有任何旅程資料");
    t.skip("手機版 tap 開啟旅程彈窗", "trips.js 目前沒有任何旅程資料");
    t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
    return;
  }

  // 鍵盤：Tab 聚焦節點（:focus-visible 已讓卡片可見），Enter 直接開彈窗。
  await b.focus(".timeline-entry");
  await b.press("Enter");
  await sleep(300);
  const afterEnter = await b.eval(`({
    open: document.querySelector(".spot-modal").classList.contains("is-open"),
    stopCount: document.querySelectorAll(".spot-modal-itinerary-stop").length,
    focusInside: document.querySelector(".spot-modal").contains(document.activeElement)
  })`);
  t.check("鍵盤 Enter 開啟旅程彈窗，內容正確顯示", afterEnter.open && afterEnter.stopCount > 0,
    JSON.stringify(afterEnter));
  t.check("開啟後焦點移入 modal", afterEnter.focusInside);
  await b.press("Escape");
  await sleep(150);

  // 手機版：tap 展開資訊卡後再 tap 卡片開彈窗。
  await b.mobile();
  await b.goto("/index.html", { settle: 1200 });
  await b.tap(".timeline-dot");
  await sleep(300);
  await b.tap(".timeline-card");
  await sleep(300);
  const mobileState = await b.eval(`({
    open: document.querySelector(".spot-modal").classList.contains("is-open"),
    stopCount: document.querySelectorAll(".spot-modal-itinerary-stop").length
  })`);
  t.check("手機版 tap 資訊卡可開啟彈窗", mobileState.open && mobileState.stopCount > 0,
    JSON.stringify(mobileState));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
