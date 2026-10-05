# KOMOTE — Kindle KOReader Wireless Remote

**KOMOTE** is a lightweight, tactile wireless page-turner and controller bridge for e-readers running **KOReader** (including Amazon Kindle Paperwhite, Oasis, Basic, Voyage, and Scribe).

Hosted live at **[komoteapp.github.io](https://komoteapp.github.io)**, KOMOTE turns your phone, tablet, or spare device into a responsive, zero-latency remote control that communicates directly with your Kindle over local Wi-Fi.

---

## 📖 The Problem KOMOTE Solves

Reading on an e-reader propped up on a stand, reading in bed during cold winter nights with hands tucked warmly under the blanket, or reading while on a treadmill often requires constantly reaching out to tap the screen. While some modern e-readers have proprietary accessories, Kindles do not natively support commercial Bluetooth page-turner rings, camera clickers, or gamepads.

**KOMOTE bridges that gap.** By running as a high-performance, offline-first Progressive Web App (PWA) on your phone or tablet, KOMOTE connects to any Bluetooth clicker, ring, or gamepad, and instantly translates those physical clicks into local network commands sent directly to KOReader's built-in HTTP inspector server over Wi-Fi. Your Kindle turns pages effortlessly without physical contact.

---

## ⚡ Key Highlights & Architecture

### 1. Dual Tactile Paddle Deck
- **Oversized Thumb Paddles**: Full-bleed left/right or stacked paddles designed for one-handed thumb navigation without looking at the screen.
- **Acoustic & Haptic Feedback**: Optional mechanical switch click sound (Web Audio synthesis) and haptic vibration feedback for every page turn.
- **Dynamic Layouts**: Instant switching between 50/50 split columns and 70/30 primary-reach thumb zones, plus instant left/right paddle swapping for left-handed readers.

### 2. Universal Bluetooth & Gamepad Bridge
- **Bluetooth Ring Page Turners & Selfie Remotes**: Seamlessly maps volume rockers, shutter buttons, and TikTok scrolling rings.
- **Game Controllers & Gamepads**: Native Gamepad API integration supporting 8BitDo controllers, Joy-Cons, Xbox/PlayStation controllers, and VR air mice.
- **Web Bluetooth LE Direct Pairing**: Direct GATT connection inside Chrome on Android that communicates straight to KOMOTE.
- **Interactive Learn Mode**: Tap "Map Button" in the Controller menu, press any button on your remote, and KOMOTE binds it instantly.
- **Android Accessibility Integration**: Built-in Key Mapper profile generator for system-level background key handling across all apps.
- **Persistent Key Mappings**: Clean, device-saved configuration stored in local storage for instant reconnects.

### 3. Screen Awake with Smart Battery-Saving OLED Zen Mode
- **Keep Screen Awake (WakeLock)**: Holds the display awake so your phone never enters OS system sleep while reading.
- **Customizable Inactivity Timeout**: Automatically switches to OLED Zen Mode after a period of inactivity (default 30 seconds, customizable via slider and presets, or set to "Never").
- **OLED Zen Mode**: Fullscreen pure black screen (`#000000`) that turns OLED pixels completely off to save battery. Tapping left or right advances/rewinds pages with haptic feedback, while swiping up smoothly exits back to the full controller.
- **Bluetooth Remote Harmony**: Bluetooth clickers, rings, and gamepads continue turning pages with instant feedback inside Zen Mode.

### 4. Full KOReader Control Suite
- **Font Sizing**: Instant `Font +` and `Font -` adjustments on the fly.
- **Frontlight & Warmth**: Granular control over frontlight intensity and warm amber light.
- **Ghosting Refresh**: 1-tap E-Ink screen flash (waveform inversion) to clear ghosting artifacts.
- **Night Mode Toggle**: Quick invert for late-night dark reading.
- **Chapter & Navigation**: Jump between chapters, open Table of Contents, or toggle bookmarks.
- **Custom Event Catalog**: Quick-add presets for screen rotation, sleep mode, taking screenshots, and custom Lua event endpoints.

### 5. Crash-Proof Safe Beacon Transport
- **Resilient Dispatch**: KOReader's lightweight HTTP inspector runs a single-threaded LuaSocket server that can drop connections if flooded with preflight CORS `OPTIONS` requests.
- **Zero Preflights**: KOMOTE utilizes an in-memory image beacon engine that dispatches clean, serial HTTP `GET` requests with automatic queue throttling, ensuring 100% reliability without crashing KOReader.

### 6. 100% Offline & Private
- **Zero External Servers**: Communication happens strictly between your browser and your Kindle over your local Wi-Fi router or phone mobile hotspot.
- **No Analytics or Telemetry**: No cloud tracking, user tracking, or third-party dependencies at runtime.
- **Service Worker Caching**: All application assets are cached locally for offline execution.

---

## 📱 Hardware & Software Compatibility

| Device | Compatibility |
| :--- | :--- |
| **E-Reader Hardware** | Any Kindle device running KOReader (Paperwhite 1-5, Oasis 1-3, Basic, Voyage, Scribe) |
| **Software Platform** | KOReader (v2020.03+) with HTTP Inspector enabled (`Start server` on port 8080) |
| **Client Devices** | Android phones/tablets, iPhone, iPad, Mac, Windows, Linux, Chromebooks |
| **Supported Remotes** | Bluetooth ring page-turners, camera shutter clickers, presentation remotes, 8BitDo Micro/Zero 2, Nintendo Joy-Cons, Xbox/PS gamepads |

---

## 🚀 Quick Setup & Hosting Options

### Option 1: GitHub Pages (Recommended Free Hosting)
1. Push all files from this ZIP to a GitHub repository.
2. In your repo: Go to **Settings** → **Pages** → Source: **Deploy from a branch** (`main` / `/root`) → **Save**.
3. Open your GitHub Pages link (`https://<username>.github.io/<repo>/`) on your phone or tablet.
4. **Chrome HTTPS Note**: Since GitHub Pages uses HTTPS, Chrome may block requests to local HTTP IPs by default. To enable:
   - Tap the 🔒 or tune icon in the Chrome URL bar.
   - Tap **Site settings**.
   - Change **Insecure content** to **Allow**.
   - Your page turns will now connect instantly over local Wi-Fi!

### Option 2: 1-Click Local Server (Windows & Mac/Linux)
- **Windows**: Double-click `start-windows.bat` to launch on `http://localhost:8088`.
- **Mac / Linux**: Run `./start-mac-linux.sh` in Terminal to launch on `http://localhost:8088`.
- This avoids all browser mixed-content restrictions and provides 100% full Web Bluetooth & Gamepad support.

### Option 3: Direct File (Double-Click index.html)
- Double-click `index.html` directly in Chrome, Firefox, or Safari.

### Option 4: Install to Phone Home Screen (PWA / WebAPK)
- In Chrome on Android, tap the 3-dot menu (⋮) → **Install app** or **Add to Home screen**.
- Runs in standalone fullscreen mode like a native Android app!

---

## 📖 Kindle KOReader Wi-Fi Setup
1. On your Kindle running KOReader, connect to the same Wi-Fi router or phone mobile hotspot.
2. Open KOReader's top menu → **Tools (cog / wrench)** → **More tools** → **HTTP Inspector**.
3. Tap **Start server** (KOReader will display: `Server running on http://192.168.x.x:8080`).
4. In KOMOTE, enter this IP in the Settings menu (default is `192.168.1.91:8080`) and tap **Ping** or turn a page!

---

## 🌐 Project Access

KOMOTE is accessible on any modern web browser at:
**[https://komoteapp.github.io](https://komoteapp.github.io)**
