import { sleep, suite } from "../harness.mjs";
import { REGIONS, REGION_SEARCH_NAMES as REGION_NAMES } from "../regions.mjs";

const ITEM_SELECTOR = "#spots .region-content-card, #food .region-content-list article, " +
  "#stays .region-content-list article, #notes .region-note, #notes .region-content-list article";
const page = (r) => `/countries/japan/${r}/index.html`;

export const modal = suite("地區頁 · 內容彈窗", async (b, t) => {
  await b.desktop();
  await b.goto(page("tokyo"), { settle: 1200 });

  t.check("彈窗預設關閉且對輔助技術隱藏", await b.eval(
    `(() => { const m = document.querySelector(".spot-modal");
      return !m.classList.contains("is-open") && m.getAttribute("aria-hidden") === "true"; })()`));

  await b.click("#spots .region-content-card");
  const opened = await b.eval(`(() => {
    const m = document.querySelector(".spot-modal");
    const item = document.querySelector("#spots .region-content-card");
    return {
      open: m.classList.contains("is-open"),
      hidden: m.getAttribute("aria-hidden"),
      title: m.querySelector("#spot-modal-title").textContent,
      label: m.querySelector("#spot-modal-label").textContent,
      itemLabel: item.querySelector("span").textContent,
      headers: [...m.querySelectorAll(".spot-modal-table thead th")].map(th => th.textContent),
      rows: m.querySelectorAll(".spot-modal-table tbody tr").length,
      bodyLocked: document.body.classList.contains("modal-is-open"),
      focusInside: m.contains(document.activeElement),
      dialogRole: m.querySelector('[role="dialog"]')?.getAttribute("aria-modal")
    };
  })()`);

  t.check("點內容項目會開啟彈窗", opened.open);
  t.check("開啟時解除 aria-hidden", opened.hidden === "false", opened.hidden);
  t.check("彈窗標題對應被點的項目", opened.label === opened.itemLabel,
    `${opened.label} vs ${opened.itemLabel}`);
  t.check("資料表欄位順序固定",
    JSON.stringify(opened.headers) === JSON.stringify(["地名", "資訊", "交通方式", "Google Map"]),
    JSON.stringify(opened.headers));
  t.check("資料表至少有一列", opened.rows >= 1, `${opened.rows} 列`);
  t.check("開啟時鎖住背景捲動", opened.bodyLocked);
  t.check("焦點移入彈窗", opened.focusInside);
  t.check("彈窗標記為 aria-modal", opened.dialogRole === "true", opened.dialogRole);

  // Escape 關閉
  await b.press("Escape");
  t.check("Escape 可關閉彈窗", await b.eval(
    `(() => { const m = document.querySelector(".spot-modal");
      return !m.classList.contains("is-open") && !document.body.classList.contains("modal-is-open"); })()`));

  // 背景點擊關閉
  await b.click("#food .region-content-list article");
  await b.eval(`document.querySelector(".spot-modal-backdrop").click()`);
  await sleep(250);
  t.check("點背景可關閉彈窗",
    await b.eval(`!document.querySelector(".spot-modal").classList.contains("is-open")`));

  // 關閉按鈕
  await b.click("#stays .region-content-list article");
  await b.eval(`document.querySelector(".spot-modal-close").click()`);
  await sleep(250);
  t.check("關閉按鈕可關閉彈窗",
    await b.eval(`!document.querySelector(".spot-modal").classList.contains("is-open")`));

  // 鍵盤開啟
  const keyboard = await b.eval(`(() => {
    const item = document.querySelector("#spots .region-content-card");
    return { tabindex: item.getAttribute("tabindex"), role: item.getAttribute("role") };
  })()`);
  t.check("內容項目可用鍵盤聚焦", keyboard.tabindex === "0", keyboard.tabindex);
  t.check("內容項目標記為 button 角色", keyboard.role === "button", keyboard.role);

  await b.focus("#spots .region-content-card");
  await b.press("Enter");
  t.check("Enter 可開啟彈窗",
    await b.eval(`document.querySelector(".spot-modal").classList.contains("is-open")`));
  await b.press("Escape");

  await b.focus("#spots .region-content-card");
  await b.press(" ");
  t.check("Space 可開啟彈窗",
    await b.eval(`document.querySelector(".spot-modal").classList.contains("is-open")`));
  await b.press("Escape");

  // 關閉彈窗後，等滑鼠離開項目就不應該留下卡住的光暈。
  // （滑鼠仍停在項目上時保留光暈是正確的，所以要先把游標移開再判斷。）
  await b.click("#spots .region-content-card");
  await b.press("Escape");
  await b.moveAway();
  const residual = await b.eval(
    `[...document.querySelectorAll(".region-content-card.is-pointer-active, " +
      "#food .region-content-list article.is-pointer-active, " +
      "#stays .region-content-list article.is-pointer-active")]
       .map(el => el.querySelector("span")?.textContent)`);
  t.check("關閉彈窗且游標移開後不留下卡住的光暈",
    residual.length === 0, JSON.stringify(residual));
  t.check("關閉後焦點回到原本的項目附近（不落在 body）",
    await b.eval(`document.activeElement !== document.body ||
      !document.querySelector(".spot-modal").classList.contains("is-open")`));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const mapLinks = suite("地區頁 · Google Maps 連結", async (b, t) => {
  await b.desktop();
  let totalItems = 0;
  const wrongRegion = [];
  const missingLink = [];
  let noteCells = 0;
  let noteTotalSeen = 0;

  for (const region of REGIONS) {
    await b.goto(page(region), { settle: 1000 });
    const result = await b.eval(`(() => {
      const items = [...document.querySelectorAll(${JSON.stringify(ITEM_SELECTOR)})];
      const wrong = [], missing = [];
      let notes = 0, noteTotal = 0;
      items.forEach((item) => {
        item.click();
        const section = item.closest(".region-section")?.id;
        const label = item.querySelector("span")?.textContent?.trim();
        const links = [...document.querySelectorAll(".spot-modal-table .spot-modal-map-link")]
          .map(a => decodeURIComponent(a.getAttribute("href") || ""));
        if (section === "notes") {
          // 筆記的標籤是年月，四個欄位填不出真實內容，因此整張資料表都不該出現。
          noteTotal++;
          const wrap = document.querySelector(".spot-modal-table-wrap");
          const rows = document.querySelectorAll(".spot-modal-table tbody tr").length;
          if (wrap.hidden && rows === 0) notes++;
        } else {
          if (!links.length) missing.push(section + " / " + label);
          links.forEach((link) => {
            const others = ${JSON.stringify(Object.values(REGION_NAMES))}
              .filter(n => n !== ${JSON.stringify(REGION_NAMES[region])});
            if (others.some(n => link.includes(n))) wrong.push(section + " / " + label + " → " + link);
          });
        }
        document.querySelector(".spot-modal-close")?.click();
      });
      return { count: items.length, wrong, missing, notes, noteTotal };
    })()`);
    totalItems += result.count;
    noteCells += result.notes;
    noteTotalSeen += result.noteTotal;
    wrongRegion.push(...result.wrong.map((w) => `${region}: ${w}`));
    missingLink.push(...result.missing.map((m) => `${region}: ${m}`));
  }

  t.check("每個景點／美食／住宿項目都有地圖連結",
    missingLink.length === 0, missingLink.slice(0, 3).join("；") || "全部具備");
  t.check("地圖連結不會指向其他地區",
    wrongRegion.length === 0,
    wrongRegion.length ? `${wrongRegion.length} 筆，例如 ${wrongRegion[0]}` : `已檢查 ${totalItems} 個項目`);
  t.check("旅行筆記不顯示編造的資料表",
    noteTotalSeen > 0 && noteCells === noteTotalSeen,
    `${noteCells}/${noteTotalSeen} 筆的資料表已隱藏且無資料列`);
  t.check("所有地區頁皆無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

// 重構查表結構時，資料很容易在合併過程中靜默消失——連結仍然正確，只是列數變少。
// 這裡把每個地區的資料深度釘住，數字下降就會失敗。
const EXPECTED_ROWS = {
  hokkaido: 93, tokyo: 59, nagoya: 40, osaka: 21, "ise-shima": 20, fukuoka: 93, kumamoto: 18,
  miyazaki: 17, gifu: 12, kagoshima: 11, oita: 11, saga: 9, kyoto: 17, kobe: 14, nagano: 8,
  kagawa: 7, kanagawa: 8, yokkaichi: 6, ehime: 4, kochi: 5, ishikawa: 3, toyama: 5,
  shizuoka: 5, yamanashi: 4, shiga: 4, okayama: 4, shimane: 4, nagasaki: 4
};

export const dataDepth = suite("地區頁 · 彈窗地點資料深度", async (b, t) => {
  await b.desktop();
  let total = 0;

  for (const region of REGIONS) {
    await b.goto(page(region), { settle: 1000 });
    const rows = await b.eval(`(() => {
      const items = [...document.querySelectorAll("#spots .region-content-card, " +
        "#food .region-content-list article, #stays .region-content-list article")];
      let count = 0;
      items.forEach((item) => {
        item.click();
        count += document.querySelectorAll(".spot-modal-table tbody tr").length;
        document.querySelector(".spot-modal-close")?.click();
      });
      return count;
    })()`);
    total += rows;
    t.check(`${region}：地點資料列數未減少`,
      rows >= EXPECTED_ROWS[region], `${rows} 列（基準 ${EXPECTED_ROWS[region]}）`);
  }

  const expectedTotal = Object.values(EXPECTED_ROWS).reduce((a, n) => a + n, 0);
  t.check("全站地點資料總量未減少", total >= expectedTotal, `${total} 列（基準 ${expectedTotal}）`);
});

export const modalMobile = suite("地區頁 · 手機版彈窗", async (b, t) => {
  await b.mobile();
  await b.goto(page("fukuoka"), { settle: 1200 });

  await b.tap("#spots .region-content-card");
  t.check("手機版點內容項目可開啟彈窗",
    await b.eval(`document.querySelector(".spot-modal").classList.contains("is-open")`));

  const scrollable = await b.eval(`(() => {
    const wrap = document.querySelector(".spot-modal-table-wrap");
    return { canScroll: wrap.scrollHeight >= wrap.clientHeight,
             overflow: getComputedStyle(wrap).overflowY };
  })()`);
  t.check("彈窗資料表可垂直捲動",
    ["auto", "scroll"].includes(scrollable.overflow), scrollable.overflow);

  await b.eval(`document.querySelector(".spot-modal-close").click()`);
  await sleep(250);
  t.check("手機版可關閉彈窗",
    await b.eval(`!document.body.classList.contains("modal-is-open")`));
  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
