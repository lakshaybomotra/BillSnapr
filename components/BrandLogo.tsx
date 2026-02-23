import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

interface BrandLogoProps {
    variant?: 'icon' | 'full';
    className?: string; // For container styling
    width?: number;
    height?: number;
}

export default function BrandLogo({
    variant = 'full',
    className = "",
    width,
    height
}: BrandLogoProps) {

    // Default dimensions if not provided
    const iconSize = width || 40;
    const finalHeight = height || iconSize;

    // Brand Colors
    const colors = {
        emerald: '#2ECC71',
        charcoal: '#34495E',
        gold: '#F1C40F',
    };

    const LogoIcon = () => (
        <Svg
            width={iconSize}
            height={finalHeight}
            viewBox="0 0 100 100"
            fill="none"
        >
            <Defs>
                <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={colors.emerald} stopOpacity="1" />
                    <Stop offset="1" stopColor="#27ae60" stopOpacity="1" />
                </LinearGradient>
            </Defs>

            {/* Receipt Body */}
            <Path
                d="M20 90 L20 30 L80 30 L80 90 L70 85 L60 90 L50 85 L40 90 L30 85 L20 90 Z"
                fill="url(#grad)"
            />

            {/* Pixel/Digital Fade Effect (Top part) */}
            <Rect x="20" y="20" width="10" height="10" fill={colors.emerald} opacity="0.8" />
            <Rect x="35" y="15" width="10" height="10" fill={colors.emerald} opacity="0.6" />
            <Rect x="50" y="20" width="10" height="10" fill={colors.emerald} opacity="0.9" />
            <Rect x="65" y="10" width="10" height="10" fill={colors.emerald} opacity="0.5" />
            <Rect x="75" y="22" width="5" height="5" fill={colors.gold} /> {/* Gold Accent Pixel */}

            {/* Receipt Lines (Abstract Text) */}
            <Rect x="30" y="45" width="40" height="4" rx="2" fill="white" opacity="0.9" />
            <Rect x="30" y="55" width="25" height="4" rx="2" fill="white" opacity="0.9" />
            <Rect x="30" y="65" width="30" height="4" rx="2" fill="white" opacity="0.9" />

            {/* Checkmark / Success indicator */}
            <Path
                d="M65 75 L70 80 L80 65"
                stroke={colors.charcoal}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );

    if (variant === 'icon') {
        return (
            <View className={`${className} items-center justify-center`}>
                <LogoIcon />
            </View>
        );
    }

    return (
        <View className={`${className} flex-row items-center gap-2`}>
            <LogoIcon />
            <View>
                <Text className="text-brand-charcoal font-bold text-xl tracking-tight">
                    Bill<Text className="text-brand-emerald">Snapr</Text>
                </Text>
            </View>
        </View>
    );
}
