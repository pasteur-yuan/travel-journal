import { readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sleep, suite } from "../harness.mjs";
import { REGIONS, REGION_NAMES } from "../regions.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

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

  const edgeTreatment = await b.eval(`(async () => {
    const strip = document.querySelector(".country-strip");
    const cards = [...document.querySelectorAll(".country-card")];
    const edgeBuffer = 64;
    const settle = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const inspect = () => {
      const bounds = strip.getBoundingClientRect();
      return cards
        .filter((card) => {
          const rect = card.getBoundingClientRect();
          const visible = rect.right > bounds.left && rect.left < bounds.right;
          return visible && (rect.left < bounds.left + edgeBuffer || rect.right > bounds.right - edgeBuffer);
        })
        .map((card) => ({
          name: card.querySelector(".country-name")?.textContent,
          edgeMuted: card.classList.contains("is-edge-shadowless"),
          shadow: getComputedStyle(card).boxShadow
        }));
    };
    strip.style.scrollBehavior = "auto";
    strip.scrollLeft = 0;
    await settle();
    const start = inspect();
    strip.scrollLeft = strip.scrollWidth - strip.clientWidth;
    await settle();
    const end = inspect();
    strip.style.scrollBehavior = "";
    return { start, end };
  })()`);
  const edgeCards = [...edgeTreatment.start, ...edgeTreatment.end];
  t.check("桌面兩端都有可見的邊界卡片", edgeCards.length >= 2, JSON.stringify(edgeTreatment));
  t.check("桌面邊界卡片不保留截斷的陰影線",
    edgeCards.length >= 2 && edgeCards.every((card) => card.edgeMuted && card.shadow === "none"),
    JSON.stringify(edgeTreatment));

  const desktopMoreBefore = await b.eval(`(() => {
    const card = document.querySelector(".country-card-japan");
    const more = card.querySelector(".country-card-more");
    const arrow = card.querySelector(".country-meta-arrow");
    return {
      moreOpacity: Number(getComputedStyle(more).opacity),
      moreWidth: more.getBoundingClientRect().width,
      arrowLeft: arrow.getBoundingClientRect().left
    };
  })()`);

  // hover 應套用滑鼠追蹤光暈、3D 傾斜與子頁提示
  await b.hover(".country-card-japan");
  await sleep(450);
  const hovered = await b.eval(`(() => {
    const c = document.querySelector(".country-card-japan");
    const read = (n) => c.style.getPropertyValue(n);
    const more = c.querySelector(".country-card-more");
    const arrow = c.querySelector(".country-meta-arrow");
    return { active: c.classList.contains("is-pointer-active"),
             glowX: read("--card-pointer-x"), tiltX: read("--card-tilt-x"),
             shadowX: read("--card-shadow-x"),
             moreOpacity: Number(getComputedStyle(more).opacity),
             moreWidth: more.getBoundingClientRect().width,
             moreClip: getComputedStyle(more).clipPath,
             arrowLeft: arrow.getBoundingClientRect().left };
  })()`);
  t.check("hover 卡片會標記 is-pointer-active", hovered.active);
  t.check("hover 會設定滑鼠追蹤光暈座標", hovered.glowX !== "", hovered.glowX);
  t.check("hover 會設定 3D 傾斜角度", hovered.tiltX !== "", hovered.tiltX);
  t.check("hover 會設定陰影位移", hovered.shadowX !== "", hovered.shadowX);
  t.check("桌面已建立國家頁的卡片 hover 時會由左向右露出查看更多並推動箭頭",
    desktopMoreBefore.moreOpacity === 0 && desktopMoreBefore.moreWidth < 1 &&
    hovered.moreOpacity > .9 && hovered.moreWidth > 40 && !hovered.moreClip.includes("100%") &&
    hovered.arrowLeft > desktopMoreBefore.arrowLeft + 40,
    JSON.stringify({ desktopMoreBefore, hovered }));

  // 移到另一張卡，前一張必須立即恢復
  await b.hover(".country-card-korea");
  const switched = await b.eval(`(() => ({
    japan: document.querySelector(".country-card-japan").classList.contains("is-pointer-active"),
    korea: document.querySelector(".country-card-korea").classList.contains("is-pointer-active")
  }))()`);
  t.check("移到相鄰卡片時前一張立即恢復", !switched.japan && switched.korea,
    `japan=${switched.japan} korea=${switched.korea}`);

  await b.focus(".country-card-japan");
  await sleep(450);
  const keyboardMore = await b.eval(`(() => {
    const card = document.querySelector(".country-card-japan");
    const more = card.querySelector(".country-card-more");
    return {
      focused: document.activeElement === card,
      moreOpacity: Number(getComputedStyle(more).opacity),
      moreWidth: more.getBoundingClientRect().width
    };
  })()`);
  t.check("桌面鍵盤 focus 同樣會露出查看更多", keyboardMore.focused && keyboardMore.moreOpacity > .9 && keyboardMore.moreWidth > 40,
    JSON.stringify(keyboardMore));
  await b.eval(`document.activeElement?.blur()`);

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
  t.check("手機版不套用桌面端點陰影處理", await b.eval(
    `!document.querySelector(".country-card.is-edge-shadowless")`));

  const swipeFocus = await b.eval(`(async () => {
    const strip = document.querySelector(".country-strip");
    const cards = [...document.querySelectorAll(".country-card")];
    const targetIndex = 4;
    const target = cards[targetIndex];
    strip.style.scrollBehavior = "auto";
    strip.scrollLeft = target.offsetLeft + target.offsetWidth / 2 - strip.clientWidth / 2;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    strip.style.scrollBehavior = "";
    const focusedIndex = cards.findIndex((card) => card.classList.contains("is-mobile-focused"));
    const push = (index) => parseFloat(getComputedStyle(cards[index]).getPropertyValue("--card-push")) || 0;
    return {
      focusedIndex,
      before: push(targetIndex - 1), after: push(targetIndex + 1),
      outerBefore: push(targetIndex - 2), outerAfter: push(targetIndex + 2)
    };
  })()`);
  t.check("滑動後會將目前卡片設為手機焦點", swipeFocus.focusedIndex === 4,
    JSON.stringify(swipeFocus));
  t.check("手機焦點會向左右推開相鄰卡片", swipeFocus.before < 0 && swipeFocus.after > 0,
    JSON.stringify(swipeFocus));
  t.check("切換焦點時只移動直接相鄰卡片，避免整列左右拉扯",
    swipeFocus.outerBefore === 0 && swipeFocus.outerAfter === 0,
    JSON.stringify(swipeFocus));

  await b.scrollIntoView(".country-strip");
  const neighborProbe = await b.eval(`(() => {
    const strip = document.querySelector(".country-strip").getBoundingClientRect();
    const target = document.querySelectorAll(".country-card")[5];
    const card = target.getBoundingClientRect();
    const left = Math.ceil(Math.max(card.left + 4, strip.left + 4));
    const right = Math.floor(Math.min(card.right - 4, strip.right - 4));
    const top = Math.ceil(Math.max(card.top + 8, strip.top + 8));
    const bottom = Math.floor(Math.min(card.bottom - 8, strip.bottom - 8));
    for (let y = top; y <= bottom; y += 12) {
      for (let x = left; x <= right; x += 4) {
        if (document.elementFromPoint(x, y)?.closest(".country-card") === target) {
          const outgoing = document.querySelectorAll(".country-card")[4].getBoundingClientRect();
          return {
            point: { x, y },
            scrollLeft: document.querySelector(".country-strip").scrollLeft,
            incomingCenter: (card.left + card.right) / 2,
            outgoingCenter: (outgoing.left + outgoing.right) / 2,
            strip: { left: strip.left, right: strip.right },
            card: { left: card.left, right: card.right }
          };
        }
      }
    }
    return { point: null, strip: { left: strip.left, right: strip.right }, card: { left: card.left, right: card.right },
      edgeTarget: document.elementFromPoint(Math.max(left, Math.min(right, strip.right - 5)), Math.round((top + bottom) / 2))?.closest(".country-card")?.className || null };
  })()`);
  const neighborPoint = neighborProbe.point;
  t.check("焦點右側鄰居保留可觸控區域", !!neighborPoint, JSON.stringify(neighborProbe));
  if (neighborPoint) {
    await b.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [neighborPoint] });
    await b.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    // 原生 smooth scroll 搭配 scroll-snap 的起步時間點不穩定（CDP 觸控事件送達
    // 到瀏覽器實際處理之間也有排程延遲），單次固定睡 120ms 再量測容易撲空、
    // 量到還沒開始動的瞬間。改成小間隔輪詢，抓到「已經開始移動」的第一個時間點，
    // 同時設上限時間，真的卡住不動的話最後一次量測仍會是失敗狀態。
    let handoffStart;
    const pollDeadline = Date.now() + 600;
    do {
      await sleep(30);
      handoffStart = await b.eval(`(() => ({
        focusedIndex: [...document.querySelectorAll(".country-card")].findIndex((card) => card.classList.contains("is-mobile-focused")),
        scrollProgress: document.querySelector(".country-strip").scrollLeft - ${neighborProbe.scrollLeft},
        incomingProgress: ${neighborProbe.incomingCenter} - (() => {
          const card = document.querySelectorAll(".country-card")[5].getBoundingClientRect();
          return (card.left + card.right) / 2;
        })(),
        outgoingProgress: ${neighborProbe.outgoingCenter} - (() => {
          const card = document.querySelectorAll(".country-card")[4].getBoundingClientRect();
          return (card.left + card.right) / 2;
        })()
      }))()`);
    } while (Date.now() < pollDeadline &&
      !(handoffStart.scrollProgress > 4 && handoffStart.incomingProgress > 4 && handoffStart.outgoingProgress > 4));
    await sleep(1000);
    const handoffEnd = await b.eval(`(() => {
      const strip = document.querySelector(".country-strip").getBoundingClientRect();
      const card = document.querySelectorAll(".country-card")[5].getBoundingClientRect();
      return {
        focusedIndex: [...document.querySelectorAll(".country-card")].findIndex((item) => item.classList.contains("is-mobile-focused")),
        centered: Math.abs((card.left + card.right) / 2 - (strip.left + strip.right) / 2) < 8
      };
    })()`);
    t.check("切換鄰居焦點時被點擊卡片立即接手並同步帶動兩張卡片",
      handoffStart.focusedIndex === 5 && handoffStart.scrollProgress > 4 &&
      handoffStart.incomingProgress > 4 && handoffStart.outgoingProgress > 4 &&
      handoffEnd.focusedIndex === 5 && handoffEnd.centered,
      JSON.stringify({ handoffStart, handoffEnd }));
  }

  await b.goto("/index.html", { settle: 900 });
  await b.eval(`window.mobileJapanFirstTap = null;
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".country-card-japan")) return;
      window.mobileJapanFirstTap = { prevented: event.defaultPrevented };
      event.preventDefault();
    }, { once: true });`);
  await b.tap(".country-card-japan");
  const japanFirstTap = await b.eval(`(() => {
    const tap = window.mobileJapanFirstTap || { prevented: false };
    const strip = document.querySelector(".country-strip").getBoundingClientRect();
    const card = document.querySelector(".country-card-japan").getBoundingClientRect();
    const more = document.querySelector(".country-card-more");
    const windowRect = document.querySelector(".country-meta-window").getBoundingClientRect();
    const arrowRect = document.querySelector(".country-meta-arrow").getBoundingClientRect();
    const moreRect = more?.getBoundingClientRect();
    return {
      ...tap,
      activated: document.querySelector(".country-card-japan").classList.contains("is-mobile-activated"),
      moreOpacity: more ? Number(getComputedStyle(more).opacity) : 0,
      centered: Math.abs((card.left + card.right) / 2 - (strip.left + strip.right) / 2) < 8,
      arrowOnNextLine: arrowRect.top >= windowRect.bottom - 1,
      moreExpandsBeforeArrow: !!moreRect && moreRect.left < arrowRect.left && moreRect.right <= arrowRect.left + 1,
      actionGap: moreRect ? arrowRect.left - moreRect.right : Infinity
    };
  })()`);
  t.check("第一次點擊日本卡不會立即導頁", japanFirstTap.prevented, JSON.stringify(japanFirstTap));
  t.check("第一次點擊日本卡會置中並露出查看更多", japanFirstTap.activated && japanFirstTap.moreOpacity > .9 && japanFirstTap.centered,
    JSON.stringify(japanFirstTap));
  t.check("查看更多會在第二行從箭頭左側展開", japanFirstTap.arrowOnNextLine && japanFirstTap.moreExpandsBeforeArrow,
    JSON.stringify(japanFirstTap));
  t.check("查看更多與箭頭保持緊密間距", japanFirstTap.actionGap <= 8,
    JSON.stringify(japanFirstTap));

  await b.tap(".section-heading");
  const outsideTap = await b.eval(`(() => ({
    focused: document.querySelectorAll(".country-card.is-mobile-focused").length,
    activated: document.querySelectorAll(".country-card.is-mobile-activated").length,
    moreOpacity: Number(getComputedStyle(document.querySelector(".country-card-more")).opacity)
  }))()`);
  t.check("點擊卡片列外會收起手機焦點狀態",
    outsideTap.focused === 0 && outsideTap.activated === 0 && outsideTap.moreOpacity === 0,
    JSON.stringify(outsideTap));

  await b.goto("/index.html", { settle: 900 });
  await b.tap(".country-card-japan");
  await b.tap(".country-card-japan");
  t.check("第二次點擊已展開的日本卡才進入國家頁", await b.eval(
    `window.location.pathname === "/countries/japan/index.html"`));

  await b.goto("/index.html", { settle: 900 });
  await b.tap(".country-card-korea");
  const comingSoonTap = await b.eval(`(() => {
    const strip = document.querySelector(".country-strip").getBoundingClientRect();
    const card = document.querySelector(".country-card-korea").getBoundingClientRect();
    return {
      path: window.location.pathname,
      focused: document.querySelector(".country-card-korea").classList.contains("is-mobile-focused"),
      centered: Math.abs((card.left + card.right) / 2 - (strip.left + strip.right) / 2) < 8
    };
  })()`);
  t.check("Coming soon 卡片點擊後置中但不導頁",
    comingSoonTap.path === "/index.html" && comingSoonTap.focused && comingSoonTap.centered,
    JSON.stringify(comingSoonTap));
  t.check("手機版無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
}, { serial: true });

// 跑馬燈的地區清單、國家頁 showcase 清單，三處都要與實際存在的地區子頁一致——
// 這裡直接掃描檔案系統當作地面真相，不是拿另一份手寫清單互相比對。
export const cardRegionSync = suite("首頁 · 國家卡片跑馬燈同步地區子頁", async (b, t) => {
  const japanDir = join(repoRoot, "countries", "japan");
  const actualSlugs = readdirSync(japanDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(japanDir, entry.name, "index.html")))
    .map((entry) => entry.name)
    .sort();
  const expectedSlugs = [...REGIONS].sort();

  t.check("tests/regions.mjs 的地區清單與實際資料夾一致",
    JSON.stringify(actualSlugs) === JSON.stringify(expectedSlugs),
    `實際 ${actualSlugs.length} 個，清單 ${expectedSlugs.length} 個`
      + (JSON.stringify(actualSlugs) === JSON.stringify(expectedSlugs) ? "" :
        `；差異：${JSON.stringify(actualSlugs.filter((s) => !expectedSlugs.includes(s)))} 多出、`
        + `${JSON.stringify(expectedSlugs.filter((s) => !actualSlugs.includes(s)))} 缺少`));

  await b.desktop();
  await b.goto("/index.html", { settle: 1200 });

  const marquee = await b.eval(`(() => {
    const meta = document.querySelector(".country-card-japan .country-meta");
    return {
      label: meta?.getAttribute("aria-label") || "",
      text: meta?.querySelector(".country-meta-track")?.children[0]?.textContent || ""
    };
  })()`);

  // 用 aria-label 的「、」分隔號拆單筆地區名——「四日市・鈴鹿」本身就含「・」，
  // 拿可視跑馬燈文字的「・」分隔號來拆會誤斷成兩筆，「、」則不會跟任何地區名衝突。
  const labelNames = marquee.label.split("、").map((s) => s.trim()).filter(Boolean);
  const expectedNames = REGIONS.map((slug) => REGION_NAMES[slug]);
  const missing = expectedNames.filter((name) => !labelNames.includes(name));
  const extra = labelNames.filter((name) => !expectedNames.includes(name));
  const expectedText = `${expectedNames.join("・")}　`;

  t.check("跑馬燈地區數與實際地區頁數一致",
    labelNames.length === expectedNames.length,
    `跑馬燈 ${labelNames.length} 個，實際 ${expectedNames.length} 個`);
  t.check("跑馬燈沒有遺漏已建立的地區頁", missing.length === 0, missing.join("、") || "無遺漏");
  t.check("跑馬燈沒有不存在頁面的預告地名", extra.length === 0, extra.join("、") || "無多餘");
  t.check("跑馬燈可視文字與 aria-label 的地區清單一致（含順序）",
    marquee.text === expectedText, `跑馬燈：${marquee.text}\n預期：${expectedText}`);

  await b.goto("/countries/japan/index.html", { settle: 1000 });
  const showcaseSlugs = await b.eval(`JSON.stringify([...document.querySelectorAll(".region-showcase-item")]
    .map((item) => item.getAttribute("href")?.replace(/\\/index\\.html$/, "")).sort())`);

  t.check("國家頁 showcase 清單與實際地區頁一致",
    showcaseSlugs === JSON.stringify(expectedSlugs),
    `showcase ${JSON.parse(showcaseSlugs).length} 筆，實際 ${expectedSlugs.length} 筆`);

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
