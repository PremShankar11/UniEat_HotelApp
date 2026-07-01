import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { Order } from '../../services/orders';
import { StatusBadge } from './StatusBadge';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const timeAgo = getTimeAgo(order.createdAt);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
        <StatusBadge status={order.status} size="small" />
      </View>

      <View style={styles.customerInfo}>
        <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.customerName}>{order.customerName}</Text>
      </View>

      <View style={styles.itemsPreview}>
        <Text style={styles.itemsText} numberOfLines={1}>
          {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.itemCount}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
        <Text style={styles.total}>₹{order.totalAmount}</Text>
      </View>
    </TouchableOpacity>
  );
}

function getTimeAgo(timestamp: any): string {
  const date = timestamp?.toDate?.() || new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  time: {
    ...textStyles.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  customerName: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  itemsPreview: {
    backgroundColor: colors.gray50,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  itemsText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    ...textStyles.caption,
    color: colors.textTertiary,
  },
  total: {
    ...textStyles.h4,
    color: colors.success,
  },
});
