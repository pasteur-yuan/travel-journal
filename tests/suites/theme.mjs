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
      return {
        toggleCount: toggles.length,
        legacyMenus: document.querySelectorAll(".theme-menu").length,
        bodyClass: document.body.className,
        hasIcon: !!document.querySelector(".theme-toggle .theme-icon"),
        label: toggles[0]?.getAttribute("aria-label"),
        pressed: toggles[0]?.getAttribute("aria-pressed")
      };
    })()`);

    t.check(`${name}：只有一個主題切換按鈕`, shape.toggleCount === 1, `${shape.toggleCount} 個`);
    t.check(`${name}：舊版展開式主題選單已被取代`, shape.legacyMenus === 0, `${shape.legacyMenus} 個殘留`);
    t.check(`${name}：套用液態玻璃主題`,
      /theme-glass(-dark)?/.test(shape.bodyClass), shape.bodyClass);
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

  // 還原
  await b.eval(`localStorage.removeItem("travel-journal-theme")`);
  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
