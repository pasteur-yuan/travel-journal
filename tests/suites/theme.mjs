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
    // iOS 橡皮筋回彈畫的是 background-color，不是 background-image（漸層）。
    // 只有漸層、沒補純色的話 background-color 會落回初始值 transparent，
    // html/body 兩邊的計算值仍然「一致」，但一致的是「都透明」，回彈時還是會閃白底。
    t.check(`${name}：html 背景色不是 transparent（漸層本身在 iOS 回彈時不會被畫出來）`,
      shape.htmlBg.split("|")[0] !== "rgba(0, 0, 0, 0)", shape.htmlBg.split("|")[0]);
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

const snapshotToggle = (b) => b.eval(`(() => {
  const t = document.querySelector("[data-theme-toggle]");
  return {
    dark: document.body.classList.contains("theme-glass-dark"),
    iconState: t.dataset.iconState,
    pressed: t.getAttribute("aria-pressed"),
    ariaDisabled: t.getAttribute("aria-disabled"),
    isSwitching: t.classList.contains("is-switching"),
    stored: localStorage.getItem("travel-journal-theme")
  };
})()`);

export const toggleAnimationLock = suite("全站 · 主題切換按鈕防連點", async (b, t) => {
  await b.desktop();
  await b.goto("/index.html", { settle: 900 });

  const before = await snapshotToggle(b);
  t.check("初始狀態一致", !before.dark && before.iconState === "light" && before.pressed === "false");

  // 第一次點擊觸發動畫，動畫還沒跑完（420ms 圖示翻轉、1800ms 全部結束）就再點兩次，
  // 這兩次都必須被忽略——不能讓 body class 提早跳掉、圖示卻還停在動畫排定的中途狀態。
  await b.click("[data-theme-toggle]");
  const midAnimation = await snapshotToggle(b);
  t.check("點擊後立即進入動畫鎖定狀態", midAnimation.isSwitching && midAnimation.ariaDisabled === "true",
    JSON.stringify(midAnimation));
  t.check("點擊後 body 主題立即切換（不等動畫）", midAnimation.dark, JSON.stringify(midAnimation));

  await sleep(500);
  const midAnimation2 = await snapshotToggle(b);
  await b.click("[data-theme-toggle]"); // 動畫進行中的第二次點擊：應被忽略
  await sleep(50);
  const afterIgnoredClick = await snapshotToggle(b);
  t.check("動畫進行中的第二次點擊被忽略（狀態與圖示不會跳回或再次翻轉）",
    afterIgnoredClick.dark === midAnimation2.dark &&
    afterIgnoredClick.iconState === midAnimation2.iconState &&
    afterIgnoredClick.stored === midAnimation2.stored,
    `動畫中=${JSON.stringify(midAnimation2)} 忽略後=${JSON.stringify(afterIgnoredClick)}`);

  await sleep(1500); // 補滿到動畫完全結束（1800ms）
  const afterAnimation = await snapshotToggle(b);
  t.check("動畫結束後解除鎖定", !afterAnimation.isSwitching && afterAnimation.ariaDisabled === null,
    JSON.stringify(afterAnimation));
  t.check("動畫結束後主題／圖示／可及性狀態三者一致",
    afterAnimation.dark && afterAnimation.iconState === "dark" && afterAnimation.pressed === "true",
    JSON.stringify(afterAnimation));

  // 動畫結束後，下一次點擊要能正常生效。
  await b.click("[data-theme-toggle]");
  await sleep(50);
  const afterUnlockedClick = await snapshotToggle(b);
  t.check("動畫結束後點擊可以正常切換",
    !afterUnlockedClick.dark, JSON.stringify(afterUnlockedClick));

  await sleep(2000); // 讓這次動畫也跑完，避免影響下一段測試
  await b.eval(`localStorage.removeItem("travel-journal-theme")`);

  // 觸控 tap：走一樣的 click 事件路徑，鎖定邏輯要同樣適用。
  await b.mobile();
  await b.goto("/index.html", { settle: 900 });
  await b.tap("[data-theme-toggle]", { settle: 50 });
  const midTap = await snapshotToggle(b);
  await b.tap("[data-theme-toggle]", { settle: 50 }); // 動畫進行中的第二次 tap：應被忽略
  const afterIgnoredTap = await snapshotToggle(b);
  t.check("觸控：動畫進行中的第二次 tap 被忽略",
    afterIgnoredTap.dark === midTap.dark && afterIgnoredTap.stored === midTap.stored,
    `第一次 tap 後=${JSON.stringify(midTap)} 第二次 tap 後=${JSON.stringify(afterIgnoredTap)}`);
  await sleep(2000);
  await b.eval(`localStorage.removeItem("travel-journal-theme")`);

  // prefers-reduced-motion：必須維持即時切換，完全沒有鎖定期間。
  await b.desktop();
  await b.reducedMotion(true);
  await b.goto("/index.html", { settle: 900 });
  await b.click("[data-theme-toggle]");
  const reducedFirst = await snapshotToggle(b);
  t.check("reduced motion：點擊立即切換、不進入動畫鎖定",
    reducedFirst.dark && !reducedFirst.isSwitching && reducedFirst.ariaDisabled === null &&
    reducedFirst.iconState === "dark",
    JSON.stringify(reducedFirst));
  await b.click("[data-theme-toggle]"); // 沒有鎖定期間，應該立即再次生效
  const reducedSecond = await snapshotToggle(b);
  t.check("reduced motion：沒有鎖定期間，緊接著的下一次點擊立即生效",
    !reducedSecond.dark && reducedSecond.iconState === "light", JSON.stringify(reducedSecond));
  await b.reducedMotion(false);
  await b.eval(`localStorage.removeItem("travel-journal-theme")`);

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
