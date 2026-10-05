# Deploying KOMOTE to GitHub Pages

This guide walks you through deploying the complete KOMOTE React application to **GitHub Pages** with free automatic hosting, full Progressive Web App (PWA) offline support, Bluetooth gamepad bridge, and Kindle KOReader wireless controls.

---

## 🚀 Method 1: Automatic 1-Click Deployment via GitHub Actions (Recommended)

Everything has already been pre-configured for you in `.github/workflows/deploy.yml`. When you push this code to GitHub, GitHub Pages will automatically configure your repository's base path, build, and publish your application.

### Step 1: Push Your Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .
git commit -m "Deploy KOMOTE to GitHub Pages"

# Link your local repo to your GitHub repository:
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<REPO_NAME>.git
git branch -M main
git push -u origin main
```

---

### Step 2: Enable GitHub Pages in your Repository Settings

1. Open your repository on **GitHub.com**.
2. Click the **Settings** tab (gear icon at the top of the repo).
3. In the left sidebar, click **Pages** (under the "Code and automation" section).
4. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions** from the dropdown menu (instead of "Deploy from a branch").
5. That's it! The workflow will trigger immediately.

---

### Step 3: View Your Live App

1. Go to the **Actions** tab in your GitHub repository to watch the build (typically takes ~35 seconds).
2. Once complete, your live site URL will be displayed in the Actions run summary and under **Settings → Pages**:
   ```
   https://<YOUR_GITHUB_USERNAME>.github.io/<REPO_NAME>/
   ```
3. Open this URL on your phone, tablet, or computer browser!

---

## ⚠️ Blank Page Troubleshooting (Important!)

If your GitHub Pages deployment shows a blank page, here is why and how it is fixed:

### 1. The Trailing Slash (`/`) Requirement
When visiting your site on GitHub Pages, the URL **must end with a slash**:
- ✅ Correct: `https://<username>.github.io/<repo-name>/`
- ❌ Without slash: `https://<username>.github.io/<repo-name>` (browsers will look for scripts at `https://<username>.github.io/assets/...` instead of inside your repository folder!)
*Note: KOMOTE now includes an automated redirect script in `index.html` that automatically appends the trailing slash for you.*

### 2. Clear Old Browser / Service Worker Cache
If you opened the URL before the build finished or on an earlier commit, your browser or Service Worker might have cached the previous 404 or empty response:
- **On Phone**: Open the link in a **Private / Incognito tab**, or tap the red **"Clear Cache & Reload"** recovery button on screen.
- **On Desktop**: Press **Ctrl + Shift + R** (Windows/Linux) or **Cmd + Shift + R** (Mac) to bypass cache.
- In Chrome DevTools: Open **Application → Service Workers** → click **Unregister** and clear Cache Storage.

### 3. Automatic Base Path in GitHub Actions
Our `.github/workflows/deploy.yml` runs `actions/configure-pages@v5` *before* the build step, automatically injecting the exact repository name (`/${{ steps.pages.outputs.base_path }}/`) so asset paths match your GitHub repository URL 100% of the time.

---

## 📦 Method 2: Manual Build & Deploy (CLI Alternative)

If you prefer building locally and deploying via the `gh-pages` branch:

```bash
# 1. Install dependencies
npm install

# 2. Build the production React app
npm run build

# 3. Deploy the dist folder to the gh-pages branch
npx gh-pages -d dist
```

Then in GitHub **Settings → Pages**, set the source to **Deploy from a branch** and select the `gh-pages` branch with folder `/ (root)`.

---

## 📱 How to Use KOMOTE on Your Phone / Tablet

1. **Connect to Same Wi-Fi**:
   - Ensure your phone/tablet and your Kindle are connected to the same Wi-Fi network (or connect your Kindle to your phone's personal mobile hotspot).

2. **Start KOReader HTTP Server on your Kindle**:
   - In KOReader, tap the top menu → **Tools (wrench icon)** → **More tools** → **KOReader HTTP inspector**.
   - Tap **Start server**.
   - Note the IP address and port shown (e.g., `192.168.1.91:8080` or `172.20.10.x:8080`).

3. **Open KOMOTE**:
   - Open your GitHub Pages URL on your phone (`https://<username>.github.io/<repo-name>/`).
   - Tap the **Settings (gear)** icon.
   - Enter your Kindle's IP and port into the **Kindle KOReader IP & Port** field.
   - Tap **⚡ Ping** to test connectivity!

4. **Install as a Home Screen App (PWA)**:
   - **iOS (Safari)**: Tap the **Share** button at the bottom → tap **Add to Home Screen**.
   - **Android (Chrome)**: Tap the 3 dots menu → tap **Add to Home screen** (or **Install app**).
   - Once added, KOMOTE launches in full-screen immersion without browser address bars!

---

## 🔒 Mixed Content: Allowing Local Kindle HTTP on HTTPS

When hosted on GitHub Pages (`https://`), modern browsers (especially Google Chrome) may block requests from a secure HTTPS website to a local insecure HTTP address on your LAN (`http://192.168.x.x:8080`).

KOMOTE has built-in mechanisms to handle this:

1. **Built-in Fallback Transports**:
   - In KOMOTE Settings, try switching the **Network Dispatch Protocol**:
     - **Hidden Iframe**: Bypasses mixed-content blocks by submitting navigation targets into a hidden sandboxed frame.
     - **Image Beacon GET**: Uses image request carriers which bypass standard CORS preflights.
     - **Opaque Fetch (no-cors)**: Standard fetch mode.

2. **Allow Insecure Content on Chrome (If blocked)**:
   - On Chrome (Android / Desktop), tap the **site settings icon** (tune/lock icon next to the URL in the address bar).
   - Tap **Site settings** → Scroll down to **Insecure content** → Change from "Block" to **Allow**.
   - Reload the page. All Kindle commands will now flow directly over your local Wi-Fi without any blocks!

---

## 🛠 Included Build Files Summary

- `.github/workflows/deploy.yml` — Automated GitHub Actions workflow with dynamic `actions/configure-pages@v5` base detection.
- `public/.nojekyll` — Bypasses Jekyll processing so Vite asset bundles load cleanly.
- `public/404.html` — Clean SPA fallback for GitHub Pages routing.
- `vite.config.ts` — Relative base configuration (`process.env.VITE_BASE_PATH || './'`) ensuring all assets and PWA manifests work on any GitHub Pages subfolder path.
