# Implementation Plan: App Assets

## Goal
Use the "Digital Receipt" logo as the App Icon and Splash Screen.

## 1. Create Source Assets
- [NEW] `assets/logo.svg`: The clean vector icon from `BrandLogo.tsx`.
- [NEW] `assets/splash_logo.svg`: The icon centered on the `off-white` background.

## 2. Configuration Challenge
React Native / Expo explicitly **requires PNG files** for:
- `icon` (1024x1024)
- `adaptiveIcon` (Foreground/Background)

SVGs are not directly supported in `app.json` for the main icon without a build-time transformer or manual conversion.

## 3. Strategy
1. **Generate the SVGs**: I will create the high-quality source files in your project.
2. **Configuration**:
    - **Option A (Recommended)**: I create the SVGs, and you use an online tool (like https://icon.kitchen) or the AI prompt I gave you to generate the raster PNGs, then replace the files in `assets/images/`.
    - **Option B (Experimental)**: I point `app.json` to the SVGs. This works for the *Splash Screen* in some Expo versions, but usually fails for the App Icon.

## 4. Execution
I will generate the SVG files now so you have the source of truth.
