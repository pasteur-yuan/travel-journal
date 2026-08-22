// 零依賴的瀏覽器測試工具：Node 內建 http 伺服器 + 內建 WebSocket 直連 Chrome DevTools Protocol。
// 不需要 npm install，與這個專案「無建置流程」的定位一致。
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".ico": "image/x-icon"
};

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
].filter(Boolean);

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 靜態檔案伺服器。以 file:// 開啟會讓部分 API 受限，測試一律走 http。 */
export function startServer(root) {
  const server = createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(root, normalize(pathname).replace(/^(\.\.[\\/])+/, ""));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
      return;
    }
    res.writeHead(200, {
      "content-type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store"
    });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({
        origin: `http://127.0.0.1:${port}`,
        close: () => new Promise((done) => server.close(done))
      });
    });
  });
}

function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      "找不到 Chrome。請安裝 Google Chrome，或以 CHROME_PATH 環境變數指定執行檔路徑。"
    );
  }
  return found;
}

export class Browser {
  #ws; #nextId = 1; #pending = new Map(); #chrome; #profile; #origin;
  /** 頁面內未攔截的 JS 例外，每次 goto 會清空。 */
  errors = [];
  /** 載入失敗的資源（相對路徑錯誤會出現在這裡）。 */
  failedRequests = [];

  static async launch(origin) {
    const browser = new Browser();
    browser.#origin = origin;
    browser.#profile = mkdtempSync(join(tmpdir(), "travel-journal-test-"));
    browser.#chrome = spawn(findChrome(), [
      "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${browser.#profile}`,
      "--no-first-run", "--no-default-browser-check", "--disable-gpu",
      "--disable-extensions", "--mute-audio", "about:blank"
    ], { stdio: "ignore" });

    const wsUrl = await browser.#discoverEndpoint();
    browser.#ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      browser.#ws.addEventListener("open", resolve, { once: true });
      browser.#ws.addEventListener("error", reject, { once: true });
    });
    browser.#ws.addEventListener("message", (event) => browser.#onMessage(event));
    await browser.send("Runtime.enable");
    await browser.send("Page.enable");
    await browser.send("Network.enable");
    return browser;
  }

  async #discoverEndpoint() {
    const portFile = join(this.#profile, "DevToolsActivePort");
    for (let i = 0; i < 100; i++) {
      if (existsSync(portFile)) {
        const port = readFileSync(portFile, "utf8").split("\n")[0].trim();
        try {
          const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
          const page = targets.find((t) => t.type === "page");
          if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
        } catch { /* 尚未就緒 */ }
      }
      await sleep(100);
    }
    throw new Error("Chrome 未在時限內啟動 DevTools 端點");
  }

  #onMessage(event) {
    const msg = JSON.parse(event.data);
    if (msg.id && this.#pending.has(msg.id)) {
      const { resolve, reject } = this.#pending.get(msg.id);
      this.#pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      return;
    }
    if (msg.method === "Runtime.exceptionThrown") {
      const details = msg.params.exceptionDetails;
      this.errors.push(details.exception?.description || details.text);
    }
    if (msg.method === "Network.loadingFailed") {
      this.failedRequests.push(msg.params.errorText);
    }
    if (msg.method === "Network.responseReceived" && msg.params.response.status >= 400) {
      this.failedRequests.push(`${msg.params.response.status} ${msg.params.response.url}`);
    }
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.#nextId++;
      this.#pending.set(id, { resolve, reject });
      this.#ws.send(JSON.stringify({ id, method, params }));
    });
  }

  /** 在頁面內求值。會等待 Promise，因此可直接 return 非同步結果。 */
  async eval(expression) {
    const { result, exceptionDetails } = await this.send("Runtime.evaluate", {
      expression, returnByValue: true, awaitPromise: true
    });
    if (exceptionDetails) {
      throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
    }
    return result.value;
  }

  /** 桌面版視窗。 */
  async desktop() {
    await this.send("Emulation.setDeviceMetricsOverride",
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await this.send("Emulation.setTouchEmulationEnabled", { enabled: false });
    await this.send("Emulation.setEmulatedMedia",
      { features: [{ name: "hover", value: "hover" }, { name: "pointer", value: "fine" }] });
  }

  /** 手機版視窗，含觸控與 hover: none（重現觸控裝置的 sticky hover 條件）。 */
  async mobile() {
    await this.send("Emulation.setDeviceMetricsOverride",
      { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await this.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await this.send("Emulation.setEmulatedMedia",
      { features: [{ name: "hover", value: "none" }, { name: "pointer", value: "coarse" }] });
  }

  /**
   * 平板視窗，含觸控與 hover: none。預設是 iPad 直向（768×1024），
   * 傳 { landscape: true } 換成橫向（1024×768）——寬度會超過 701–1199px
   * 的平板排版斷點上限，剛好用來驗證「橫向平板不會退回桌面版邏輯」
   * （靠 hover: none，不是靠寬度）。
   */
  async tablet({ landscape = false } = {}) {
    const [width, height] = landscape ? [1024, 768] : [768, 1024];
    await this.send("Emulation.setDeviceMetricsOverride",
      { width, height, deviceScaleFactor: 2, mobile: true });
    await this.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await this.send("Emulation.setEmulatedMedia",
      { features: [{ name: "hover", value: "none" }, { name: "pointer", value: "coarse" }] });
  }

  async reducedMotion(enabled = true) {
    await this.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: enabled ? "reduce" : "no-preference" }]
    });
  }

  async goto(path, { settle = 900 } = {}) {
    this.errors = [];
    this.failedRequests = [];
    const url = path.startsWith("http") ? path : this.#origin + path;
    const loaded = new Promise((resolve) => {
      const onMessage = (event) => {
        if (JSON.parse(event.data).method === "Page.loadEventFired") {
          this.#ws.removeEventListener("message", onMessage);
          resolve();
        }
      };
      this.#ws.addEventListener("message", onMessage);
    });
    await this.send("Page.navigate", { url: `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` });
    await loaded;
    await sleep(settle);
  }

  /**
   * 取得元素中心點（視窗座標）。
   * scroll 預設為 true；量測捲動位置的測試必須傳 false，
   * 否則 scrollIntoView 造成的位移會被誤算成受測程式的行為。
   */
  async #center(selector, scroll = true) {
    return this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return null;
      ${scroll ? 'el.scrollIntoView({ block: "center", behavior: "instant" });' : ""}
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return null;
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    })()`);
  }

  /** 先把元素捲到畫面中央並靜置，之後的量測才不會混入測試自身的捲動。 */
  async scrollIntoView(selector) {
    await this.eval(`document.querySelector(${JSON.stringify(selector)})
      ?.scrollIntoView({ block: "center", behavior: "instant" })`);
    await sleep(250);
  }

  async hover(selector, { scroll = true } = {}) {
    const point = await this.#center(selector, scroll);
    if (!point) throw new Error(`hover 找不到可見元素：${selector}`);
    await sleep(120);
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point, button: "none" });
    await sleep(200);
  }

  /** 把滑鼠移到不會碰到任何互動元素的角落，用來確認 hover 狀態有正確解除。 */
  async moveAway() {
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 2, y: 2, button: "none" });
    await sleep(250);
  }

  async click(selector, { scroll = true } = {}) {
    const point = await this.#center(selector, scroll);
    if (!point) throw new Error(`click 找不到可見元素：${selector}`);
    await sleep(120);
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point, button: "none" });
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", ...point, button: "left", clickCount: 1 });
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", ...point, button: "left", clickCount: 1 });
    await sleep(250);
  }

  /** 觸控點擊，走與真實手機相同的 pointerdown → click 路徑。 */
  async tap(selector, { settle = 350, scroll = true } = {}) {
    const point = await this.#center(selector, scroll);
    if (!point) throw new Error(`tap 找不到可見元素：${selector}`);
    await sleep(150);
    await this.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
    await this.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await sleep(settle);
  }

  async press(key) {
    const codes = {
      Escape: { windowsVirtualKeyCode: 27, key: "Escape", code: "Escape" },
      Enter: { windowsVirtualKeyCode: 13, key: "Enter", code: "Enter", text: "\r" },
      " ": { windowsVirtualKeyCode: 32, key: " ", code: "Space", text: " " },
      Tab: { windowsVirtualKeyCode: 9, key: "Tab", code: "Tab" },
      ArrowLeft: { windowsVirtualKeyCode: 37, key: "ArrowLeft", code: "ArrowLeft" },
      ArrowRight: { windowsVirtualKeyCode: 39, key: "ArrowRight", code: "ArrowRight" }
    };
    const spec = codes[key];
    if (!spec) throw new Error(`未支援的按鍵：${key}`);
    await this.send("Input.dispatchKeyEvent", { type: "keyDown", ...spec });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", ...spec });
    await sleep(200);
  }

  async focus(selector) {
    await this.eval(`document.querySelector(${JSON.stringify(selector)})?.focus()`);
    await sleep(200);
  }

  async close() {
    try { this.#ws?.close(); } catch { /* 已關閉 */ }
    this.#chrome?.kill();
    await rm(this.#profile, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * 定義一個測試群組。fn 會拿到 (browser, t)，t.check 記錄一條斷言。
 * options.serial = true 的群組不與其他群組同時執行，留給對時間敏感、
 * 會在動畫中途取樣的測試，避免多個 Chrome 互搶 CPU 造成 flaky。
 */
export function suite(name, fn, options = {}) {
  return { name, fn, serial: Boolean(options.serial) };
}

export function createRecorder() {
  const checks = [];
  return {
    checks,
    check(name, passed, detail = "") {
      checks.push({ name, passed: Boolean(passed), detail: String(detail), skipped: false });
    },
    skip(name, reason) {
      checks.push({ name, passed: true, detail: reason, skipped: true });
    }
  };
}
