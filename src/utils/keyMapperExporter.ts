/**
 * Android Accessibility & Key Mapper Configuration Exporter
 * 
 * Generates an automated, pre-configured Key Mapper profile JSON.
 * Key Mapper (available on Google Play & F-Droid) is the leading open-source Android app
 * that utilizes Android's Accessibility Service (android.permission.BIND_ACCESSIBILITY_SERVICE)
 * to intercept hardware keys from specific Bluetooth controllers, consume them completely
 * (so other apps never receive them), and trigger HTTP requests to KOReader directly in the background.
 */

export function generateKeyMapperConfig(kindleHost: string): string {
  const cleanHost = kindleHost.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim() || '192.168.1.91:8080';
  const nextUrl = `http://${cleanHost}/koreader/event/GotoViewRel/1`;
  const prevUrl = `http://${cleanHost}/koreader/event/GotoViewRel/-1`;

  const config = {
    version: 2,
    appName: "Key Mapper",
    description: "KOMOTE Kindle KOReader Remote - Android Accessibility Service Background Bridge",
    keymaps: [
      {
        id: "komote-next-page",
        name: "KOMOTE: Kindle Next Page (+1)",
        enabled: true,
        consumeEvent: true, // Crucial: Consumes key so other apps (Reddit, Instagram, chats) NEVER see it!
        trigger: {
          clickType: "SHORT_PRESS",
          mode: "PARALLEL",
          keys: [
            {
              keyCode: 24, // Volume Up / Camera Shutter
              keyName: "VOLUME_UP",
              note: "Replace with your controller button in Key Mapper by tapping 'Record Trigger'"
            }
          ]
        },
        actions: [
          {
            type: "URL",
            url: nextUrl,
            description: "Turn Kindle Page Forward"
          }
        ]
      },
      {
        id: "komote-prev-page",
        name: "KOMOTE: Kindle Previous Page (-1)",
        enabled: true,
        consumeEvent: true,
        trigger: {
          clickType: "SHORT_PRESS",
          mode: "PARALLEL",
          keys: [
            {
              keyCode: 25, // Volume Down
              keyName: "VOLUME_DOWN",
              note: "Replace with your controller button in Key Mapper by tapping 'Record Trigger'"
            }
          ]
        },
        actions: [
          {
            type: "URL",
            url: prevUrl,
            description: "Turn Kindle Page Backward"
          }
        ]
      }
    ]
  };

  return JSON.stringify(config, null, 2);
}

export function downloadKeyMapperFile(kindleHost: string): void {
  const json = generateKeyMapperConfig(kindleHost);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `komote-android-accessibility-keymapper.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
