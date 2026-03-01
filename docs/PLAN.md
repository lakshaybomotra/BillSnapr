# EAS Update (OTA Updates) Integration Plan

## 1. Overview
The user requested information on how to implement Over The Air (OTA) updates in their Expo app, allowing them to push app updates directly to users without submitting a new release to the Play Store or App Store. 

In Expo, this is handled by **EAS Update**.

## 2. Current Setup Status
Based on the `explorer-agent` analysis, **the project is already partially configured for OTA Updates!**
- `expo-updates` package is already installed (`~29.0.16`).
- `app.json` already contains the `eas.projectId` (`4fedfd57-1448-42bd-af92-b4638280088a`).
- `app.json` has the `updates.url` pointing to the EAS update endpoint.
- `app.json` has `runtimeVersion` mapped to `"policy": "appVersion"`.

## 3. How EAS Update Works
1. **The App Build:** When you build the app for the stores (using `eas build`), the build is bundled with a specific `runtimeVersion` (derived from the app version, e.g., `1.0.0`).
2. **Publishing an Update:** When you run `eas update`, EAS packages your JS/assets and uploads them to Expo's servers under a specific update branch.
3. **Fetching the Update:** When a user opens the app, the `expo-updates` library checks the EAS server for a new update matching their exact `runtimeVersion`.
4. **Applying the Update:** If found, the update is downloaded and usually applied the *next* time the user cold-starts the app.

## 4. Limitations (When you CANNOT use OTA updates)
You can only use OTA updates for JavaScript/TypeScript code and assets (images, fonts).
You **CANNOT** use OTA updates if you:
- Install a new Native Library (a package containing iOS/Android native code).
- Change native project configuration (`android/` or `ios/` folders, or `app.json` native-specific fields).
- Change the `appVersion` (this changes the `runtimeVersion`, meaning the stores need a new binary).

## 5. Execution Steps
If the plan is approved, the implementation phase will follow these steps:

### Step 1: Verify Initial Config
- Validate `app.json` updates config.
- Run `eas update:configure` if the setup is incomplete for the specific branches.

### Step 2: Set up Release Channels (Branches/Profiles)
- Configure `eas.json` to have separate profiles for `preview` (staging) and `production`.
- Ensure channels are mapped correctly to branches.

### Step 3: Test an OTA Update locally
- Create a test update `eas update --branch preview --message "test update"`.
- Verify on a test build.

### Step 4: Final Verification
- Run full codebase tests (`test-engineer`).
- Run security scanning scripts (`security-auditor`).
