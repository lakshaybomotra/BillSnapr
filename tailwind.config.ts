import type { Config } from 'tailwindcss';

export default {
    darkMode: 'class' as const,
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            fontSize: {
                '2xs': ['0.5625rem', { lineHeight: '0.75rem' }],     // 9px
                'xxs': ['0.625rem', { lineHeight: '0.875rem' }],     // 10px
                'xs-plus': ['0.6875rem', { lineHeight: '1rem' }],    // 11px
                'sm-minus': ['0.8125rem', { lineHeight: '1.125rem' }], // 13px
            },
            spacing: {
                '5.5': '1.375rem',  // 22px (badge height)
            },
            width: {
                'sidebar': '4rem',         // 64px
                'sidebar-text': '3.5rem',  // 56px
                'indicator': '0.1875rem',  // 3px
            },
            minWidth: {
                'badge': '1.375rem',  // 22px
            },
            minHeight: {
                'input': '3rem',      // 48px
                'textarea': '5rem',   // 80px
            },
            maxWidth: {
                'receipt': '17.5rem', // 280px
            },
            colors: {
                primary: {
                    50: '#E6F6F3',
                    100: '#CCE9E2',
                    200: '#99D4C5',
                    300: '#66BEA8',
                    400: '#33A98B',
                    500: '#00936E', // main brand green
                    600: '#007658',
                    700: '#005842',
                    800: '#003B2C',
                    900: '#001D16',
                },
                secondary: {
                    50: '#FFF5E6',
                    100: '#FFE8CC',
                    200: '#FFD199',
                    300: '#FFBA66',
                    400: '#FFA333',
                    500: '#FF8C00', // accent orange
                    600: '#CC7000',
                    700: '#995400',
                    800: '#663800',
                    900: '#331C00',
                },
                surface: {
                    DEFAULT: '#FFFFFF',
                    muted: '#F8FAFC',
                    subtle: '#F1F5F9',
                },
                text: {
                    primary: '#0F172A',
                    secondary: '#475569',
                    muted: '#94A3B8',
                },
                brand: {
                    emerald: '#2ECC71', // Primary
                    charcoal: '#34495E', // Secondary
                    gold: '#F1C40F', // Accent
                    offWhite: '#F8F9FA', // Background
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            // Workaround: react-native-css-interop@0.2.1 has a box-shadow
            // parser bug that crashes Android on NativeWind theme switches.
            // Override all shadows to transparent until css-interop is patched.
            // See: https://github.com/nativewind/nativewind/issues/1432
            boxShadow: {
                none: 'none',
                sm: '0 0 #0000',
                DEFAULT: '0 0 #0000',
                md: '0 0 #0000',
                lg: '0 0 #0000',
                xl: '0 0 #0000',
                '2xl': '0 0 #0000',
            },
        },
    },
    plugins: [],
} satisfies Config;
