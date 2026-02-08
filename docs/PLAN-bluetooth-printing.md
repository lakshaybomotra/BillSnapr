# PLAN-bluetooth-printing

> **Goal:** Enable users to scan, connect, and print receipts to standard ESC/POS Bluetooth Thermal Printers.

## Goal Description
We need to communicate directly with thermal printers using the Bluetooth Low Energy (BLE) protocol. We will send raw byte commands (ESC/POS) to format text, align content, and trigger paper cuts.

## User Review Required
> [!IMPORTANT]
> **Native Build Required**: Bluetooth logic does NOT work in the standard "Expo Go" app. You must build a **Development Client** (`npx expo run:android`) to test this.
> **Permissions**: This adds `BLUETOOTH_CONNECT`, `BLUETOOTH_SCAN`, and `ACCESS_FINE_LOCATION` permissions to the app.

## Proposed Changes

### Configuration
#### [MODIFY] [app.json](file:///c:/Development/My_Personal/BillSnapr/app.json)
- Add `@config-plugins/react-native-ble-plx` plugin.
- Configure iOS usage descriptions (NSBluetoothAlwaysUsageDescription).
- Configure Android permissions.

### Logic Layer
#### [NEW] [lib/printer/esc-pos.ts](file:///c:/Development/My_Personal/BillSnapr/lib/printer/esc-pos.ts)
- `EscPosBuilder` class:
    - `text(string)`: Encodes text to bytes.
    - `align(center/left/right)`: Sends alignment commands.
    - `bold(boolean)`: Toggles bold mode.
    - `cut()`: Sends paper cut command.
    - `feed(lines)`: Feeds paper.
    - `getBuffer()`: Returns final `Buffer` to send.

#### [NEW] [hooks/use-printer.ts](file:///c:/Development/My_Personal/BillSnapr/hooks/use-printer.ts)
- Uses `react-native-ble-plx`.
- `scan()`: Scans for devices named "Printer", "MTP", "RPP", etc.
- `connect(deviceId)`: Connects and discovers services.
- `print(bytes)`: Writes bytes to the writable characteristic.

### UI Layer
#### [NEW] [app/settings/printer.tsx](file:///c:/Development/My_Personal/BillSnapr/app/settings/printer.tsx)
- List of scanned devices.
- Status indicator (Connected/Disconnected).
- "Test Print" button.

#### [MODIFY] [app/order/[id].tsx](file:///c:/Development/My_Personal/BillSnapr/app/order/[id].tsx)
- Connect "Print Receipt" button to the printing logic.

## Verification Plan

### Automated Tests
- None (Bluetooth hardware cannot be mocked easily in unit tests).

### Manual Verification
1.  **Build Dev Client**: Run `npx expo run:android` on a physical device.
2.  **Scan**: Go to Settings > Printer. Verify it finds a Bluetooth device.
3.  **Connect**: Tap to connect. Verify status changes to "Connected".
4.  **Test Print**: Tap "Test Print". Verify printer prints a sample slip.
5.  **Receipt Print**: Go to an Order > Print. Verify full receipt format.
