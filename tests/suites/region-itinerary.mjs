import { sleep, suite } from "../harness.mjs";

const page = (r) => `/countries/japan/${r}/index.html`;

const noteItems = (b) => b.eval(`[...document.querySelectorAll(
  "#notes .region-note, #notes .region-content-list article"
)].map(el => ({ label: el.querySelector("span").textContent.trim(), tag: el.tagName }))`);

export const notesOrder = suite("地區頁 · 旅行筆記卡片順序", async (b, t) => {
  // 迴歸測試：#notes 底下有兩個直接子 div（區塊編號「05」與實際內容），
  // 原本用 '#notes > div' 抓內容容器會抓到第一個（編號），導致
  // regionAdditionalContent[地區].notes 的內容被插到編號 div 裡，排到
  // regionContent[地區].note（第一則筆記）前面。這裡驗證的是「插入順序」
  // 這個具體被打破的不變量，不是年月遞增——筆記本來就不保證依時間排序
  // （例如 fukuoka 後來補上的 2025/05 排在既有的 2026/03、2026/04 之後，
  // 這是正常的、insertion order，不是 bug）。第一則筆記固定是 DIV.region-note，
  // 其餘都是 ARTICLE.region-content-list-item，只要 DIV 排在所有 ARTICLE
  // 前面，就代表順序沒有被打亂。
  await b.desktop();
  for (const region of ["hokkaido", "tokyo", "nagoya", "osaka", "ise-shima", "fukuoka", "oita", "kumamoto", "miyazaki", "saga"]) {
    await b.goto(page(region), { settle: 1000 });
    const items = await noteItems(b);
    const divIndex = items.findIndex((i) => i.tag === "DIV");
    const firstArticleIndex = items.findIndex((i) => i.tag === "ARTICLE");
    const ok = divIndex === -1 || firstArticleIndex === -1 || divIndex < firstArticleIndex;
    t.check(`${region}：第一則筆記（region-note）排在其餘附加筆記之前`,
      ok, JSON.stringify(items));
  }
  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const itineraryContent = suite("地區頁 · 旅行筆記行程軌跡", async (b, t) => {
  await b.desktop();

  // 北海道 2026/01：單一地區的完整行程，涵蓋 9 天、64 個停留點
  // （原始資料 66 列，扣掉 2 筆台灣機場的出發／抵達）。
  await b.goto(page("hokkaido"), { settle: 1000 });
  await b.eval(`(() => {
    const items = [...document.querySelectorAll("#notes .region-note, #notes .region-content-list article")];
    items.find(el => el.querySelector("span").textContent.trim() === "2026 / 01").click();
  })()`);
  await sleep(300);
  const hokkaidoState = await b.eval(`({
    tableHidden: document.querySelector(".spot-modal-table-wrap").hidden,
    itineraryHidden: document.querySelector(".spot-modal-itinerary").hidden,
    dayCount: document.querySelectorAll(".spot-modal-itinerary-day").length,
    stopCount: document.querySelectorAll(".spot-modal-itinerary-stop").length,
    firstDate: document.querySelector(".spot-modal-itinerary-date")?.textContent?.trim(),
    firstStopTime: document.querySelector(".spot-modal-itinerary-time")?.textContent?.trim(),
    firstStopPlace: document.querySelector(".spot-modal-itinerary-place")?.textContent?.trim()
  })`);
  t.check("北海道 2026/01：顯示停留點清單，不顯示四欄表格",
    hokkaidoState.tableHidden && !hokkaidoState.itineraryHidden, JSON.stringify(hokkaidoState));
  t.check("北海道 2026/01：9 天、64 個停留點（66 列原始資料扣除 2 筆台灣機場）",
    hokkaidoState.dayCount === 9 && hokkaidoState.stopCount === 64, JSON.stringify(hokkaidoState));
  t.check("北海道 2026/01：第一天日期與第一站正確",
    hokkaidoState.firstDate === "2026-01-01" && hokkaidoState.firstStopTime === "13:10" &&
    hokkaidoState.firstStopPlace === "新千歲機場 國際線航廈",
    JSON.stringify(hokkaidoState));
  await b.press("Escape");

  // 跨地區行程：同一趟 2025 年 4-5 月九州行程橫跨熊本／宮崎／大分／福岡，
  // 每個地區只收錄屬於自己的停留點——用高千穗（宮崎）驗證只有 2 站，
  // 不會把同一天在熊本、大分的其他行程也算進來。
  await b.goto(page("miyazaki"), { settle: 1000 });
  await b.eval(`document.querySelector("#notes .region-note").click()`);
  await sleep(300);
  const miyazakiState = await b.eval(`({
    dayCount: document.querySelectorAll(".spot-modal-itinerary-day").length,
    stopCount: document.querySelectorAll(".spot-modal-itinerary-stop").length,
    connectorCount: document.querySelectorAll(".spot-modal-itinerary-connector").length
  })`);
  t.check("宮崎：跨地區行程只收錄屬於宮崎的停留點（高千穗峽、高千穗神社共 2 站）",
    miyazakiState.dayCount === 1 && miyazakiState.stopCount === 2, JSON.stringify(miyazakiState));
  t.check("宮崎：只有 2 站時只有 1 條連接線（最後一站不畫連接線）",
    miyazakiState.connectorCount === 1, JSON.stringify(miyazakiState));
  await b.press("Escape");

  // 沒有行程軌跡資料的筆記：維持原本「兩者都不顯示」的行為。
  await b.goto(page("hokkaido"), { settle: 1000 });
  await b.eval(`document.querySelector("#notes .region-note").click()`);
  await sleep(300);
  const noItinerary = await b.eval(`({
    tableHidden: document.querySelector(".spot-modal-table-wrap").hidden,
    itineraryHidden: document.querySelector(".spot-modal-itinerary").hidden
  })`);
  t.check("沒有行程軌跡資料的筆記仍然兩者都不顯示（2024 / 01 沒有對應資料）",
    noItinerary.tableHidden && noItinerary.itineraryHidden, JSON.stringify(noItinerary));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const itineraryAccessibility = suite("地區頁 · 旅行筆記行程軌跡可及性", async (b, t) => {
  await b.desktop();
  await b.goto(page("hokkaido"), { settle: 1000 });

  // 鍵盤：Tab 到有行程軌跡的筆記卡片，Enter 開啟，內容跟滑鼠點擊一致。
  await b.eval(`(() => {
    const items = [...document.querySelectorAll("#notes .region-note, #notes .region-content-list article")];
    items.find(el => el.querySelector("span").textContent.trim() === "2026 / 01").focus();
  })()`);
  await b.press("Enter");
  await sleep(300);
  const afterEnter = await b.eval(`({
    open: document.querySelector(".spot-modal").classList.contains("is-open"),
    stopCount: document.querySelectorAll(".spot-modal-itinerary-stop").length,
    focusInside: document.querySelector(".spot-modal").contains(document.activeElement)
  })`);
  t.check("鍵盤 Enter 開啟有行程軌跡的筆記，內容正確顯示", afterEnter.open && afterEnter.stopCount === 64,
    JSON.stringify(afterEnter));
  t.check("開啟後焦點移入 modal", afterEnter.focusInside);
  await b.press("Escape");

  // 手機版：tap 一樣能開啟並正確顯示。
  await b.mobile();
  await b.goto(page("hokkaido"), { settle: 1000 });
  await b.tap("#notes .region-note");
  const mobileState = await b.eval(`({
    open: document.querySelector(".spot-modal").classList.contains("is-open"),
    tableHidden: document.querySelector(".spot-modal-table-wrap").hidden,
    itineraryHidden: document.querySelector(".spot-modal-itinerary").hidden
  })`);
  t.check("手機版 tap 筆記卡片可開啟 modal", mobileState.open, JSON.stringify(mobileState));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
