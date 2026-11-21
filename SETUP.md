# Exhibit hub — setup

This folder is the GitHub repo **Base44 Test**. Its website address is
`https://<username>.github.io/Base44-Test/` (spaces in the repo name become `-`).

> **Repo address vs. site address:** `github.com/<username>/Base44-Test` shows the *files*.
> The pages that run are at `<username>.github.io/Base44-Test/`. Find it in the repo under
> **Settings → Pages → Visit site**. Always share the github.io address.

```
index.html                 hub page with links
test/index.html            network check
lib/exhibit.js             shared helper every phone page loads (placing, station claim, Exit button logic)
lib/config.js              the LIMITED phone key goes here
gateway/index.html         laptop page (Ably + USB to the gateway micro:bit)
projects/leaves/index.html Autumn Leaves phone page
microbit/*.ts              MakeCode programs (paste into MakeCode; harmless if also on GitHub)
```

How a message travels:

```
button A → leaves micro:bit ──radio "leaves:BLOW"──► gateway micro:bit ──USB──► laptop gateway page
         ──Ably channel "exhibit:leaves"──► phone page → leaves blow
phone "in place" ──Ably presence──► laptop ──USB──► gateway ──radio "leaves:PLACED"──► leaves micro:bit shows 🙂
```

**Uploading changes to GitHub:** GitHub Pages takes up to ~10 minutes to update, and phones/browsers
keep old copies. After uploading, reload with **Ctrl+Shift+R** (laptop) or close and reopen the tab (phone).
If something "didn't change", this is almost always why.

---

## 1. Try it right away (no hardware, no Ably)

Upload the whole folder to the repo (keep the folder structure), then open on a phone:
`https://<username>.github.io/Base44-Test/projects/leaves/?demo`
Tap **My phone is in place**, then use the **BLOW** / **DONE** buttons at the bottom.

## 2. Ably account (once, ~5 minutes)

1. Sign up (free) at **ably.com** and create an app (ours: `Interactive gateway #1`).
2. Open the app → **API Keys**.
   - The existing **Root** key is the **laptop key**. Never put it in any file, on GitHub, or in a chat.
3. Create a new key named `phones`:
   - Capabilities: tick **Publish**, **Subscribe** and **Presence**.
   - Channel restrictions: add **two separate entries**, `exhibit:*` and `phone`
     (not one entry with both — that gives *"Channel denied access based on given capability"* on the phone).
4. Copy the `phones` key into **`lib/config.js`** (replace `PASTE_PHONE_KEY_HERE`) and upload that file to GitHub.

**Ably library:** new Ably accounts use "MAU" pricing (monthly active users) and only accept the v3
library `@ably/pubsub-device`. All pages already use it. If you ever see *"This version of the Ably SDK is not
compatible with your account, which uses MAU pricing"*, a page is using an old copy — re-upload it and Ctrl+Shift+R.
Each phone counts as one user per month (it keeps the same ID between visits), the laptop as one more.
Check the free plan's user limit on ably.com/pricing.

What the phone key can do: listen to projects, say "phone in place", and send short messages to
micro:bits. It can't run motors in the leaves project — the motor runs only from the physical button.

## 3. micro:bits (MakeCode)

For **each** micro:bit:

1. **makecode.microbit.org → Home → New Project** (always a *new, empty* project — leftover code from an
   older project causes *"Compilation failed"*).
2. At the top, switch to **JavaScript** (not Python — Python also gives *"Compilation failed"*).
3. Click in the code, **Ctrl+A**, **Delete** — the editor must be completely empty.
4. Open the `.ts` file in Notepad, **Ctrl+A**, **Ctrl+C**, then **Ctrl+V** into MakeCode.
5. Small arrow next to **Download** → **Download as File**, then drag the `.hex` onto the **MICROBIT** drive.

**Don't pair/connect MakeCode to the micro:bit** (the "Connect device" / WebUSB option). A paired MakeCode tab
keeps reading the gateway's USB connection and steals parts of its messages: the gateway log shows garbled
lines like `gtewayALIVE`, `leave:BLW`, and the phone reacts rarely or late. If it happened: close every
MakeCode tab, unplug and replug the gateway micro:bit.

| micro:bit | File | Screen |
|---|---|---|
| Gateway (plugged into laptop) | `microbit/gateway-microbit.ts` | ✓ running · top-right dot blinks every 2 s (heartbeat) · bottom-right blinks = laptop sent something · bottom-left blinks = radio message passed to laptop |
| Leaves station | `microbit/leaves-station.ts` | 💤 no phone · 🙂 phone in place · ≡ fan running |

Both use radio group **77**. Every student project must use group 77 too.
Radio messages are `project:COMMAND`, at most 19 characters (project ≤ 10 lowercase letters/digits/-,
command ≤ 8 capitals/digits/_). Project micro:bits send every message twice; the laptop ignores the copy.

**Why the gateway program pads messages with spaces:** the micro:bit's USB chip holds short messages back
until it has a full 64-byte packet, which delayed BLOW by ~5–10 s (it arrived together with DONE).
Every message is now followed by a line of spaces that pushes it out immediately. Keep this in any
modified gateway program.

### Wiring the leaves station

**Button** — the micro:bit's own **button A**. Nothing to wire.
(The Gravity push button on P1 was unreliable in testing. If you use one, it sends **1 when pressed** —
use `pins.digitalReadPin(DigitalPin.P1) == 1` with `PinPullMode.PullNone`.)

**Fan** — DFRobot micro:bit shield + **Gravity fan module** plugged into **P8**.
If the fan runs when it should be off, change `FAN_ON` to `0` in the station program.

Other motors: never wire a motor straight to the micro:bit; it needs a driver.
With an **L9110S fan/motor module** (or similar):
| Module pin | Connect to |
|---|---|
| INA (or IA / IN1) | micro:bit **P8** |
| INB (or IB / IN2) | micro:bit **GND** |
| VCC | battery **+** (e.g. 4×AA) |
| GND | battery **−** **and** micro:bit **GND** (shared ground) |
| Motor outputs | the DC motor |

If the fan blows the wrong way, swap the two motor wires.

With a **transistor/MOSFET** instead: P8 → 1 kΩ → gate/base, motor between battery + and drain/collector,
source/emitter to GND, a diode across the motor (stripe towards +), shared ground.

## 4. Laptop

1. Close all MakeCode tabs. Plug in the gateway micro:bit.
2. Open `https://<username>.github.io/Base44-Test/gateway/` in **Chrome or Edge** (Web Serial doesn't work in other browsers).
3. Paste the **Root** key → **Connect** (saved in this browser only; **Forget key** removes it).
4. **Connect micro:bit** → pick the micro:bit. Status should say **Connected — gateway ready**,
   and the log shows *"gateway micro:bit answered"*. Next time the page reconnects by itself.
5. Keep the gateway page open the whole exhibition (other tabs in front are fine). Disable laptop sleep.

The **Test without hardware** box lets you pretend a micro:bit sent `leaves:BLOW`, to check a phone reacts.

### Reading the gateway log

| Log line | Meaning |
|---|---|
| `→ radio leaves:PLACED` / `leaves:LEFT` | a phone was placed / left; sent to the station |
| `radio → leaves:BLOW` … ~5 s later `radio → leaves:DONE` | button pressed; fan ran. They should be **5 s apart** — if they arrive together, messages are delayed |
| `ignored: …` + red *"arriving garbled"* | another program (MakeCode) is reading the USB port — close it, replug |
| *"USB delay: nothing from the gateway micro:bit for X s"* | the heartbeat was late — flash the newest gateway program, then replug |
| *"Connected, but no reply"* | wrong/old program on the gateway micro:bit, or replug needed |
| *"not sent to phones — Ably isn't connected"* | reconnect the Ably key / check internet |

### Testing step by step

1. Gateway page: Ably dot green, USB *gateway ready*.
2. Phone: open the project, tap **My phone is in place** → log `→ radio leaves:PLACED`, station shows 🙂.
3. Press button A → station shows ≡, fan spins 5 s; log shows BLOW at once and DONE 5 s later; leaves blow on the phone within ~1 s.
4. Press again after 🙂 returns — it should work every time.
5. Tap **Exit** on the phone → log `→ radio leaves:LEFT`, station shows 💤.

## 5. Phone / QR code

QR code → `https://<username>.github.io/Base44-Test/projects/leaves/`

- Works in any phone browser (iPhone included) — no app, no Bluetooth. The phone needs internet (any network).
- Only one phone can use a station at a time; a second phone sees *"Station in use"*.
- The screen stays on while the project runs. Leaving the tab or locking the phone frees the station.
- **Exit** (top-right ✕) frees the station and shows a "Thanks for visiting" screen. Browsers don't allow a
  page to close its own tab, so visitors close it themselves. Student pages get the same with
  `Exhibit.exit()` on their own button.

Options you can add to the address: `?from=right` (or `top`, `bottom`) — the side the fan blows from (default `left`).
`?demo` — test without Ably or hardware.

## Network check

`https://<username>.github.io/Base44-Test/test/` — run on **school Wi-Fi** (laptop and a phone) before the
exhibition. The school blocks non-443 ports; Ably uses 443 and falls back to plain HTTPS polling if needed.
The MQTT line in the results is only for comparison and is expected to fail at school.
