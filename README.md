# KOMOTE — Kindle KOReader Wireless Remote

Turn pages and control your Kindle KOReader wirelessly from your phone, tablet, or Bluetooth controller!

---

## ⚡ DO I NEED TO HOST THIS ON NETLIFY OR GITHUB?
**NO! You do NOT need to upload or host this anywhere if you don't want to!**

### Why double-clicking `index.html` directly failed with "No directory found" & broke Bluetooth:
- When you open an `index.html` file directly from a file manager or ZIP folder, your browser loads it as a `file:///...` address.
- **Android & Chrome OS security strictly prohibit installing PWAs from `file://` addresses.** That's why tapping install created a broken shortcut and displayed "No directory found after splash screen".
- **Browsers also restrict the Gamepad API and Bluetooth permissions on `file://` URLs** for security reasons.

---

## 📱 The Best & Easiest Way: Install Native Offline PWA (0 Hosting Required)

1. Open your live KOMOTE URL on your phone's Chrome browser:
   (or scan the QR code displayed inside the app)
2. Tap the **Install App** button (or Chrome's 3 dots menu ⋮ → **Install app** / **Add to Home screen**).
3. Chrome builds and installs an official **Android WebAPK** right onto your phone home screen!
4. **100% OFFLINE**: The Service Worker caches everything in your phone memory. Once installed, it works completely offline without internet—as long as your phone and Kindle are on the same Wi-Fi router or phone hotspot!
5. **Full Bluetooth Support**: Running as a real installed PWA gives Chrome full native access to Bluetooth controllers (8BitDo, Joy-Cons, VR remotes, page turner rings) and Gamepad APIs!

---

## 💻 Option B: Run 100% Locally on PC / Mac / Termux (Offline Server)

If you extracted this ZIP and want to run it on your local network without using any cloud link:
- **Windows**: Double-click `start-windows.bat`. It starts a local server at `http://localhost:8080` and opens your browser.
- **Mac / Linux / Android Termux**: Run `bash start-mac-linux.sh` (or `python3 -m http.server 8080`).
- When accessed via `http://localhost:8080` (or your computer's local IP), Bluetooth and Gamepad APIs work 100%!

---

## ☁️ Option C: Free Cloud Hosting (Netlify / GitHub Pages)
If you want your own permanent personal URL to share with others:
1. **Netlify Drop**: Go to [https://app.netlify.com/drop](https://app.netlify.com/drop) and drag-and-drop this extracted folder. Instant HTTPS URL!
2. **GitHub Pages**: Upload this folder to a GitHub repo, turn on GitHub Pages in repo Settings.

---

## 📖 Kindle KOReader Setup (1-Time)
1. On your Kindle in KOReader:
   - Connect to the same Wi-Fi network (or your phone's personal hotspot).
   - Tap top menu → **Tools (wrench/screwdriver icon)** → **More tools** → **KOReader HTTP inspector**.
   - Tap **Start server** (default port: `8080`).
   - Note the IP address shown on your Kindle (e.g. `192.168.1.91`).
2. Open KOMOTE on your phone:
   - Tap the status pill at the top.
   - Enter your Kindle IP address (e.g. `192.168.1.91`).
   - Done! Tap the paddles to turn pages!

---

## 🎮 Bluetooth Gamepad & Remote Support
- Connect any Bluetooth gamepad (8BitDo Micro/Zero 2, Joy-Con, VR remote, TikTok/Kindle ring clicker, or keyboard) to your phone.
- Tap **🎮 Controller** in KOMOTE.
- All standard buttons (D-Pad, Analog Stick, Arrows, Volume keys, Space, Enter, PageDown/Up) are mapped by default!
- You can tap **Map Button** or choose any button directly from the **Quick Pick** dropdown.
