import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runInNewContext } from "node:vm";
import { sleep, suite } from "../harness.mjs";
import { REGIONS } from "../regions.mjs";

const page = (r) => `/countries/japan/${r}/index.html`;

// 讀 region-notes.js 的原始碼取得真實的 regionNotes 當比對基準，不在測試裡
// 另外寫一份資料——避免兩邊各自維護、彼此漂移。
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const regionNotesSource = readFileSync(join(repoRoot, "assets", "js", "region-notes.js"), "utf8");
const regionNotes = runInNewContext(`${regionNotesSource}\nregionNotes;`);

const NOTE_SELECTOR = "#notes .region-content-list article";
const noteLabels = (b) => b.eval(`[...document.querySelectorAll(${JSON.stringify(NOTE_SELECTOR)})]
  .map(el => el.querySelector("span").textContent.trim())`);

// 逐地區找出第一則「有行程軌跡資料」的筆記（點開後 .spot-modal-itinerary 有內容）。
// 不寫死特定地區／標籤，資料是逐筆補回來的，寫死會變成每加一趟行程就要改一次測試。
const findNoteWithItinerary = async (b) => {
  for (const region of REGIONS) {
    await b.goto(page(region), { settle: 1000 });
    const labels = await noteLabels(b);
    for (const label of labels) {
      await b.eval(`(() => {
        const items = [...document.querySelectorAll(${JSON.stringify(NOTE_SELECTOR)})];
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
  // region-notes.js 的 regionNotes[地區] 是陣列，畫面上應該依陣列順序顯示——
  // 渲染邏輯只是單純 forEach + append，理論上不會亂序，這裡釘住這個不變量，
  // 避免未來改動渲染邏輯時（例如排序、去重）意外打亂顯示順序。
  // 不寫死地區清單，依 regionNotes 實際有資料的地區逐一檢查。
  await b.desktop();
  const regionsWithNotes = REGIONS.filter((r) => regionNotes[r]?.length);
  if (!regionsWithNotes.length) {
    t.skip("旅行筆記畫面順序與 regionNotes 陣列順序一致", "目前沒有任何地區有筆記資料");
  } else {
    for (const region of regionsWithNotes) {
      await b.goto(page(region), { settle: 1000 });
      const domLabels = await noteLabels(b);
      const expectedLabels = regionNotes[region].map((n) => n.label);
      t.check(`${region}：畫面顯示順序與 regionNotes 陣列順序一致`,
        JSON.stringify(domLabels) === JSON.stringify(expectedLabels),
        `畫面：${JSON.stringify(domLabels)}，預期：${JSON.stringify(expectedLabels)}`);
    }
  }
  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const itineraryContent = suite("地區頁 · 旅行筆記行程軌跡", async (b, t) => {
  await b.desktop();

  // 沒有行程軌跡資料的筆記：兩者都不顯示，不編造內容。這條在資料是空的
  // 現況下必然為真，資料補回來後也仍然要對「沒補資料的那些筆記」成立。
  await b.goto(page("hokkaido"), { settle: 1000 });
  const hasAnyNote = await b.eval(`!!document.querySelector(${JSON.stringify(NOTE_SELECTOR)})`);
  if (!hasAnyNote) {
    t.skip("沒有行程軌跡資料的筆記兩者都不顯示", "目前沒有任何筆記項目可以點擊");
  } else {
    await b.eval(`document.querySelector(${JSON.stringify(NOTE_SELECTOR)}).click()`);
    await sleep(300);
    const noItinerary = await b.eval(`({
      tableHidden: document.querySelector(".spot-modal-table-wrap").hidden,
      itineraryHidden: document.querySelector(".spot-modal-itinerary").hidden
    })`);
    t.check("沒有行程軌跡資料的筆記兩者都不顯示",
      noItinerary.tableHidden && noItinerary.itineraryHidden, JSON.stringify(noItinerary));
    await b.press("Escape");
    await sleep(150);
  }

  // 有行程軌跡資料的筆記：不寫死是哪個地區哪個標籤，逐一搜尋，資料目前是
  // 逐筆補回來的，找不到就 skip 而不是失敗。
  const found = await findNoteWithItinerary(b);
  if (!found) {
    t.skip("有行程軌跡資料的筆記：顯示停留點清單、不顯示四欄表格", "目前沒有任何筆記帶有行程軌跡資料");
    t.skip("有行程軌跡資料的筆記：天數與站數、連接線數量互相一致", "目前沒有任何筆記帶有行程軌跡資料");
  } else {
    await b.goto(page(found.region), { settle: 1000 });
    await b.eval(`(() => {
      const items = [...document.querySelectorAll(${JSON.stringify(NOTE_SELECTOR)})];
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
      const items = [...document.querySelectorAll(${JSON.stringify(NOTE_SELECTOR)})];
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
      const items = [...document.querySelectorAll(${JSON.stringify(NOTE_SELECTOR)})];
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
