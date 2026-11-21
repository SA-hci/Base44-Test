# Exhibit hub — setup

This folder becomes one GitHub repository, `exhibit-hub`, published with GitHub Pages.
Later it will also hold the shared helper script and the gateway (laptop) page.

## 1. Put the network test online (about 5 minutes)

1. Sign in at github.com (create a free account if needed).
2. Top right **+** → **New repository**.
   - Name: `exhibit-hub`
   - Visibility: **Public** (GitHub Pages is free for public repos)
   - Click **Create repository**.
3. On the empty repo page, click **uploading an existing file**.
4. Drag the **`test`** folder from this `exhibit-hub` folder into the browser window
   (drag the folder itself, so the path stays `test/index.html`).
5. Click **Commit changes**.
6. Go to **Settings** → **Pages** (left menu).
   - Source: **Deploy from a branch**
   - Branch: **main**, folder **/ (root)** → **Save**.
7. Wait 1–2 minutes, then open:
   `https://<your-github-username>.github.io/<repo-name>/test/`
   (The repo is currently named **Base44 Test**, which GitHub turns into `Base44-Test`.
   Spaces become dashes; keep the capital letters.)

## 2. Run the test

Open the address above:

- on a phone on **school Wi-Fi**
- on the same phone on **mobile data**
- on the **laptop** that will run the gateway, on school Wi-Fi

The page shows a QR code of its own address at the bottom, so other phones can scan it.
Press **Copy results** on each device and paste the results into the chat.

### Reading the results

| Result | Meaning |
|---|---|
| ✓ This network works | Everything gets through. |
| ! Works, using the fallback | Live connections are blocked but Ably's fallback works. Fine for the exhibit. |
| ✕ Something is blocked | Read which line failed. If it's GitHub Pages or jsDelivr, the school filter blocks that site; use mobile data / hotspot or ask IT to allow it. |
| MQTT port 8884 (blue) | Comparison only. Expected to be blocked at school. |

## 3. Optional: full message test

After creating a free Ably account (ably.com → sign up → create an app → **API Keys**),
paste a key into **Test with an Ably key**. The page sends a message through Ably and back,
once with the live connection and once with the fallback.
The key isn't saved. Don't paste the full-access key on shared or public devices.
