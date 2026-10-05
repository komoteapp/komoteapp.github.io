import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Download,
  Smartphone,
  Sparkles,
  Layers,
  Code2,
  Volume2,
} from 'lucide-react';
import { DeviceProfile } from '../types/koreader';

interface SetupAndTroubleshootingProps {
  activeProfile: DeviceProfile;
  darkTheme: boolean;
  onDispatchCommand: (endpoint: string, label: string) => void;
}

export const SetupAndTroubleshooting: React.FC<SetupAndTroubleshootingProps> = ({
  activeProfile,
  darkTheme,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showAndroidSource, setShowAndroidSource] = useState(false);

  const forwardUrl = `http://${activeProfile.ip}:${activeProfile.port}/koreader/event/GotoViewRel/1`;
  const backwardUrl = `http://${activeProfile.ip}:${activeProfile.port}/koreader/event/GotoViewRel/-1`;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Pre-configured JSON for HTTP Shortcuts Android app import
  const httpShortcutsJson = JSON.stringify(
    {
      version: 4,
      categories: [
        {
          id: "koreader-cat",
          name: "Kindle KOReader Remote",
          shortcuts: [
            {
              id: "koreader-next",
              name: "Kindle Next Page",
              url: forwardUrl,
              method: "GET",
              executionType: "APP",
              icon: "arrow_forward",
            },
            {
              id: "koreader-prev",
              name: "Kindle Prev Page",
              url: backwardUrl,
              method: "GET",
              executionType: "APP",
              icon: "arrow_back",
            },
            {
              id: "koreader-refresh",
              name: "Kindle Flash Screen",
              url: `http://${activeProfile.ip}:${activeProfile.port}/koreader/event/FullRefresh`,
              method: "GET",
              executionType: "APP",
              icon: "refresh",
            },
          ],
        },
      ],
    },
    null,
    2
  );

  const standaloneHtmlCode = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
  <title>Kindle Remote</title>
  <style>
    body{background:#121316;color:#fff;font-family:system-ui;margin:0;padding:16px;min-height:100vh;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box}
    .btn-prev{width:100%;height:100px;background:#202025;border:1px solid #333;color:#fff;font-size:20px;font-weight:bold;border-radius:16px;margin-bottom:12px;cursor:pointer}
    .btn-next{width:100%;height:260px;background:#D9532F;border:none;color:#fff;font-size:34px;font-weight:bold;border-radius:20px;cursor:pointer;box-shadow:0 4px 16px rgba(217,83,47,.4)}
    .status{text-align:center;font-size:12px;color:#888;font-family:monospace;margin-bottom:8px}
  </style>
</head>
<body>
  <div class="status">Kindle: ${activeProfile.ip}:${activeProfile.port}</div>
  <button class="btn-prev" onclick="send('/koreader/event/GotoViewRel/-1')">Previous Page (-1)</button>
  <button class="btn-next" onclick="send('/koreader/event/GotoViewRel/1')">Next Page (+1)</button>
  <script>
    function send(path) {
      if(navigator.vibrate) navigator.vibrate(15);
      new Image().src = 'http://${activeProfile.ip}:${activeProfile.port}' + path + '?t=' + Date.now();
    }
  </script>
</body>
</html>`;

  const androidKotlinCode = `package com.koreturn.remote

import android.os.Bundle
import android.view.KeyEvent
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.IOException
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {
    private val client = OkHttpClient.Builder()
        .connectTimeout(2, TimeUnit.SECONDS)
        .build()

    private val kindleHost = "${activeProfile.ip}:${activeProfile.port}"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        findViewById<Button>(R.id.btnNext).setOnClickListener {
            sendKoreaderEvent("/koreader/event/GotoViewRel/1", "Next Page")
        }
        findViewById<Button>(R.id.btnPrev).setOnClickListener {
            sendKoreaderEvent("/koreader/event/GotoViewRel/-1", "Previous Page")
        }
    }

    // Turn pages using phone physical volume keys!
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        return when (keyCode) {
            KeyEvent.KEYCODE_VOLUME_DOWN -> {
                sendKoreaderEvent("/koreader/event/GotoViewRel/1", "Next Page")
                true
            }
            KeyEvent.KEYCODE_VOLUME_UP -> {
                sendKoreaderEvent("/koreader/event/GotoViewRel/-1", "Previous Page")
                true
            }
            else -> super.onKeyDown(keyCode, event)
        }
    }

    private fun sendKoreaderEvent(endpoint: String, label: String) {
        val request = Request.Builder()
            .url("http://$kindleHost$endpoint")
            .build()

        Thread {
            try {
                client.newCall(request).execute().use { response ->
                    runOnUiThread {
                        Toast.makeText(this, "$label sent!", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: IOException) {
                runOnUiThread {
                    Toast.makeText(this, "Failed: \${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }.start()
    }
}`;

  return (
    <div className="space-y-6">
      {/* 1. WHY RUNNING LOCALLY ON DEVICE FIXES THE GOOGLE SERVER BLOCK */}
      <div
        className={`rounded-2xl border-2 p-5 sm:p-6 ${
          darkTheme
            ? 'bg-[#1C1816] border-[#D9532F] text-[#F4F3EF]'
            : 'bg-[#FFF9F5] border-[#D9532F] text-[#18181B]'
        }`}
      >
        <div className="flex items-start gap-3 pb-4 mb-4 border-b border-current/15">
          <Smartphone className="w-6 h-6 text-[#D9532F] shrink-0 mt-0.5" />
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-balance">
              Running on Your Phone Locally vs. Google Cloud Servers
            </h2>
            <p className="text-sm opacity-85 mt-1 leading-relaxed">
              <strong>You are completely right:</strong> because this web page is being served from Google Cloud servers (<code className="font-mono">aistudio.google.com</code>), your mobile browser blocks it from communicating with your home Wi-Fi device (<code className="font-mono">192.168.1.91</code>).
              <br /><br />
              When you run it <strong>directly on your Android device</strong>, there are no cloud servers in between, so commands reach your Kindle instantly!
            </p>
          </div>
        </div>

        {/* 3 WAYS TO RUN ON DEVICE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* SOLUTION 1: HTTP SHORTCUTS APP */}
          <div className="p-4 rounded-xl border border-current/15 bg-current/5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="font-bold text-sm text-[#D9532F] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Option 1: Use "HTTP Shortcuts" App (Best & Easiest)</span>
              </div>
              <p className="text-xs opacity-85 mt-1.5 leading-relaxed">
                <strong>HTTP Shortcuts</strong> is a free, open-source Android app on the Google Play Store specifically made to trigger local HTTP commands without any web browsers or cloud servers.
              </p>
              <ul className="text-xs opacity-80 mt-2 space-y-1 list-disc list-inside">
                <li>Creates <strong>Home Screen Widgets</strong> or <strong>Floating Buttons</strong>.</li>
                <li>Allows using your phone’s <strong>Physical Volume Buttons</strong> to turn pages while reading!</li>
                <li>Sends native HTTP requests directly on Wi-Fi with zero restrictions.</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-current/10 space-y-2">
              <a
                href="https://play.google.com/store/apps/details?id=ch.rmy.android.http_shortcuts"
                target="_blank"
                rel="noreferrer"
                className="w-full min-h-[40px] px-3.5 py-2 rounded-lg bg-[#D9532F] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#C04524] transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Install HTTP Shortcuts (Google Play)</span>
              </a>

              <button
                onClick={() => handleCopy(httpShortcutsJson, 'shortcuts')}
                className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-current/20 hover:bg-current/10 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'shortcuts' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'shortcuts' ? 'Configuration Copied!' : 'Copy 1-Click Import Configuration'}</span>
              </button>
            </div>
          </div>

          {/* SOLUTION 2: ON-DEVICE STANDALONE HTML FILE */}
          <div className="p-4 rounded-xl border border-current/15 bg-current/5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="font-bold text-sm text-[#D9532F] flex items-center gap-1.5">
                <Layers className="w-4 h-4 shrink-0" />
                <span>Option 2: Standalone Local HTML (No Cloud)</span>
              </div>
              <p className="text-xs opacity-85 mt-1.5 leading-relaxed">
                If the download button didn’t work inside AI Studio’s preview, open the direct link below in a fresh Chrome tab, or copy the self-contained HTML code directly:
              </p>
              <div className="mt-2 p-2.5 rounded-lg bg-black/20 font-mono text-[11px] opacity-80 break-all">
                /koreturn-standalone.html
              </div>
            </div>

            <div className="pt-2 border-t border-current/10 space-y-2">
              <a
                href="/koreturn-standalone.html"
                target="_blank"
                rel="noreferrer"
                className="w-full min-h-[40px] px-3.5 py-2 rounded-lg bg-[#D9532F] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#C04524] transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Local HTML in New Browser Tab</span>
              </a>

              <button
                onClick={() => handleCopy(standaloneHtmlCode, 'rawhtml')}
                className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-current/20 hover:bg-current/10 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'rawhtml' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'rawhtml' ? 'HTML Code Copied!' : 'Copy Raw Standalone HTML Code'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. OPTION 3: FULL ANDROID STUDIO APK SOURCE CODE */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 ${
          darkTheme
            ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]'
            : 'bg-white border-[#DCD9CE] text-[#18181B]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-current/10">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-[#D9532F]" />
            <div>
              <h3 className="font-display text-base font-semibold">
                Option 3: Compile Your Own Android APK (Kotlin Source)
              </h3>
              <p className="text-xs opacity-70">
                Complete Android Studio project with volume key page turning and OkHttpClient.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAndroidSource(!showAndroidSource)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              darkTheme
                ? 'border-[#323238] hover:bg-[#242429]'
                : 'border-[#DCD9CE] hover:bg-[#EAE8E1]'
            }`}
          >
            {showAndroidSource ? 'Hide Android Code' : 'View Android Studio Code'}
          </button>
        </div>

        {showAndroidSource && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono opacity-70">
                MainActivity.kt (Pre-configured for {activeProfile.ip}:{activeProfile.port})
              </span>
              <button
                onClick={() => handleCopy(androidKotlinCode, 'kotlin')}
                className="min-h-[34px] px-3 py-1 rounded-lg bg-[#D9532F] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'kotlin' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'kotlin' ? 'Code Copied' : 'Copy Kotlin Code'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-[#121316] text-[#E4E4E7] font-mono text-xs overflow-x-auto leading-relaxed border border-[#27272A]">
              {androidKotlinCode}
            </pre>
          </div>
        )}
      </div>

      {/* 3. STEP-BY-STEP GUIDE FOR HTTP SHORTCUTS (RECOMMENDED) */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 ${
          darkTheme
            ? 'bg-[#18181B] border-[#27272A] text-[#F4F3EF]'
            : 'bg-white border-[#DCD9CE] text-[#18181B]'
        }`}
      >
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-current/10">
          <Volume2 className="w-5 h-5 text-[#D9532F]" />
          <h3 className="font-display text-base font-semibold">
            How to Set Up Physical Volume Button Page Turning in 60 Seconds
          </h3>
        </div>

        <ol className="text-xs opacity-85 space-y-2 list-decimal list-inside leading-relaxed">
          <li>
            Install the free app <strong>HTTP Shortcuts</strong> from the Google Play Store.
          </li>
          <li>
            Tap the <strong>+</strong> button to create a new shortcut.
          </li>
          <li>
            Set <strong>Shortcut Name</strong> to <code>Kindle Next</code>.
          </li>
          <li>
            Set <strong>URL</strong> to: <code className="font-mono text-[#D9532F] font-bold">{forwardUrl}</code>.
          </li>
          <li>
            Set <strong>Method</strong> to <code>GET</code> and tap the checkmark to save.
          </li>
          <li>
            Create a second shortcut named <code>Kindle Prev</code> with URL: <code className="font-mono text-[#D9532F] font-bold">{backwardUrl}</code>.
          </li>
          <li>
            <strong>Add to Home Screen:</strong> Long-press your phone’s home screen → add the <strong>HTTP Shortcuts widget</strong> → select <em>Kindle Next</em>!
          </li>
        </ol>
      </div>
    </div>
  );
};
