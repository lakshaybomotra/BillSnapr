import React from 'react';
import { Text, View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
    variant?: 'default' | 'outlined' | 'flat';
}

export function Card({
    title,
    subtitle,
    action,
    children,
    className,
    variant = 'default',
    ...props
}: CardProps) {
    const variants = {
        default: 'bg-white shadow-sm border border-gray-100',
        outlined: 'bg-transparent border border-gray-200',
        flat: 'bg-gray-50',
    };

    return (
        <View
            className={`
        rounded-2xl p-5
        ${variants[variant]}
        ${className || ''}
      `}
            {...props}
        >
            {(title || subtitle || action) && (
                <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1 mr-4">
                        {title && (
                            <Text className="text-lg font-bold text-text-primary mb-0.5">
                                {title}
                            </Text>
                        )}
                        {subtitle && (
                            <Text className="text-sm text-text-secondary leading-5">
                                {subtitle}
                            </Text>
                        )}
                    </View>
                    {action && <View>{action}</View>}
                </View>
            )}
            {children}
        </View>
    );
}
