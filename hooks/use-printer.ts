import { Buffer } from 'buffer';
import { useCallback, useState } from 'react';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { BleError, BleManager, Device } from 'react-native-ble-plx';

const manager = new BleManager();

export interface PrinterDevice {
    id: string;
    name: string | null;
    rssi: number | null;
}

export function usePrinter() {
    const [isScanning, setIsScanning] = useState(false);
    const [devices, setDevices] = useState<PrinterDevice[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Request permissions (Android)
    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            ]);

            return (
                granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED &&
                granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
            );
        }
        return true;
    };

    // Start scanning
    const startScan = useCallback(async () => {
        const hasPerms = await requestPermissions();
        if (!hasPerms) {
            Alert.alert('Permission Denied', 'Bluetooth permissions are required to finding printers.');
            return;
        }

        if (isScanning) return;

        setIsScanning(true);
        setDevices([]);

        manager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.warn('Scan error:', error);
                setIsScanning(false);
                return;
            }

            if (device && (device.name?.includes('Printer') || device.name?.includes('MTP') || device.name?.includes('RPP'))) {
                setDevices((prev) => {
                    if (prev.find((d) => d.id === device.id)) return prev;
                    return [...prev, { id: device.id, name: device.name, rssi: device.rssi }];
                });
            }
        });

        // Stop scan after 10 seconds
        setTimeout(() => {
            manager.stopDeviceScan();
            setIsScanning(false);
        }, 10000);
    }, [isScanning]);

    // Connect to device
    const connect = async (deviceId: string) => {
        setIsConnecting(true);
        try {
            manager.stopDeviceScan();
            setIsScanning(false);

            const device = await manager.connectToDevice(deviceId);
            setConnectedDevice(device);

            await device.discoverAllServicesAndCharacteristics();

            Alert.alert('Connected', `Connected to ${device.name || 'Printer'}`);
        } catch (error) {
            console.error('Connection error:', error);
            Alert.alert('Connection Failed', (error as BleError).message);
        } finally {
            setIsConnecting(false);
        }
    };

    // Disconnect
    const disconnect = async () => {
        if (connectedDevice) {
            await connectedDevice.cancelConnection();
            setConnectedDevice(null);
        }
    };

    // Write data to printer
    const print = async (data: Buffer) => {
        if (!connectedDevice) {
            throw new Error('No printer connected');
        }

        try {
            // Find the writable characteristic (common UUIDs for printers)
            // Usually Service 18f0 -> Characteristic 2af1 or similar custom ones
            // We will iterate over services/characteristics to find a writable one

            const services = await connectedDevice.services();
            let characteristicUuid = '';
            let serviceUuid = '';

            for (const service of services) {
                const chars = await service.characteristics();
                for (const char of chars) {
                    if (char.isWritableWithoutResponse || char.isWritableWithResponse) {
                        serviceUuid = service.uuid;
                        characteristicUuid = char.uuid;
                        break;
                    }
                }
                if (characteristicUuid) break;
            }

            if (!characteristicUuid) {
                throw new Error('No writable characteristic found');
            }

            // Write in chunks of 512 bytes (MTU limit safety)
            const chunkSize = 100; // Safer chunk size for BLE
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.subarray(i, i + chunkSize);
                const base64Info = chunk.toString('base64');
                await connectedDevice.writeCharacteristicWithoutResponseForService(
                    serviceUuid,
                    characteristicUuid,
                    base64Info
                );
            }

        } catch (error) {
            console.error('Print error:', error);
            throw error;
        }
    };

    return {
        isScanning,
        devices,
        connectedDevice,
        isConnecting,
        startScan,
        connect,
        disconnect,
        print,
    };
}
