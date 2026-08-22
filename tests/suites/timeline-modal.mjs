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

// 時間軸只展開「今年」那個年份群組，其餘年份的 .timeline-entry 會是
// display:none（見 style.css 的 .timeline-year-group:not(.is-active)）。
// trips.js 現在橫跨多個年份，trips[0] 不一定落在預設展開的年份，互動前
// 要先點對應年份的 marker，跟 timeline-desktop.mjs 驗證過的流程一致。
const tripYear = (trip) => new Date(trip.date).getFullYear();
const yearMarker = (year) => `.timeline-year-group[data-year="${year}"] .timeline-year-marker`;
const activateTripYear = async (b, trip) => {
  await b.click(yearMarker(tripYear(trip)));
  await sleep(1100);
};

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
  await activateTripYear(b, trip);

  // hover 展開資訊卡（桌面版既有行為，這裡不是重點，只是彈窗的前置條件）。
  await b.hover(".timeline-entry");
  const revealed = await b.eval(
    `document.querySelector(".timeline-entry").classList.contains("is-expanded")`);
  t.check("hover 後資訊卡展開（開彈窗的前置條件）", revealed);
  // openTripModal 開啟時會清掉 .is-expanded，要在點擊之前先記下展開卡片的背景圖，
  // 才能跟彈窗打開後的背景圖比對是不是同一張。
  const cardImage = await b.eval(
    `document.querySelector(".timeline-card").style.getPropertyValue("--timeline-card-image")`);

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
    focusInside: document.querySelector(".spot-modal").contains(document.activeElement),
    daysOverscroll: getComputedStyle(document.querySelector(".spot-modal-itinerary-days")).overscrollBehaviorX,
    dayOverscroll: getComputedStyle(document.querySelector(".spot-modal-itinerary-day")).overscrollBehaviorY,
    heroImage: document.querySelector(".spot-modal-hero")?.style.getPropertyValue("--spot-modal-image"),
    itineraryFlexGrow: getComputedStyle(document.querySelector(".spot-modal-itinerary")).flexGrow,
    dialogHeight: document.querySelector(".spot-modal-dialog").getBoundingClientRect().height,
    viewportHeight: window.innerHeight,
    gapBelowItinerary: document.querySelector(".spot-modal-dialog").getBoundingClientRect().bottom
      - document.querySelector(".spot-modal-itinerary").getBoundingClientRect().bottom
  })`);
  t.check("展開狀態下點擊卡片會開啟彈窗", opened.open);
  t.check("開啟時解除 aria-hidden", opened.hidden === "false", opened.hidden);
  t.check("彈窗沒有四欄表格（首頁彈窗只顯示行程軌跡）", !opened.hasTable);
  t.check("開啟時鎖住背景捲動", opened.bodyLocked);
  // 左右翻頁與單日內容都各自捲到底時，不能把剩餘捲動量外溢到背景頁面（scroll chaining）。
  t.check("翻頁與單日內容的捲動容器都設定 overscroll-behavior: contain",
    opened.daysOverscroll === "contain" && opened.dayOverscroll === "contain",
    `days=${opened.daysOverscroll} day=${opened.dayOverscroll}`);
  t.check("焦點移入彈窗", opened.focusInside);
  // 行程軌跡要撐滿對話框剩餘高度，不能留一塊寫死高度以外的空白。用像素差距判斷
  // 不夠準：不同旅程標題折行數不同、對話框自己的 padding 也隨 viewport 縮放，
  // 「合法的留白」跟「回到寫死高度」的差距經常小到分不出來。直接驗證機制本身
  // 才可靠：.spot-modal-itinerary 必須是 flex: 1（撐滿），.spot-modal-dialog 的
  // 實際高度要落在 min(760px, 100svh - 3rem) 附近——如果 .spot-modal-dialog
  // 只有 min-height（不是定值 height），flex: 1 就沒有邊界可以撐滿，會退化成
  // 用內容自己的高度撐開對話框，對話框整個爆版（實測發生過，衝到兩千多 px）。
  t.check("行程軌跡用 flex: 1 撐滿對話框，不是寫死高度",
    opened.itineraryFlexGrow === "1", opened.itineraryFlexGrow);
  const expectedDialogHeight = Math.min(760, opened.viewportHeight - 48);
  t.check("對話框高度符合 min(760px, 100svh - 3rem)，沒有被內容撐爆",
    Math.abs(opened.dialogHeight - expectedDialogHeight) < 20,
    `實際 ${opened.dialogHeight}px，預期約 ${expectedDialogHeight}px`);
  t.check("行程軌跡底部沒有留下大片沒用到的空白（寬鬆檢查，抓明顯壞掉的情況）",
    opened.gapBelowItinerary < 200, `${opened.gapBelowItinerary}px`);
  t.check("彈窗頂部背景圖跟資訊卡展開時的背景圖是同一張（同一個地區）",
    !!opened.heroImage && opened.heroImage === cardImage, `hero=${opened.heroImage} vs card=${cardImage}`);
  t.check("彈窗標籤對應 trip.label", opened.label === trip.label, `${opened.label} vs ${trip.label}`);
  t.check("彈窗標題對應 trip.teaser", opened.title === trip.teaser,
    `${opened.title} vs ${trip.teaser}`);
  const expectedStops = trip.itinerary.reduce((sum, day) => sum + day.stops.length, 0);
  t.check("天數與站數符合 trip.itinerary",
    opened.dayCount === trip.itinerary.length && opened.stopCount === expectedStops,
    `畫面 ${opened.dayCount} 天 ${opened.stopCount} 站，trips.js ${trip.itinerary.length} 天 ${expectedStops} 站`);
  const firstStop = trip.itinerary[0].stops[0];
  t.check("第一站的時間與地名符合 trip.itinerary",
    opened.firstStopTime === firstStop.time && opened.firstStopPlace === firstStop.place,
    `畫面 ${opened.firstStopTime} ${opened.firstStopPlace} vs ${firstStop.time} ${firstStop.place}`);

  // 單日站數多時 .spot-modal-itinerary-day 本身會捲動，DAY 徽章／日期要用
  // position: sticky 貼在該天的最上面，捲動時不能跟著站點一起被捲出畫面。
  // 靜止時（scrollTop 為 0）不該有背景色塊——是 is-pinned 這個 class 决定要不要
  // 補上會淡出的霧面背景，只在真的有內容從底下捲過去時才出現，避免平白多一條色塊。
  const beforeScroll = await b.eval(`({
    top: document.querySelector(".spot-modal-itinerary-date").getBoundingClientRect().top,
    pinned: document.querySelector(".spot-modal-itinerary-date").classList.contains("is-pinned")
  })`);
  t.check("一開始（未捲動）日期列沒有 is-pinned，不會顯示成一塊背景色", !beforeScroll.pinned);
  await b.eval(`document.querySelector(".spot-modal-itinerary-day").scrollTop = 400`);
  await sleep(150);
  const afterScroll = await b.eval(`({
    top: document.querySelector(".spot-modal-itinerary-date").getBoundingClientRect().top,
    dayScrollTop: document.querySelector(".spot-modal-itinerary-day").scrollTop,
    pinned: document.querySelector(".spot-modal-itinerary-date").classList.contains("is-pinned")
  })`);
  t.check("該天內容捲動時，DAY 徽章與日期停留在最上面（position: sticky）",
    afterScroll.dayScrollTop > 0 && Math.abs(afterScroll.top - beforeScroll.top) < 1,
    `捲動前 top=${beforeScroll.top}，捲動後 top=${afterScroll.top}（dayScrollTop=${afterScroll.dayScrollTop}）`);
  t.check("捲動後才加上 is-pinned，補上遮住底下內容的背景", afterScroll.pinned);
  await b.eval(`document.querySelector(".spot-modal-itinerary-day").scrollTop = 0`);

  // 行程軌跡改成左右翻頁：一次只看一天，用「哪一天的左邊界貼齊捲動容器左邊界」
  // 判斷目前顯示的是第幾天，不能用 DOM 順序（全部天數都在 DOM 裡，只是被捲出畫面）。
  const visibleDay = `(() => {
    const container = document.querySelector(".spot-modal-itinerary-days");
    const left = container.getBoundingClientRect().left;
    const days = [...document.querySelectorAll(".spot-modal-itinerary-day")];
    const day = days.find((d) => Math.abs(d.getBoundingClientRect().left - left) < 5) || days[0];
    return {
      index: days.indexOf(day),
      time: day.querySelector(".spot-modal-itinerary-time")?.textContent?.trim(),
      place: day.querySelector(".spot-modal-itinerary-place")?.textContent?.trim()
    };
  })()`;
  if (trip.itinerary.length > 1) {
    const initialPager = await b.eval(`({
      prevDisabled: document.querySelector("[data-itinerary-prev]")?.disabled,
      nextDisabled: document.querySelector("[data-itinerary-next]")?.disabled,
      dayIndexLabel: document.querySelector(".spot-modal-itinerary-day-index")?.textContent
    })`);
    t.check("多天行程一開始停在第一天：上一天停用、下一天可用",
      initialPager.prevDisabled === true && initialPager.nextDisabled === false, JSON.stringify(initialPager));
    t.check("DAY 徽章顯示總天數", initialPager.dayIndexLabel === `DAY 01 / ${trip.itinerary.length}`,
      initialPager.dayIndexLabel);

    await b.click("[data-itinerary-next]");
    await sleep(500);
    const secondStop = trip.itinerary[1].stops[0];
    const afterNext = await b.eval(visibleDay);
    t.check("點下一天按鈕會翻到第二天的內容",
      afterNext.index === 1 && afterNext.time === secondStop.time && afterNext.place === secondStop.place,
      `${JSON.stringify(afterNext)} vs ${JSON.stringify(secondStop)}`);

    await b.press("ArrowLeft");
    await sleep(500);
    const afterArrowLeft = await b.eval(visibleDay);
    t.check("modal 開啟時按左鍵盤方向鍵翻回第一天", afterArrowLeft.index === 0, JSON.stringify(afterArrowLeft));

    // 一路翻到最後一天，確認下一天按鈕會停用（不能翻出行程範圍）、上一天維持可用。
    for (let i = 0; i < trip.itinerary.length; i += 1) {
      await b.eval(`document.querySelector("[data-itinerary-next]")?.click()`);
      await sleep(150);
    }
    await sleep(300);
    const atEnd = await b.eval(`({
      prevDisabled: document.querySelector("[data-itinerary-prev]")?.disabled,
      nextDisabled: document.querySelector("[data-itinerary-next]")?.disabled
    })`);
    t.check("翻到最後一天後下一天按鈕停用、上一天維持可用",
      atEnd.nextDisabled === true && atEnd.prevDisabled === false, JSON.stringify(atEnd));
  } else {
    t.check("只有一天的行程不畫翻頁按鈕",
      await b.eval(`!document.querySelector("[data-itinerary-prev]") && !document.querySelector("[data-itinerary-next]")`));
  }

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
  await b.click(".spot-modal-close");
  await sleep(250);
  t.check("關閉按鈕可關閉彈窗",
    await b.eval(`!document.querySelector(".spot-modal").classList.contains("is-open")`));
  t.check("關閉彈窗後資訊卡完全收折隱藏（不殘留半截未收折卡片）",
    await b.eval(`getComputedStyle(document.querySelector(".timeline-entry .timeline-card")).visibility === "hidden"`));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
}, { serial: true });

export const modalAccessibility = suite("首頁時間軸 · 旅程彈窗可及性", async (b, t) => {
  await b.desktop();
  await b.goto("/index.html", { settle: 1200 });

  if (!trips.length) {
    t.skip("鍵盤 Enter 開啟旅程彈窗", "trips.js 目前沒有任何旅程資料");
    t.skip("手機版 tap 開啟旅程彈窗", "trips.js 目前沒有任何旅程資料");
    t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
    return;
  }
  const trip = trips[0];
  await activateTripYear(b, trip);

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

  // 手機版：tap 展開資訊卡後再 tap 卡片開彈窗。重新 goto 會重置成預設展開
  // 今年那個年份群組，trip 若不在今年要重新點一次年份 marker。
  await b.mobile();
  await b.goto("/index.html", { settle: 1200 });
  await activateTripYear(b, trip);
  await b.tap(".timeline-dot");
  await sleep(300);
  await b.tap(".timeline-card");
  await sleep(300);
  const mobileState = await b.eval(`({
    open: document.querySelector(".spot-modal").classList.contains("is-open"),
    stopCount: document.querySelectorAll(".spot-modal-itinerary-stop").length,
    gapBelowItinerary: document.querySelector(".spot-modal-dialog").getBoundingClientRect().bottom
      - document.querySelector(".spot-modal-itinerary").getBoundingClientRect().bottom
  })`);
  t.check("手機版 tap 資訊卡可開啟彈窗", mobileState.open && mobileState.stopCount > 0,
    JSON.stringify(mobileState));
  // 桌機版那邊已經直接驗證 flex: 1／定值 height 這兩個機制本身，這裡維持寬鬆的
  // 像素檢查即可，只是手機版視窗的補充防線，不需要重複機制檢查。
  t.check("手機版行程軌跡也撐滿對話框剩餘高度，底部沒有大片空白",
    mobileState.gapBelowItinerary < 200, `${mobileState.gapBelowItinerary}px`);

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
