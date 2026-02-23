import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { create } from 'zustand';

const STORAGE_KEY = 'billsnapr-last-printer';

async function requestAndroidPermissions() {
    if (Platform.OS === 'android') {
        // Android 12+ (API 31+)
        if (Platform.Version >= 31) {
            const result = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            ]);

            return (
                result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
                result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED
            );
        }
        // Android < 12
        else {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission',
                    message: 'Bluetooth scanning requires location access',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
    }
    return true;
}

async function saveLastPrinter(deviceId: string, deviceName: string | null) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ id: deviceId, name: deviceName }));
}

async function clearLastPrinter() {
    await AsyncStorage.removeItem(STORAGE_KEY);
}

async function getLastPrinter(): Promise<{ id: string; name: string | null } | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export interface PrinterDevice {
    id: string;
    name: string | null;
    address: string;
}

interface PrinterState {
    isScanning: boolean;
    isConnecting: boolean;
    connectedDevice: BluetoothDevice | null;
    scannedDevices: PrinterDevice[];
    lastDeviceName: string | null;

    startScan: () => Promise<void>;
    connect: (deviceId: string) => Promise<void>;
    disconnect: () => Promise<void>;
    print: (data: Buffer) => Promise<void>;
    tryAutoReconnect: () => Promise<void>;
}

export const usePrinterStore = create<PrinterState>((set, get) => ({
    isScanning: false,
    isConnecting: false,
    connectedDevice: null,
    scannedDevices: [],
    lastDeviceName: null,

    startScan: async () => {
        set({ isScanning: true, scannedDevices: [] });
        try {
            if (Platform.OS === 'android') {
                const granted = await requestAndroidPermissions();
                if (!granted) {
                    Alert.alert(
                        'Permission Required',
                        'Bluetooth scanning requires "Nearby Devices" permission. Please enable it in App Settings.',
                        [{ text: 'OK' }]
                    );
                    set({ isScanning: false });
                    return;
                }
            }

            const paired = await RNBluetoothClassic.getBondedDevices();
            const devices = paired.map(d => ({
                id: d.address,
                name: d.name,
                address: d.address
            }));
            set({ scannedDevices: devices });
        } catch (error: any) {
            console.error('Failed to get bonded devices', error);
            Alert.alert('Scan Failed', error?.message || 'Could not fetch paired devices.');
        } finally {
            set({ isScanning: false });
        }
    },

    connect: async (deviceId: string) => {
        set({ isConnecting: true });

        try {
            const { connectedDevice } = get();
            if (connectedDevice) {
                await connectedDevice.disconnect();
            }

            const connected = await RNBluetoothClassic.connectToDevice(deviceId);

            if (connected) {
                set({
                    connectedDevice: connected,
                    lastDeviceName: connected.name || null,
                });
                // Persist for auto-reconnect
                await saveLastPrinter(deviceId, connected.name || null);
                Alert.alert('Connected', `Connected to ${connected.name || 'Printer'}`);
            } else {
                throw new Error('Connection returned false');
            }
        } catch (error: any) {
            console.error('Connection failed:', error);

            let message = error?.message || 'Could not connect to printer.';

            if (message.includes('socket might closed') || message.includes('read failed')) {
                message = 'Could not communicate with device. Ensure it is a Printer, it is turned ON, and is within range.';
            } else if (message.includes('run out of time')) {
                message = 'Connection timed out. Please try again.';
            } else if (message.includes('Broken pipe')) {
                message = 'Connection disconnected unexpectedly.';
            }

            Alert.alert('Connection Failed', message);
            set({ connectedDevice: null });
        } finally {
            set({ isConnecting: false });
        }
    },

    disconnect: async () => {
        const { connectedDevice } = get();
        if (connectedDevice) {
            try {
                await connectedDevice.disconnect();
            } catch (e) {
                console.warn('Disconnect error', e);
            }
            set({ connectedDevice: null });
        }
        await clearLastPrinter();
    },

    print: async (data: Buffer) => {
        const { connectedDevice } = get();
        if (!connectedDevice) throw new Error('No printer connected');

        try {
            const isConnected = await connectedDevice.isConnected();
            if (!isConnected) {
                throw new Error('Device is no longer connected');
            }

            const base64Data = data.toString('base64');
            await connectedDevice.write(base64Data, 'base64');
        } catch (error) {
            console.error('Print Error:', error);
            throw error;
        }
    },

    // Silent auto-reconnect — no alerts on failure
    tryAutoReconnect: async () => {
        const { connectedDevice } = get();
        if (connectedDevice) return; // Already connected

        const saved = await getLastPrinter();
        if (!saved) return; // No saved printer

        set({ lastDeviceName: saved.name });

        try {
            if (Platform.OS === 'android') {
                const granted = await requestAndroidPermissions();
                if (!granted) return;
            }

            const connected = await RNBluetoothClassic.connectToDevice(saved.id);
            if (connected) {
                set({
                    connectedDevice: connected,
                    lastDeviceName: connected.name || null,
                });
            }
        } catch {
            // Silent failure — printer may be off or out of range
        }
    },
}));
