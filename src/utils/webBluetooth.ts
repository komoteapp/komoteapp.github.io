/**
 * Web Bluetooth API Manager for KOMOTE on Android
 * Connects directly to BLE controllers (rings, clickers, gamepads) via GATT.
 * 
 * Why Web Bluetooth is superior for Android multitasking:
 * 1. Direct GATT connection communicates directly with KOMOTE, bypassing Android's
 *    OS-level Keyboard/Input subsystem.
 * 2. Keystrokes do NOT leak into other foreground apps (won't scroll Reddit or type in chats).
 * 3. Works in background while kept alive by KOMOTE's background audio session.
 */

// Web Bluetooth interface definitions for environments where @types/web-bluetooth is not installed
interface BluetoothCharacteristicProperties {
  notify: boolean;
  indicate: boolean;
  read: boolean;
  write: boolean;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  uuid: string;
  properties: BluetoothCharacteristicProperties;
  value?: DataView;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTService {
  uuid: string;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface NavigatorWithBluetooth extends Navigator {
  bluetooth?: {
    requestDevice(options: {
      acceptAllDevices?: boolean;
      filters?: Array<Record<string, unknown>>;
      optionalServices?: Array<string | number>;
    }): Promise<BluetoothDevice>;
  };
}

export interface BLEDeviceState {
  connected: boolean;
  name: string | null;
  id: string | null;
  error?: string;
}

let connectedDevice: BluetoothDevice | null = null;
let onPageTurnCallback: ((direction: 'next' | 'prev') => void) | null = null;

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && Boolean((navigator as NavigatorWithBluetooth).bluetooth);
}

export async function connectWebBluetooth(
  onPageTurn: (direction: 'next' | 'prev') => void,
  onStateChange: (state: BLEDeviceState) => void
): Promise<string> {
  const navBluetooth = (navigator as NavigatorWithBluetooth).bluetooth;
  if (!navBluetooth) {
    throw new Error('Web Bluetooth is not supported on this browser. Please use Chrome on Android.');
  }

  onPageTurnCallback = onPageTurn;

  try {
    // Request Bluetooth LE device
    const device = await navBluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        'generic_access',
        'battery_service',
        0x1812, // Human Interface Device GATT
        0xffe0, // Common TikTok ring / selfie clicker GATT service
        0xfff0,
        0xfee0,
        0x1800,
        0x1801,
      ],
    });

    connectedDevice = device;

    device.addEventListener('gattserverdisconnected', () => {
      onStateChange({ connected: false, name: null, id: null });
    });

    const server = await device.gatt?.connect();
    if (!server) {
      throw new Error('Could not open GATT connection to Bluetooth device.');
    }

    const deviceName = device.name || 'Bluetooth Controller';

    onStateChange({
      connected: true,
      name: deviceName,
      id: device.id,
    });

    // Enumerate primary services to find notify/indicate characteristics
    try {
      const services = await server.getPrimaryServices();
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties.notify || char.properties.indicate) {
              await char.startNotifications();
              char.addEventListener('characteristicvaluechanged', (e: Event) => {
                const target = e.target as unknown as BluetoothRemoteGATTCharacteristic;
                const value = target.value;
                if (value && value.byteLength > 0) {
                  const b = value.getUint8(0);
                  // Differentiate directions if multi-button ring
                  if (b === 2 || b === 0x02 || b === 0x10 || b === 0x20) {
                    onPageTurnCallback?.('prev');
                  } else {
                    onPageTurnCallback?.('next');
                  }
                }
              });
            }
          }
        } catch {
          // Characteristics might be restricted by OS on standard HID services
        }
      }
    } catch {
      // Primary services scan finished
    }

    return deviceName;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Bluetooth pairing was cancelled or failed.';
    onStateChange({ connected: false, name: null, id: null, error: errorMsg });
    throw new Error(errorMsg);
  }
}

export function disconnectWebBluetooth(): void {
  if (connectedDevice && connectedDevice.gatt?.connected) {
    connectedDevice.gatt.disconnect();
  }
  connectedDevice = null;
}
