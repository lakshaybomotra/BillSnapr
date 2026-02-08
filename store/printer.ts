import { Buffer } from 'buffer';
import { Alert } from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { create } from 'zustand';

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

    startScan: () => Promise<void>; // This will now fetch paired devices
    connect: (deviceId: string) => Promise<void>;
    disconnect: () => Promise<void>;
    print: (data: Buffer) => Promise<void>;
}

export const usePrinterStore = create<PrinterState>((set, get) => ({
    isScanning: false,
    isConnecting: false,
    connectedDevice: null,
    scannedDevices: [],

    startScan: async () => {
        // Just fetch bonded devices for Classic Bluetooth (Users must pair in settings first)
        set({ isScanning: true, scannedDevices: [] });
        try {
            const paired = await RNBluetoothClassic.getBondedDevices();
            const devices = paired.map(d => ({
                id: d.address,
                name: d.name,
                address: d.address
            }));
            set({ scannedDevices: devices });
        } catch (error) {
            console.error('Failed to get bonded devices', error);
            Alert.alert('Error', 'Could not fetch paired devices. Make sure Bluetooth is on.');
        } finally {
            set({ isScanning: false });
        }
    },

    connect: async (deviceId: string) => {
        set({ isConnecting: true });

        try {
            // Check if already connected logic if needed, but simple connect is fine
            // Note: connectToDevice returns a wrapper, or we get it from bonding
            // In RNBluetoothClassic, we usually connect directly via the module or device instance

            // First disconnect any existing
            const { connectedDevice } = get();
            if (connectedDevice) {
                await connectedDevice.disconnect();
            }

            console.log(`Connecting to ${deviceId}...`);
            const connected = await RNBluetoothClassic.connectToDevice(deviceId);

            if (connected) {
                set({ connectedDevice: connected });
                Alert.alert('Connected', `Connected to ${connected.name || 'Printer'}`);
            } else {
                throw new Error('Connection returned false');
            }
        } catch (error: any) {
            console.error('Connection failed:', error);
            Alert.alert('Connection Failed', error?.message || 'Could not connect to printer.');
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
    },

    print: async (data: Buffer) => {
        const { connectedDevice } = get();
        if (!connectedDevice) throw new Error('No printer connected');

        try {
            const isConnected = await connectedDevice.isConnected();
            if (!isConnected) {
                // Try to reconnect?
                throw new Error('Device is no longer connected');
            }

            // RNBluetoothClassic expects base64 for binary
            // It has a write method: write(data: string, encoding?: 'utf-8' | 'base64' | 'hex')
            const base64Data = data.toString('base64');

            // Note: Check library version for exact signature.
            // Assuming standard v1.60+ signature: write(data, encoding)
            await connectedDevice.write(base64Data, 'base64');

            // Flow control isn't usually needed for Blocking Socket (SPP), but large images might need chunking.
            // The library often handles this, but let's assume it puts it on the socket stream using flush.

            console.log('Print data sent successfully');

        } catch (error) {
            console.error('Print Error:', error);
            throw error;
        }
    },
}));
