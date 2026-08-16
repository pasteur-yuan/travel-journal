import { sleep, suite } from "../harness.mjs";

export const cards = suite("首頁 · 國家卡片", async (b, t) => {
  await b.desktop();
  await b.goto("/index.html", { settle: 1200 });

  const shape = await b.eval(`(() => {
    const strip = document.querySelector(".country-strip");
    const cards = [...document.querySelectorAll(".country-card")];
    return {
      count: cards.length,
      linked: cards.filter(c => c.tagName === "A").map(c => c.getAttribute("href")),
      coming: cards.filter(c => c.classList.contains("country-card-coming")).length,
      comingAreLinks: cards.some(c => c.classList.contains("country-card-coming") && c.tagName === "A"),
      everyCardLabelled: cards.every(c => (c.getAttribute("aria-label") || c.textContent || "").trim().length > 0),
      stripScrollable: strip.scrollWidth > strip.clientWidth,
      pageScrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  })()`);

  t.check("卡片列本身可水平捲動", shape.stripScrollable,
    `scrollWidth > clientWidth = ${shape.stripScrollable}`);
  t.check("卡片列不會撐寬整個頁面", !shape.pageScrollsSideways,
    `頁面水平捲動 = ${shape.pageScrollsSideways}`);
  t.check("Coming soon 卡片不是連結（不建立失效連結）", !shape.comingAreLinks,
    `${shape.coming} 張 Coming soon`);
  t.check("已完成的國家卡片連到正確路徑",
    shape.linked.length > 0 && shape.linked.every((h) => h.startsWith("countries/")),
    JSON.stringify(shape.linked));
  t.check("每張卡片都有可讀的名稱或 aria-label", shape.everyCardLabelled);

  // hover 應套用滑鼠追蹤光暈與 3D 傾斜
  await b.hover(".country-card-japan");
  const hovered = await b.eval(`(() => {
    const c = document.querySelector(".country-card-japan");
    const read = (n) => c.style.getPropertyValue(n);
    return { active: c.classList.contains("is-pointer-active"),
             glowX: read("--card-pointer-x"), tiltX: read("--card-tilt-x"),
             shadowX: read("--card-shadow-x") };
  })()`);
  t.check("hover 卡片會標記 is-pointer-active", hovered.active);
  t.check("hover 會設定滑鼠追蹤光暈座標", hovered.glowX !== "", hovered.glowX);
  t.check("hover 會設定 3D 傾斜角度", hovered.tiltX !== "", hovered.tiltX);
  t.check("hover 會設定陰影位移", hovered.shadowX !== "", hovered.shadowX);

  // 移到另一張卡，前一張必須立即恢復
  await b.hover(".country-card-korea");
  const switched = await b.eval(`(() => ({
    japan: document.querySelector(".country-card-japan").classList.contains("is-pointer-active"),
    korea: document.querySelector(".country-card-korea").classList.contains("is-pointer-active")
  }))()`);
  t.check("移到相鄰卡片時前一張立即恢復", !switched.japan && switched.korea,
    `japan=${switched.japan} korea=${switched.korea}`);

  // 離開卡片列，所有卡片恢復
  await b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5, button: "none" });
  await b.eval(`document.querySelector(".country-strip").dispatchEvent(new PointerEvent("pointerleave", { bubbles: false }))`);
  await sleep(200);
  t.check("離開卡片列後全部恢復",
    await b.eval(`document.querySelectorAll(".country-card.is-pointer-active").length === 0`));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const cardsMobile = suite("首頁 · 國家卡片（手機版）", async (b, t) => {
  await b.mobile();
  await b.goto("/index.html", { settle: 1200 });

  const res = await b.eval(`(() => {
    const strip = document.querySelector(".country-strip");
    return {
      stripScrollable: strip.scrollWidth > strip.clientWidth,
      pageScrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      scrollbarHidden: getComputedStyle(strip).scrollbarWidth === "none",
      snap: getComputedStyle(strip).scrollSnapType
    };
  })()`);
  t.check("手機版卡片列可水平滑動", res.stripScrollable);
  t.check("手機版頁面本身不水平捲動", !res.pageScrollsSideways);
  t.check("卡片列使用水平吸附", res.snap.includes("x"), res.snap);
  t.check("手機版無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
