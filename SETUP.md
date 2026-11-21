# Exhibit hub — setup

This folder is the GitHub repo **Base44 Test** (address: `https://<username>.github.io/Base44-Test/`).

```
index.html                 hub page with links
test/index.html            network check
lib/exhibit.js             shared helper every phone page loads
lib/config.js              the LIMITED phone key goes here
gateway/index.html         laptop page (Ably + USB to the gateway micro:bit)
projects/leaves/index.html Autumn Leaves phone page
microbit/*.ts              MakeCode programs (paste, don't upload to GitHub — harmless if you do)
```

How a message travels:

```
button → leaves micro:bit ──radio "leaves:BLOW"──► gateway micro:bit ──USB──► laptop gateway page
       ──Ably channel "exhibit:leaves"──► phone page → leaves blow
phone "in place" ──Ably presence──► laptop ──USB──► gateway ──radio "leaves:PLACED"──► leaves micro:bit shows 🙂
```

---

## 1. Try it right away (no hardware, no Ably)

Upload the whole folder to the repo (keep the folder structure), then open on a phone:
`https://<username>.github.io/Base44-Test/projects/leaves/?demo`
Tap **My phone is in place**, then use the **BLOW** / **DONE** buttons at the bottom.

## 2. Ably account (once, ~5 minutes)

1. Sign up (free) at **ably.com** and create an app, e.g. `exhibit`.
2. Open the app → **API Keys**.
   - The existing **Root** key is the **laptop key**. Don't put it in any file.
3. Create a new key named `phones`:
   - Capabilities: **Publish**, **Subscribe**, **Presence** only.
   - Restrict it to channels: `exhibit:*` and `phone` (if the dashboard offers channel restrictions).
4. Copy the `phones` key into **`lib/config.js`** (replace `PASTE_PHONE_KEY_HERE`) and upload that file to GitHub.

What the phone key can do: listen to projects, say "phone in place", and send short messages to
micro:bits. It can't run motors in the leaves project — the motor runs only from the physical button.

## 3. micro:bits (MakeCode)

For each micro:bit: **makecode.microbit.org → New Project → JavaScript tab** (top), delete everything,
paste the file, **Download**, copy the .hex to the micro:bit. Switch back to Blocks afterwards if you like.

| micro:bit | File | Notes |
|---|---|---|
| Gateway (plugged into laptop) | `microbit/gateway-microbit.ts` | Shows ✓ when running |
| Leaves station | `microbit/leaves-station.ts` | Shows 💤 until a phone is in place, then 🙂 |

Both use radio group **77**. Every student project must use group 77 too.

### Wiring the leaves station

**Button** (P1 is a big ring — croc clips are fine):
- one leg → **P1**
- other leg → **GND**

**Motor** — never wire the motor straight to the micro:bit; it needs a driver.
P8 is a small pin, so you need an **edge-connector breakout board**.

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

1. Plug in the gateway micro:bit.
2. Open `https://<username>.github.io/Base44-Test/gateway/` in **Chrome or Edge**.
3. Paste the **Root** key → **Connect** (saved in this browser only).
4. **Connect micro:bit** → pick the micro:bit. Status should say **Connected — gateway ready**.
   Next time the page reconnects by itself.
5. Close MakeCode tabs — only one program can use the USB connection at a time.

The **Test without hardware** box lets you pretend a micro:bit sent `leaves:BLOW`, to check a phone reacts.

## 5. Phone / QR code

QR code → `https://<username>.github.io/Base44-Test/projects/leaves/`

Options you can add to the address: `?from=right` (or `top`, `bottom`) — the side the fan blows from (default `left`).

## Network check

`https://<username>.github.io/Base44-Test/test/` — run on school Wi-Fi before the exhibition.
