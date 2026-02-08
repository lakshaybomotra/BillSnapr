import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    label: string;
    loading?: boolean;
    icon?: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    label,
    loading,
    icon,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'flex-row items-center justify-center rounded-xl';

    const variants = {
        primary: 'bg-primary-500 active:bg-primary-600',
        secondary: 'bg-primary-100 active:bg-primary-200',
        outline: 'bg-transparent border border-primary-500 active:bg-primary-50',
        ghost: 'bg-transparent active:bg-gray-100',
    };

    const sizes = {
        sm: 'px-3 py-2',
        md: 'px-4 py-3.5',
        lg: 'px-6 py-4',
    };

    const textStyles = {
        primary: 'text-white font-semibold',
        secondary: 'text-primary-700 font-semibold',
        outline: 'text-primary-600 font-semibold',
        ghost: 'text-text-secondary font-medium',
    };

    const sizeTextStyles = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg',
    };

    return (
        <TouchableOpacity
            disabled={disabled || loading}
            className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50' : ''}
        ${className || ''}
      `}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? 'white' : '#00936E'} />
            ) : (
                <>
                    {icon && <Text className="mr-2">{icon}</Text>}
                    <Text className={`${textStyles[variant]} ${sizeTextStyles[size]}`}>
                        {label}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}
