import { sleep, suite } from "../harness.mjs";

const PAGE = "/countries/japan/index.html";

export const showcase = suite("國家頁 · 地區 showcase", async (b, t) => {
  await b.desktop();
  await b.goto(PAGE, { settle: 1200 });

  const shape = await b.eval(`(() => {
    const items = [...document.querySelectorAll(".region-showcase-item")];
    const list = document.querySelector(".region-showcase-list");
    return {
      count: items.length,
      allLinks: items.every(i => i.tagName === "A" && i.getAttribute("href")),
      allHaveImage: items.every(i => !!i.dataset.image),
      arrowsAsIcons: items.every(i => !!i.querySelector(".region-showcase-arrow i")),
      bound: items.every(i => i.dataset.showcaseBound === "true"),
      activeCount: items.filter(i => i.classList.contains("is-active")).length,
      listScrolls: list.scrollHeight > list.clientHeight + 1,
      pageScrolls: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1
    };
  })()`);

  t.check("地區項目由 HTML 列出", shape.count >= 2, `${shape.count} 個`);
  t.check("每個項目都是可聚焦的連結", shape.allLinks);
  t.check("每個項目都有背景圖資料", shape.allHaveImage);
  t.check("箭頭自動換成 Font Awesome 圖示", shape.arrowsAsIcons);
  t.check("所有項目都已綁定互動", shape.bound);
  t.check("同時只有一個項目是 active", shape.activeCount === 1, `${shape.activeCount} 個`);
  t.check("外層頁面不上下捲動（只有清單內部捲動）", !shape.pageScrolls,
    `頁面捲動=${shape.pageScrolls}、清單捲動=${shape.listScrolls}`);

  // hover 切換背景
  const second = ".region-showcase-item:nth-of-type(2)";
  await b.hover(second);
  const afterHover = await b.eval(`(() => {
    const item = document.querySelector('${second}');
    const backdrop = document.querySelector(".region-showcase-backdrop");
    return {
      active: item.classList.contains("is-active"),
      image: backdrop.style.getPropertyValue("--region-showcase-image"),
      expected: item.dataset.image,
      others: [...document.querySelectorAll(".region-showcase-item.is-active")].length
    };
  })()`);
  t.check("hover 項目會標記 is-active", afterHover.active);
  t.check("hover 項目會切換背景圖",
    afterHover.image.includes(afterHover.expected.split("/").pop()),
    `${afterHover.image} vs ${afterHover.expected}`);
  t.check("切換後仍只有一個 active", afterHover.others === 1, `${afterHover.others} 個`);

  // 滑鼠追蹤光暈
  const glow = await b.eval(`(() => {
    const item = document.querySelector('${second}');
    const r = item.getBoundingClientRect();
    document.querySelector(".region-showcase").dispatchEvent(new PointerEvent("pointermove", {
      clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true }));
    return new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() =>
      res({ x: item.style.getPropertyValue("--pointer-x"), y: item.style.getPropertyValue("--pointer-y") }))));
  })()`);
  t.check("項目套用滑鼠追蹤光暈座標", glow.x !== "" && glow.y !== "", JSON.stringify(glow));

  // 按壓回彈
  const press = await b.eval(`(() => {
    const item = document.querySelector('${second}');
    const r = item.getBoundingClientRect();
    item.dispatchEvent(new PointerEvent("pointerdown", {
      clientX: r.left + 20, clientY: r.top + 20, bubbles: true, pointerId: 1 }));
    const read = (n) => item.style.getPropertyValue(n);
    const result = { pressed: item.classList.contains("is-pressed"),
                     x: read("--press-x"), radius: read("--press-radius"), rotate: read("--press-rotate") };
    item.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
    return result;
  })()`);
  t.check("按壓會進入 is-pressed 狀態", press.pressed);
  t.check("按壓會產生隨機的液態變形參數",
    press.x !== "" && press.radius !== "" && press.rotate !== "", JSON.stringify(press));
  t.check("放開後解除按壓狀態",
    await b.eval(`!document.querySelector('${second}').classList.contains("is-pressed")`));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const showcaseDynamic = suite("國家頁 · 動態新增地區項目", async (b, t) => {
  await b.desktop();
  await b.goto(PAGE, { settle: 1200 });

  const added = await b.eval(`(async () => {
    const list = document.querySelector(".region-showcase-list");
    const el = document.createElement("a");
    el.className = "region-showcase-item";
    el.id = "dynamic-region";
    el.dataset.image = "../../assets/images/osaka.jpg";
    el.href = "osaka/index.html";
    el.innerHTML = '<span class="region-showcase-index">99</span>' +
      '<span><h3>動態地區</h3><p>測試</p></span>' +
      '<span class="region-showcase-arrow" aria-hidden="true">↗</span>';
    list.append(el);
    await new Promise(r => setTimeout(r, 400));
    return {
      bound: el.dataset.showcaseBound === "true",
      arrowIcon: !!el.querySelector(".region-showcase-arrow i")
    };
  })()`);

  t.check("MutationObserver 自動綁定新項目", added.bound);
  t.check("新項目自動取得箭頭圖示", added.arrowIcon);

  // 新項目也要能切換背景
  await b.hover("#dynamic-region");
  const active = await b.eval(`(() => ({
    active: document.querySelector("#dynamic-region").classList.contains("is-active"),
    image: document.querySelector(".region-showcase-backdrop").style.getPropertyValue("--region-showcase-image")
  }))()`);
  t.check("新項目 hover 可切換背景",
    active.active && active.image.includes("osaka"), JSON.stringify(active));

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

// 這個轉場曾經整整壞著沒被發現：JS 完整設定了轉場層，CSS 卻是 display: none，
// 所以「照片從項目位置擴張填滿畫面」從來沒有出現過，兩個頁面之間也就沒有視覺線索。
// 這裡逐幀取樣，確認它真的會顯示、而且是連續動畫而非瞬間跳到終點。
export const pageTransition = suite("國家頁 · 進入地區頁的轉場", async (b, t) => {
  await b.desktop();
  await b.goto(PAGE, { settle: 1200 });

  const item = '.region-showcase-item[href="tokyo/index.html"]';
  const point = await b.eval(`(() => {
    const el = document.querySelector('${item}');
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2),
             top: Math.round(r.top), height: Math.round(r.height) };
  })()`);

  // 先完成 hover 並靜置，再掛取樣器。長時間執行的 Runtime.evaluate 會延後
  // 之後送出的 Input 事件，若在取樣期間才 hover，點擊會被推到取樣結束之後。
  await b.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y, button: "none" });
  await sleep(200);

  // 取樣器要先掛好再點擊，否則會漏掉動畫開頭
  const sampling = b.eval(`(() => new Promise((resolve) => {
    const layer = document.querySelector(".page-transition-layer");
    const started = performance.now();
    const samples = [];
    const tick = () => {
      const style = getComputedStyle(layer);
      samples.push({ t: Math.round(performance.now() - started), clip: style.clipPath,
                     opacity: Number(style.opacity), display: style.display });
      if (performance.now() - started < 620) requestAnimationFrame(tick);
      else resolve(samples);
    };
    requestAnimationFrame(tick);
  }))()`);

  await sleep(30);
  await b.send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
  await b.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
  const samples = await sampling;

  const visible = samples.filter((s) => s.display !== "none" && s.opacity > 0.5);
  t.check("轉場層會實際顯示", visible.length > 0,
    `${visible.length}/${samples.length} 幀可見（display=${samples.at(-1)?.display}）`);

  const clips = [...new Set(samples.map((s) => s.clip))];
  t.check("clip-path 是連續動畫而非瞬間跳到終點", clips.length >= 5,
    `${clips.length} 個不同的 clip-path 值`);

  const insets = samples
    .map((s) => Number((s.clip.match(/inset\(([\d.]+)px/) || [])[1]))
    .filter((n) => Number.isFinite(n));
  t.check("擴張起點對齊被點擊的項目",
    insets.length > 0 && Math.abs(insets[0] - point.top) <= 12,
    `起點 top ${insets[0]?.toFixed(0)}px vs 項目 top ${point.top}px`);
  t.check("擴張過程單向遞減至填滿畫面",
    insets.length > 2 && insets.at(-1) < insets[0] && insets.at(-1) < 60,
    `${insets[0]?.toFixed(0)}px → ${insets.at(-1)?.toFixed(0)}px`);

  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});

export const transitionReducedMotion = suite("國家頁 · 轉場的 reduced-motion 降級", async (b, t) => {
  await b.desktop();
  await b.reducedMotion(true);
  await b.goto(PAGE, { settle: 1200 });
  t.check("reduced-motion 下轉場層不顯示", await b.eval(
    `getComputedStyle(document.querySelector(".page-transition-layer")).display === "none"`));
  await b.reducedMotion(false);
});

export const showcaseMobile = suite("國家頁 · 手機版", async (b, t) => {
  await b.mobile();
  await b.goto(PAGE, { settle: 1200 });

  const res = await b.eval(`(() => {
    const list = document.querySelector(".region-showcase-list");
    return {
      listScrolls: list.scrollHeight > list.clientHeight + 1,
      pageScrollsSideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      descriptionsVisible: [...document.querySelectorAll(".region-showcase-item p")]
        .every(p => getComputedStyle(p).opacity === "1")
    };
  })()`);
  t.check("手機版地區清單仍維持內部捲動", res.listScrolls);
  t.check("手機版不產生水平捲動", !res.pageScrollsSideways);
  t.check("手機版地區描述直接可見", res.descriptionsVisible);
  t.check("無 JS 例外", b.errors.length === 0, b.errors.join(" | ") || "none");
});
