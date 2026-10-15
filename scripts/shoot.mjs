// Minimal Chrome DevTools Protocol driver (dev-only verification harness).
//
//   node scripts/shoot.mjs <url> <out.png> [waitMs] [--w 1440] [--h 900] [--scroll 0.5] [--eval "expr"]
//
// Launches (or reuses) a headless Chrome with WebGPU enabled, loads the URL,
// waits, captures console output, optionally evaluates an expression and
// screenshots the page.

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = Number(process.env.CDP_PORT || 9333);
const PROFILE = process.env.CDP_PROFILE || `${process.env.HOME}/.cache/chrome-cdp-profile`;

const args = process.argv.slice(2);
const url = args[0];
const out = args[1];
const waitMs = Number(args[2] && !args[2].startsWith("--") ? args[2] : 4000);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? dflt : Number(args[i + 1]);
};
const strFlag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? dflt : args[i + 1];
};
const width = flag("w", 1440);
const height = flag("h", 900);
const scroll = flag("scroll", null);
const evalExpr = strFlag("eval", null);
const clickSelector = strFlag("click", null);
const hoverSelector = strFlag("hover", null);
const scrollY = flag("scrollY", null);
const prelude = strFlag("prelude", null);

if (!url || !out) {
  console.error("usage: shoot.mjs <url> <out.png> [waitMs] [--w N --h N --scroll 0..1 --scrollY px --eval expr]");
  process.exit(2);
}

async function ensureChrome() {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    if (r.ok) return JSON.parse(await r.text());
  } catch {}
  mkdirSync(PROFILE, { recursive: true });
  const child = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE}`,
      "--enable-unsafe-webgpu",
      "--enable-features=Vulkan,WebGPU",
      "--use-angle=metal",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--hide-scrollbars",
      "--mute-audio",
      `--window-size=${width},${height}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "ignore"], detached: true },
  );
  child.unref();
  for (let i = 0; i < 60; i++) {
    await sleep(250);
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return JSON.parse(await r.text());
    } catch {}
  }
  throw new Error("chrome did not expose the debugging port");
}

const version = await ensureChrome();

// Create a fresh target so console listeners are attached before navigation.
const targetRes = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" });
const target = await targetRes.json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let nextId = 1;
const pending = new Map();
const logs = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    return;
  }
  if (msg.method === "Runtime.consoleAPICalled") {
    const text = (msg.params.args || [])
      .map((a) => (a.value !== undefined ? a.value : (a.description ?? a.type)))
      .join(" ");
    logs.push(`[${msg.params.type}] ${text}`);
  }
  if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails;
    logs.push(`[exception] ${d.exception?.description || d.text}`);
  }
  if (msg.method === "Log.entryAdded") {
    logs.push(`[${msg.params.entry.level}] ${msg.params.entry.text}`);
  }
};

function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: Number(strFlag("dpr", 1)),
  mobile: false,
});
if (prelude) {
  await send("Page.addScriptToEvaluateOnNewDocument", { source: prelude });
}
await send("Page.navigate", { url });
await sleep(waitMs);

if (scrollY !== null) {
  await send("Runtime.evaluate", { expression: `window.scrollTo(0, ${scrollY})` });
  await sleep(1200);
}
if (scroll !== null) {
  await send("Runtime.evaluate", {
    expression: `window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * ${scroll})`,
  });
  await sleep(1500);
}
if (hoverSelector) {
  await send("Runtime.evaluate", {
    expression: `(() => { const el = document.querySelector(${JSON.stringify(hoverSelector)}); if (!el) return "no-node"; el.dispatchEvent(new MouseEvent("mouseover", {bubbles:true})); el.dispatchEvent(new MouseEvent("mouseenter", {bubbles:true})); return "ok"; })()`,
  });
  await sleep(900);
}
if (clickSelector) {
  await send("Runtime.evaluate", {
    expression: `(() => { const el = document.querySelector(${JSON.stringify(clickSelector)}); if (!el) return "no-node"; el.click(); return "ok"; })()`,
  });
  await sleep(1200);
}

let evalResult;
if (evalExpr) {
  const r = await send("Runtime.evaluate", {
    expression: evalExpr,
    awaitPromise: true,
    returnByValue: true,
  });
  evalResult = r.result?.value ?? r.result?.description;
}

const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
mkdirSync(out.replace(/\/[^/]+$/, ""), { recursive: true });
writeFileSync(out, Buffer.from(shot.data, "base64"));

console.log(`chrome: ${version.Browser}`);
console.log(`screenshot: ${out}`);
if (evalResult !== undefined) console.log(`eval: ${JSON.stringify(evalResult, null, 2)}`);
if (logs.length) console.log("--- console ---\n" + logs.join("\n"));

await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`).catch(() => {});
ws.close();
process.exit(0);
