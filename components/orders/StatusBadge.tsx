import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { OrderStatus } from '../../services/orders';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'small' | 'medium';
}

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: colors.statusPending, bgColor: colors.warningLight },
  confirmed: { label: 'Confirmed', color: colors.statusConfirmed, bgColor: colors.infoLight },
  preparing: { label: 'Preparing', color: colors.statusPreparing, bgColor: '#FFF3E0' },
  ready: { label: 'Ready', color: colors.statusReady, bgColor: colors.successLight },
  completed: { label: 'Completed', color: colors.statusCompleted, bgColor: colors.gray100 },
  cancelled: { label: 'Cancelled', color: colors.statusCancelled, bgColor: colors.errorLight },
};

export function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <View style={[
      styles.badge, 
      { backgroundColor: config.bgColor },
      size === 'small' && styles.badgeSmall
    ]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[
        styles.text, 
        { color: config.color },
        size === 'small' && styles.textSmall
      ]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  badgeSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  text: {
    ...textStyles.labelSmall,
  },
  textSmall: {
    ...textStyles.caption,
  },
});
