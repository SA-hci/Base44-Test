/*
  Exhibit helper — shared by every project's phone page.

  A project page includes this file and calls:

    Exhibit.start({
      project: "leaves",                  // lowercase, max 10 letters/digits/-
      title: "Autumn Leaves",
      instructions: "Place your phone in its place, then tap the button.",
      onPlaced()    { ... },              // phone is in place: start your visuals
      onEvent(cmd)  { ... },              // a message from your micro:bit, e.g. "BLOW"
      onRemoved()   { ... },              // phone left: reset your visuals
      demoEvents: ["BLOW", "DONE"],       // buttons shown when testing with ?demo
    });

    Exhibit.send("HELLO");                // optional: message to your micro:bit (max 8 chars, A-Z 0-9 _)

  Add ?demo to the page address to test without Ably or a micro:bit.
*/
(function () {
  "use strict";

  // Ably v3 device build (accounts on MAU pricing require v3+). Exposes window.AblyPubSub.
  const ABLY_LIB = "https://cdn.jsdelivr.net/npm/@ably/pubsub-device@3.0.0/dist/cdn/ably.min.js";
  const script = document.currentScript;
  const BASE = script ? script.src.slice(0, script.src.lastIndexOf("/") + 1) : "";
  const DEMO = new URLSearchParams(location.search).has("demo");
  const PROJECT_RE = /^[a-z0-9-]{1,10}$/;
  const CMD_RE = /^[A-Z0-9_]{1,8}$/;

  let opts = null;
  let state = "connecting"; // connecting | place | claiming | busy | running | error
  let client = null, projectCh = null, phoneCh = null;
  let wakeLock = null;
  // Ably counts monthly active users by client ID, so a phone keeps the same ID between visits.
  const myId = (() => {
    let id = null;
    try { id = localStorage.getItem("exhibitPhoneId"); } catch (_) {}
    if (!id || !/^phone-[a-z0-9]{8}$/.test(id)) {
      id = "phone-" + Math.random().toString(36).slice(2, 10).padEnd(8, "0");
      try { localStorage.setItem("exhibitPhoneId", id); } catch (_) {}
    }
    return id;
  })();

  // ---------------------------------------------------------------- UI
  const CSS = `
  #ex-ui{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;
    background:rgba(20,14,8,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
    font:16px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#2a1d12;transition:opacity .4s}
  #ex-ui,#ex-ui *,#ex-demo,#ex-demo *{box-sizing:border-box}
  #ex-ui.hidden{opacity:0;pointer-events:none}
  #ex-card{width:min(420px,100%);background:#fbf6ee;border-radius:22px;padding:28px 22px 22px;text-align:center;
    box-shadow:0 20px 60px rgba(0,0,0,.35)}
  #ex-card h1{font-size:1.45rem;margin:6px 0 8px;line-height:1.2}
  #ex-card p{margin:0 0 20px;color:#6b5a48}
  #ex-card svg{width:92px;height:92px;display:block;margin:0 auto 4px}
  #ex-btn{font:inherit;font-weight:700;font-size:1.1rem;width:100%;padding:16px;border:0;border-radius:14px;
    background:#c2410c;color:#fff;cursor:pointer;touch-action:manipulation}
  #ex-btn:disabled{opacity:.5}
  #ex-btn[hidden]{display:none}
  #ex-spin{width:36px;height:36px;margin:8px auto 18px;border-radius:50%;border:4px solid #e8dccb;border-top-color:#c2410c;
    animation:ex-spin .8s linear infinite}
  #ex-spin[hidden]{display:none}
  @keyframes ex-spin{to{transform:rotate(360deg)}}
  #ex-dot{position:fixed;right:10px;bottom:10px;width:10px;height:10px;border-radius:50%;z-index:2147483001;
    background:#999;box-shadow:0 0 0 2px rgba(255,255,255,.5);opacity:.75}
  #ex-dot.ok{background:#22c55e}#ex-dot.warn{background:#f59e0b}#ex-dot.bad{background:#ef4444}
  #ex-demo{position:fixed;left:12px;right:12px;bottom:14px;z-index:2147483001;display:flex;gap:8px;
    flex-wrap:wrap;justify-content:center;font:600 14px system-ui,sans-serif}
  #ex-demo span{background:#111;color:#fde68a;padding:8px 10px;border-radius:10px}
  #ex-demo button{font:inherit;border:0;border-radius:10px;padding:8px 14px;background:#fff;color:#111;cursor:pointer;
    box-shadow:0 2px 8px rgba(0,0,0,.3)}`;

  const PHONE_SVG = `<svg viewBox="0 0 96 96" aria-hidden="true"><rect x="10" y="62" width="76" height="14" rx="4" fill="#e8dccb"/>
    <rect x="30" y="8" width="36" height="62" rx="7" fill="#2a1d12"/><rect x="34" y="14" width="28" height="48" rx="3" fill="#f59e0b"/>
    <path d="M48 76v10M40 80l8 8 8-8" stroke="#c2410c" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  let ui, card, titleEl, textEl, btn, spin, dot;

  function buildUI() {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    ui = document.createElement("div");
    ui.id = "ex-ui";
    ui.innerHTML = `<div id="ex-card">${PHONE_SVG}<h1></h1><p></p><div id="ex-spin"></div><button id="ex-btn" hidden></button></div>`;
    document.body.appendChild(ui);
    card = ui.querySelector("#ex-card");
    titleEl = card.querySelector("h1");
    textEl = card.querySelector("p");
    btn = card.querySelector("#ex-btn");
    spin = card.querySelector("#ex-spin");
    btn.addEventListener("click", onButton);
    dot = document.createElement("div");
    dot.id = "ex-dot";
    document.body.appendChild(dot);
  }

  function show(title, text, button, spinning) {
    ui.classList.remove("hidden");
    titleEl.textContent = title;
    textEl.textContent = text;
    btn.hidden = !button;
    btn.disabled = false;
    if (button) btn.textContent = button;
    spin.hidden = !spinning;
  }

  function setState(s, extra) {
    state = s;
    const o = opts;
    if (s === "connecting") show(o.title, "Connecting…", null, true);
    else if (s === "place") show(o.title, o.instructions, o.buttonText || "My phone is in place", false);
    else if (s === "claiming") show(o.title, "Getting the station ready…", null, true);
    else if (s === "busy") show("Station in use", "Another phone is using this station right now. Wait a moment and try again.", "Try again", false);
    else if (s === "error") show("Something went wrong", extra || "", "Reload", false);
    else if (s === "running") ui.classList.add("hidden");
  }

  function setDot(kind) { if (dot) dot.className = kind; }

  // ---------------------------------------------------------------- helpers
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Could not load " + src));
      document.head.appendChild(s);
    });
  }

  async function keepAwake() {
    try {
      if ("wakeLock" in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => { wakeLock = null; });
      }
    } catch (_) { /* not allowed here; ignore */ }
  }

  function call(name, ...args) {
    try { opts[name] && opts[name](...args); }
    catch (e) { console.error(`Exhibit: error in ${name}()`, e); }
  }

  // ---------------------------------------------------------------- flow
  async function onButton() {
    if (state === "error") { location.reload(); return; }
    if (state !== "place" && state !== "busy") return;
    btn.disabled = true;
    keepAwake();
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(() => {});

    if (DEMO) { enterRunning(); return; }

    setState("claiming");
    try {
      await phoneCh.presence.enter({ project: opts.project });
      const members = await phoneCh.presence.get();
      const here = members
        .filter((m) => m.data && m.data.project === opts.project)
        .sort((a, b) => a.timestamp - b.timestamp || (a.clientId < b.clientId ? -1 : 1));
      if (here.length && here[0].clientId !== myId) {
        await phoneCh.presence.leave();
        setState("busy");
        return;
      }
      enterRunning();
    } catch (e) {
      console.error(e);
      setState("error", "Could not reach the station: " + e.message);
    }
  }

  function enterRunning() {
    setState("running");
    call("onPlaced");
  }

  async function leaveStation() {
    if (state !== "running") return;
    setState("place");
    call("onRemoved");
    if (!DEMO && phoneCh) { try { await phoneCh.presence.leave(); } catch (_) {} }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") leaveStation();
    else if (state === "running") keepAwake();
  });
  window.addEventListener("pagehide", leaveStation);

  async function connect() {
    await loadScript(BASE + "config.js");
    const key = window.EXHIBIT_CONFIG && window.EXHIBIT_CONFIG.ablyKey;
    if (!key || /PASTE/.test(key)) {
      throw new Error("The Ably phone key isn't set yet (lib/config.js). To test without it, add ?demo to the address.");
    }
    await loadScript(ABLY_LIB);
    client = AblyPubSub.createClient({ key, clientId: myId, echoMessages: false });
    client.connection.on((c) => {
      setDot(c.current === "connected" ? "ok" : c.current === "failed" || c.current === "suspended" ? "bad" : "warn");
      if (c.current === "failed") setState("error", "Connection refused: " + (c.reason ? c.reason.message : "unknown reason"));
    });
    projectCh = client.channels.get("exhibit:" + opts.project);
    phoneCh = client.channels.get("phone");
    await projectCh.subscribe((msg) => {
      if (state === "running" && CMD_RE.test(msg.name || "")) call("onEvent", msg.name, msg.data);
    });
    await phoneCh.attach();
  }

  function buildDemoBar() {
    const bar = document.createElement("div");
    bar.id = "ex-demo";
    bar.innerHTML = "<span>DEMO</span>";
    (opts.demoEvents || []).forEach((cmd) => {
      const b = document.createElement("button");
      b.textContent = cmd;
      b.onclick = () => { if (state === "running") call("onEvent", cmd, null); };
      bar.appendChild(b);
    });
    const leave = document.createElement("button");
    leave.textContent = "Remove phone";
    leave.onclick = leaveStation;
    bar.appendChild(leave);
    document.body.appendChild(bar);
  }

  // ---------------------------------------------------------------- public API
  async function start(options) {
    opts = Object.assign({ title: "Exhibit", instructions: "Place your phone in its place, then tap the button." }, options);
    if (!document.body) await new Promise((r) => document.addEventListener("DOMContentLoaded", r));
    buildUI();
    if (!PROJECT_RE.test(opts.project || "")) {
      setState("error", `Project name "${opts.project}" isn't valid: use up to 10 lowercase letters, digits or -.`);
      return;
    }
    if (DEMO) { buildDemoBar(); setDot("warn"); setState("place"); return; }
    setState("connecting");
    try { await connect(); setState("place"); }
    catch (e) { console.error(e); setDot("bad"); setState("error", e.message); }
  }

  function send(cmd) {
    if (!CMD_RE.test(cmd)) { console.warn("Exhibit.send: use up to 8 capital letters, digits or _ :", cmd); return; }
    if (DEMO) { console.log("[demo] would send to micro:bit:", opts.project + ":" + cmd); return; }
    if (state !== "running" || !phoneCh) return;
    phoneCh.publish("cmd", { project: opts.project, cmd }).catch((e) => console.warn(e));
  }

  window.Exhibit = { start, send, demo: DEMO };
})();
