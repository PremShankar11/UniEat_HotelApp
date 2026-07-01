import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  loading = false, 
  disabled = false,
  style,
  textStyle
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    isDisabled && styles.disabled,
    style
  ];

  const textStyles2 = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    isDisabled && styles.disabledText,
    textStyle
  ];

  return (
    <TouchableOpacity 
      style={buttonStyles} 
      onPress={onPress} 
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.black : colors.primary} />
      ) : (
        <Text style={textStyles2}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },
  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.gray100,
  },
  danger: {
    backgroundColor: colors.error,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  // Sizes
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    minHeight: 36,
  },
  medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 48,
  },
  large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    minHeight: 56,
  },
  // Disabled
  disabled: {
    backgroundColor: colors.gray200,
  },
  // Text styles
  text: {
    ...textStyles.button,
  },
  primaryText: {
    color: colors.black,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  dangerText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.textPrimary,
  },
  smallText: {
    ...textStyles.buttonSmall,
  },
  mediumText: {
    ...textStyles.button,
  },
  largeText: {
    ...textStyles.button,
    fontSize: 18,
  },
  disabledText: {
    color: colors.textDisabled,
  },
});
