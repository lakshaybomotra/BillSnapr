import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export function Input({
    label,
    error,
    leftIcon,
    rightIcon,
    className,
    ...props
}: InputProps) {
    return (
        <View className={`w-full ${className || ''}`}>
            {label && (
                <Text className="text-text-secondary text-sm font-medium mb-1.5 ml-1">
                    {label}
                </Text>
            )}

            <View className={`
 flex-row items-center
 bg-surface-subtle border rounded-xl px-4
 ${error ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-primary-500'}
 `}>
                {leftIcon && <View className="mr-3">{leftIcon}</View>}

                <TextInput
                    className="flex-1 py-3.5 text-text-primary text-base min-h-input"
                    placeholderTextColor="#94A3B8"
                    {...props}
                />

                {rightIcon && <View className="ml-3">{rightIcon}</View>}
            </View>

            {error && (
                <Text className="text-red-500 text-xs mt-1 ml-1">
                    {error}
                </Text>
            )}
        </View>
    );
}
