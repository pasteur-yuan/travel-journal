import { sleep, suite } from "../harness.mjs";
import { REGIONS } from "../regions.mjs";

const page = (r) => `/countries/japan/${r}/index.html`;

const noteItems = (b) => b.eval(`[...document.querySelectorAll(
  "#notes .region-note, #notes .region-content-list article"
)].map(el => ({ label: el.querySelector("span").textContent.trim(), tag: el.tagName }))`);

// 逐地區找出第一則「有行程軌跡資料」的筆記（點開後 .spot-modal-itinerary 有內容）。
// 不寫死特定地區／標籤，資料是逐筆補回來的，寫死會變成每加一趟行程就要改一次測試。
const findNoteWithItinerary = async (b) => {
  for (const region of REGIONS) {
    await b.goto(page(region), { settle: 1000 });
    const labels = await b.eval(`[...document.querySelectorAll(
      "#notes .region-note, #notes .region-content-list article"
    )].map(el => el.querySelector("span").textContent.trim())`);
    for (const label of labels) {
      await b.eval(`(() => {
        const items = [...document.querySelectorAll("#notes .region-note, #notes .region-content-list article")];
        items.find(el => el.querySelector("span").textContent.trim() === ${JSON.stringify(label)}).click();
      })()`);
      await sleep(250);
      const hasItinerary = await b.eval(`(() => {
        const el = document.querySelector(".spot-modal-itinerary");
        return !!(el && !el.hidden && el.querySelectorAll(".spot-modal-itinerary-stop").length > 0);
      })()`);
      await b.press("Escape");
      await sleep(150);
      if (hasItinerary) return { region, label };
    }
  }
  return null;
};

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

  // 沒有行程軌跡資料的筆記：兩者都不顯示，不編造內容。這條在資料是空的
  // 現況下必然為真，資料補回來後也仍然要對「沒補資料的那些筆記」成立。
  await b.goto(page("hokkaido"), { settle: 1000 });
  await b.eval(`document.querySelector("#notes .region-note").click()`);
  await sleep(300);
  const noItinerary = await b.eval(`({
    tableHidden: document.querySelector(".spot-modal-table-wrap").hidden,
    itineraryHidden: document.querySelector(".spot-modal-itinerary").hidden
  })`);
  t.check("沒有行程軌跡資料的筆記兩者都不顯示",
    noItinerary.tableHidden && noItinerary.itineraryHidden, JSON.stringify(noItinerary));
  await b.press("Escape");
  await sleep(150);

  // 有行程軌跡資料的筆記：不寫死是哪個地區哪個標籤，逐一搜尋，資料目前是
  // 逐筆補回來的，找不到就 skip 而不是失敗。
  const found = await findNoteWithItinerary(b);
  if (!found) {
    t.skip("有行程軌跡資料的筆記：顯示停留點清單、不顯示四欄表格", "目前沒有任何筆記帶有行程軌跡資料");
    t.skip("有行程軌跡資料的筆記：天數與站數、連接線數量互相一致", "目前沒有任何筆記帶有行程軌跡資料");
  } else {
    await b.goto(page(found.region), { settle: 1000 });
    await b.eval(`(() => {
      const items = [...document.querySelectorAll("#notes .region-note, #notes .region-content-list article")];
      items.find(el => el.querySelector("span").textContent.trim() === ${JSON.stringify(found.label)}).click();
    })()`);
    await sleep(300);
    const state = await b.eval(`({
      tableHidden: document.querySelector(".spot-modal-table-wrap").hidden,
      itineraryHidden: document.querySelector(".spot-modal-itinerary").hidden,
      dayCount: document.querySelectorAll(".spot-modal-itinerary-day").length,
      stopCount: document.querySelectorAll(".spot-modal-itinerary-stop").length,
      connectorCount: document.querySelectorAll(".spot-modal-itinerary-connector").length,
      firstDate: document.querySelector(".spot-modal-itinerary-date")?.textContent?.trim(),
      firstStopTime: document.querySelector(".spot-modal-itinerary-time")?.textContent?.trim(),
      firstStopPlace: document.querySelector(".spot-modal-itinerary-place")?.textContent?.trim()
    })`);
    t.check(`${found.region}／${found.label}：顯示停留點清單，不顯示四欄表格`,
      state.tableHidden && !state.itineraryHidden, JSON.stringify(state));
    t.check(`${found.region}／${found.label}：至少 1 天、每天至少 1 站`,
      state.dayCount >= 1 && state.stopCount >= state.dayCount, JSON.stringify(state));
    t.check(`${found.region}／${found.label}：連接線數量不超過「站數減天數」（每天最後一站不畫連接線）`,
      state.connectorCount <= state.stopCount - state.dayCount, JSON.stringify(state));
    t.check(`${found.region}／${found.label}：第一站的時間與地名都有值`,
      Boolean(state.firstDate) && Boolean(state.firstStopTime) && Boolean(state.firstStopPlace),
      JSON.stringify(state));
    await b.press("Escape");
  }

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const itineraryAccessibility = suite("地區頁 · 旅行筆記行程軌跡可及性", async (b, t) => {
  await b.desktop();

  // 不寫死是哪個地區哪個標籤，逐一搜尋有行程軌跡資料的筆記，找不到就 skip。
  const found = await findNoteWithItinerary(b);
  if (!found) {
    t.skip("鍵盤 Enter 開啟有行程軌跡的筆記，內容正確顯示", "目前沒有任何筆記帶有行程軌跡資料");
    t.skip("開啟後焦點移入 modal", "目前沒有任何筆記帶有行程軌跡資料");
    t.skip("手機版 tap 筆記卡片可開啟 modal 並正確顯示行程軌跡", "目前沒有任何筆記帶有行程軌跡資料");
  } else {
    await b.goto(page(found.region), { settle: 1000 });

    // 鍵盤：Tab 到有行程軌跡的筆記卡片，Enter 開啟，內容跟滑鼠點擊一致。
    await b.eval(`(() => {
      const items = [...document.querySelectorAll("#notes .region-note, #notes .region-content-list article")];
      items.find(el => el.querySelector("span").textContent.trim() === ${JSON.stringify(found.label)}).focus();
    })()`);
    await b.press("Enter");
    await sleep(300);
    const afterEnter = await b.eval(`({
      open: document.querySelector(".spot-modal").classList.contains("is-open"),
      stopCount: document.querySelectorAll(".spot-modal-itinerary-stop").length,
      focusInside: document.querySelector(".spot-modal").contains(document.activeElement)
    })`);
    t.check("鍵盤 Enter 開啟有行程軌跡的筆記，內容正確顯示", afterEnter.open && afterEnter.stopCount > 0,
      JSON.stringify(afterEnter));
    t.check("開啟後焦點移入 modal", afterEnter.focusInside);
    await b.press("Escape");
    await sleep(150);

    // 手機版：tap 一樣能開啟並正確顯示。tap() 只接受 CSS selector，先在目標
    // 元素上標記一個測試用屬性，避免用 :nth-child 去猜索引。
    await b.mobile();
    await b.goto(page(found.region), { settle: 1000 });
    await b.eval(`(() => {
      const items = [...document.querySelectorAll("#notes .region-note, #notes .region-content-list article")];
      const target = items.find(el => el.querySelector("span").textContent.trim() === ${JSON.stringify(found.label)});
      target.setAttribute("data-test-tap-target", "1");
    })()`);
    await b.tap(`[data-test-tap-target="1"]`);
    const mobileState = await b.eval(`({
      open: document.querySelector(".spot-modal").classList.contains("is-open"),
      tableHidden: document.querySelector(".spot-modal-table-wrap").hidden
    })`);
    t.check("手機版 tap 筆記卡片可開啟 modal", mobileState.open, JSON.stringify(mobileState));
  }

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
