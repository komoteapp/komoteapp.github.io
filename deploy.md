# Controlling Your Kindle via KOMOTE (`komoteapp.github.io`)

Because KOMOTE is hosted securely over HTTPS (`https://komoteapp.github.io`), modern web browsers (Chrome, Edge, Safari) by default block background requests from an HTTPS website to private, plain HTTP devices on your local Wi-Fi (`http://192.168.1.91:8080/`).

KOMOTE now provides **two 100% working solutions** to bypass this restriction:

---

## ⚡ Method 1: Allow Insecure Content in Chrome (Recommended — 0 Popups, 100% Invisible)

This is the standard and cleanest way to use KOMOTE on your phone, tablet, or PC:

1. On your browser, while on `https://komoteapp.github.io/`, tap the **🎛️ Tune / Site Settings icon** (or lock icon) on the left of `komoteapp.github.io` in the address bar.
2. Tap **Site settings**.
3. Scroll down to find **Insecure content** (which defaults to *Block*).
4. Tap it and select **Allow**.
5. Return to KOMOTE and reload the page.

✅ **Result**: KOMOTE can now send silent background HTTP packets directly to your Kindle over Wi-Fi with 0 popups and instant ~15ms latency!

---

## 🚀 Method 2: Kindle Tab Bridge Mode (No Chrome Settings Needed!)

If you are on an iPhone/iPad (Safari), a browser that doesn't allow changing site permissions, or you prefer not to touch browser settings:

1. Open **Settings & Kindle Setup** in KOMOTE (gear icon).
2. Tap **Open Kindle in New Tab ↗** (or **HTTPS Unblock Guide 🔒** → **Open Bridge Tab**).
3. Under **Network Dispatch Protocol**, select **Kindle Tab Bridge (HTTPS Proof)**.
4. KOMOTE will route commands directly to that background Kindle tab via top-level window navigation.

✅ **Why this works**: Top-level window navigation is never blocked by browser Mixed Content policies, so commands reach your Kindle even on strict HTTPS origins!

---

## 📖 KOReader Wi-Fi Setup Checklist

1. **Same Wi-Fi Network**: Ensure your Kindle and your phone/computer are on the same Wi-Fi network (or connect your Kindle to your phone's personal mobile hotspot).
2. **Start Server in KOReader**:
   - Tap top menu → **Tools (wrench icon)** → **More tools** → **KOReader HTTP inspector**.
   - Tap **Start server**.
   - Confirm the port is `8080` and note your Kindle's IP (e.g. `192.168.1.91`).
3. **Set IP in KOMOTE**:
   - In KOMOTE Settings, enter `192.168.1.91:8080`.
   - Tap **⚡ Ping** or tap **Open Kindle in New Tab ↗** to verify!
