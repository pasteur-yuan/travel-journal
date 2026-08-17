import { sleep, suite } from "../harness.mjs";

const PAGES = [
  ["首頁", "/index.html"],
  ["國家頁", "/countries/japan/index.html"],
  ["地區頁", "/countries/japan/hokkaido/index.html"]
];

export const theme = suite("全站 · 主題切換", async (b, t) => {
  await b.desktop();

  for (const [name, path] of PAGES) {
    await b.goto(path, { settle: 900 });
    const shape = await b.eval(`(() => {
      const toggles = document.querySelectorAll("[data-theme-toggle]");
      const htmlStyle = getComputedStyle(document.documentElement);
      const bodyStyle = getComputedStyle(document.body);
      return {
        toggleCount: toggles.length,
        legacyMenus: document.querySelectorAll(".theme-menu").length,
        bodyClass: document.body.className,
        htmlClass: document.documentElement.className,
        htmlBg: htmlStyle.backgroundColor + "|" + htmlStyle.backgroundImage,
        bodyBg: bodyStyle.backgroundColor + "|" + bodyStyle.backgroundImage,
        hasIcon: !!document.querySelector(".theme-toggle .theme-icon"),
        label: toggles[0]?.getAttribute("aria-label"),
        pressed: toggles[0]?.getAttribute("aria-pressed")
      };
    })()`);

    t.check(`${name}：只有一個主題切換按鈕`, shape.toggleCount === 1, `${shape.toggleCount} 個`);
    t.check(`${name}：舊版展開式主題選單已被取代`, shape.legacyMenus === 0, `${shape.legacyMenus} 個殘留`);
    t.check(`${name}：套用液態玻璃主題`,
      /theme-glass(-dark)?/.test(shape.bodyClass), shape.bodyClass);
    t.check(`${name}：html 同步套用相同主題 class`,
      shape.htmlClass.includes(shape.bodyClass.match(/theme-glass(-dark)?/)[0]),
      `html=${shape.htmlClass} body=${shape.bodyClass}`);
    t.check(`${name}：html 與 body 的 region-page 標記一致（拉到邊界回彈時顏色才對得上）`,
      shape.htmlClass.includes("region-page") === shape.bodyClass.includes("region-page"),
      `html=${shape.htmlClass} body=${shape.bodyClass}`);
    t.check(`${name}：html 背景與 body 完全一致，拉到邊界不會露出瀏覽器預設白底`,
      shape.htmlBg === shape.bodyBg, `html=${shape.htmlBg}\nbody=${shape.bodyBg}`);
    t.check(`${name}：按鈕有圖示與 aria-label`,
      shape.hasIcon && !!shape.label, `icon=${shape.hasIcon} label=${shape.label}`);
    t.check(`${name}：按鈕標記 aria-pressed`,
      shape.pressed === "true" || shape.pressed === "false", shape.pressed);
  }

  // 切換與記憶
  await b.goto("/index.html", { settle: 900 });
  const initial = await b.eval(`document.body.classList.contains("theme-glass-dark")`);
  await b.click("[data-theme-toggle]");
  await sleep(400);
  const toggled = await b.eval(`(() => ({
    dark: document.body.classList.contains("theme-glass-dark"),
    stored: localStorage.getItem("travel-journal-theme"),
    pressed: document.querySelector("[data-theme-toggle]").getAttribute("aria-pressed")
  }))()`);
  t.check("點擊切換亮／暗主題", toggled.dark !== initial, `${initial} → ${toggled.dark}`);
  t.check("切換後同步 aria-pressed",
    toggled.pressed === String(toggled.dark), `${toggled.pressed} vs ${toggled.dark}`);
  t.check("主題寫入 localStorage",
    toggled.stored === (toggled.dark ? "glass-dark" : "glass"), toggled.stored);

  // 重新載入後沿用
  await b.goto("/index.html", { settle: 900 });
  t.check("重新載入後沿用使用者選擇",
    await b.eval(`document.body.classList.contains("theme-glass-dark")`) === toggled.dark);

  // 換頁後也沿用
  await b.goto("/countries/japan/hokkaido/index.html", { settle: 900 });
  t.check("跨頁沿用使用者選擇",
    await b.eval(`document.body.classList.contains("theme-glass-dark")`) === toggled.dark);

  // 主題色變數要跟著換
  const tokens = await b.eval(`(() => {
    const s = getComputedStyle(document.body);
    return ["--ink", "--paper", "--surface", "--accent", "--line"]
      .map(n => s.getPropertyValue(n).trim()).filter(Boolean);
  })()`);
  t.check("主題提供完整的顏色變數", tokens.length === 5, JSON.stringify(tokens));

  // 手機版：國家頁的 region-page 深色背景覆寫（不跟著主題走）也要同步到 html，
  // 地區詳細頁沒有這個 class，應該維持一般主題背景，兩者不能混淆。
  await b.mobile();
  await b.goto("/countries/japan/index.html", { settle: 900 });
  const countryMobile = await b.eval(`(() => {
    const htmlStyle = getComputedStyle(document.documentElement);
    const bodyStyle = getComputedStyle(document.body);
    return { htmlBg: htmlStyle.backgroundColor, bodyBg: bodyStyle.backgroundColor };
  })()`);
  t.check("手機版國家頁：html 與 body 都套用固定深色背景，且彼此一致",
    countryMobile.htmlBg === "rgb(29, 36, 37)" && countryMobile.htmlBg === countryMobile.bodyBg,
    JSON.stringify(countryMobile));

  await b.goto("/countries/japan/hokkaido/index.html", { settle: 900 });
  const regionMobile = await b.eval(`(() => {
    const htmlStyle = getComputedStyle(document.documentElement);
    const bodyStyle = getComputedStyle(document.body);
    return {
      htmlHasRegionPage: document.documentElement.classList.contains("region-page"),
      htmlBg: htmlStyle.backgroundColor + "|" + htmlStyle.backgroundImage,
      bodyBg: bodyStyle.backgroundColor + "|" + bodyStyle.backgroundImage
    };
  })()`);
  t.check("手機版地區詳細頁：沒有 region-page 標記，維持一般主題背景",
    !regionMobile.htmlHasRegionPage, JSON.stringify(regionMobile));
  t.check("手機版地區詳細頁：html 與 body 背景一致",
    regionMobile.htmlBg === regionMobile.bodyBg, JSON.stringify(regionMobile));

  // 還原
  await b.eval(`localStorage.removeItem("travel-journal-theme")`);
  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
