import { IconSymbol } from '@/components/ui/icon-symbol';
import { EscPosBuilder } from '@/lib/printer/esc-pos';
import { usePrinterStore } from '@/store/printer';
import { Stack } from 'expo-router';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';

export default function PrinterSettingsScreen() {
    const {
        isScanning,
        scannedDevices,
        connectedDevice,
        startScan,
        connect,
        disconnect,
        print,
        isConnecting
    } = usePrinterStore();

    const handleTestPrint = async () => {
        if (!connectedDevice) return;
        try {
            const buffer = new EscPosBuilder()
                .initialize()
                .align('center')
                .textLine('BillSnapr Test Print')
                .textLine('--------------------------------')
                .align('left')
                .textLine('Connection Successful!')
                .textLine('Printer is ready.')
                .feed(2)
                .cut()
                .getBuffer();

            await print(buffer);
        } catch (error) {
            // Error handled in store
        }
    };

    return (
        <View className="flex-1 bg-surface">
            <Stack.Screen options={{ title: 'Printer Settings' }} />

            {/* Connected Device Status */}
            <View className="p-4 bg-white border-b border-gray-100">
                <Text className="text-text-secondary text-sm mb-2">Status</Text>
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                        <View className={`w-3 h-3 rounded-full ${connectedDevice ? 'bg-green-500' : 'bg-red-500'}`} />
                        <Text className="text-lg font-bold text-text-primary">
                            {connectedDevice ? connectedDevice.name || 'Connected' : 'Not Connected'}
                        </Text>
                    </View>
                    {connectedDevice && (
                        <TouchableOpacity onPress={disconnect} className="bg-gray-100 px-3 py-1.5 rounded-lg">
                            <Text className="text-text-primary font-medium text-xs">Disconnect</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {connectedDevice && (
                    <TouchableOpacity
                        onPress={handleTestPrint}
                        className="mt-4 bg-primary-500 py-3 rounded-xl flex-row justify-center items-center"
                    >
                        <IconSymbol name="printer" size={20} color="white" />
                        <Text className="text-white font-bold ml-2">Test Print</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Device List */}
            <View className="flex-1">
                <View className="p-4 flex-row justify-between items-center bg-gray-50 border-b border-gray-200">
                    <Text className="font-semibold text-text-secondary uppercase text-xs">Available Devices</Text>
                    <TouchableOpacity
                        onPress={() => startScan()}
                        disabled={isScanning || isConnecting}
                    >
                        {isScanning ? (
                            <ActivityIndicator size="small" color="#00936E" />
                        ) : (
                            <Text className="text-primary-600 font-bold text-sm">Scan</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={scannedDevices}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16 }}
                    ListEmptyComponent={
                        <View className="items-center py-10">
                            <Text className="text-text-muted">No printers found.</Text>
                            <Text className="text-text-muted text-xs mt-1">Make sure device is on and nearby.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => connect(item.id)}
                            disabled={isConnecting}
                            className="flex-row items-center justify-between bg-white p-4 mb-2 rounded-xl border border-gray-100 shadow-sm"
                        >
                            <View>
                                <Text className="font-bold text-text-primary">{item.name || 'Unknown Device'}</Text>
                                <Text className="text-xs text-text-muted mt-0.5">{item.id}</Text>
                            </View>
                            {isConnecting && connectedDevice?.id === item.id ? (
                                <ActivityIndicator size="small" color="#00936E" />
                            ) : (
                                <IconSymbol name="chevron.right" size={16} color="#94A3B8" />
                            )}
                        </TouchableOpacity>
                    )}
                />
            </View>
        </View>
    );
}
