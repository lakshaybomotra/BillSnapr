import type { Config } from 'tailwindcss';

export default {
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
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
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
        },
    },
    plugins: [],
} satisfies Config;
