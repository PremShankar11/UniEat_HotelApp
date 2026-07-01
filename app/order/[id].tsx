import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { getOrder, updateOrderStatus, Order, OrderStatus } from '../../services/orders';
import { Button, Skeleton } from '../../components/ui';
import { StatusBadge } from '../../components/orders';

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      const result = await getOrder(id);
      if (result.success && result.data) {
        setOrder(result.data);
      }
      setLoading(false);
    };
    fetchOrder();
  }, [id]);

  const getNextStatus = (): OrderStatus | null => {
    if (!order) return null;
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[currentIndex + 1];
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    
    setUpdating(true);
    const result = await updateOrderStatus(order.id, newStatus);
    setUpdating(false);

    if (result.success) {
      setOrder({ ...order, status: newStatus });
    } else {
      Alert.alert('Error', result.error || 'Failed to update status');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => handleUpdateStatus('cancelled')
        },
      ]
    );
  };

  const handleCall = () => {
    if (order?.customerPhone) {
      Linking.openURL(`tel:${order.customerPhone}`);
    }
  };

  const nextStatus = getNextStatus();
  const canUpdate = nextStatus && order?.status !== 'cancelled' && order?.status !== 'completed';

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Skeleton width="60%" height={28} style={{ marginBottom: 12 }} />
          <Skeleton width="40%" height={20} style={{ marginBottom: 24 }} />
          <Skeleton width="100%" height={150} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={100} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.gray300} />
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.orderNumber}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <StatusBadge status={order.status} />
          <Text style={styles.orderTime}>
            {orderDate.toLocaleDateString()} at {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.customerCard}>
            <View style={styles.customerInfo}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.customerName}>{order.customerName}</Text>
            </View>
            {order.customerPhone && (
              <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                <Ionicons name="call-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          {order.customerEmail && (
            <Text style={styles.customerEmail}>{order.customerEmail}</Text>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.itemsCard}>
            {order.items.map((item, index) => (
              <View key={index} style={[styles.itemRow, index < order.items.length - 1 && styles.itemBorder]}>
                <View style={styles.itemLeft}>
                  <View style={[styles.vegIndicator, item.isVeg ? styles.vegBorder : styles.nonVegBorder]}>
                    <View style={[styles.vegDot, item.isVeg ? styles.vegDotGreen : styles.vegDotRed]} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>₹{item.price} x {item.quantity}</Text>
                  </View>
                </View>
                <Text style={styles.itemTotal}>₹{item.price * item.quantity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Status</Text>
              <Text style={[styles.summaryValue, order.paymentStatus === 'paid' ? styles.textSuccess : styles.textWarning]}>
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      {(canUpdate || order.status === 'pending') && (
        <View style={styles.footer}>
          {order.status === 'pending' && (
            <Button
              title="Cancel Order"
              onPress={handleCancel}
              variant="outline"
              style={styles.cancelButton}
            />
          )}
          {canUpdate && (
            <Button
              title={`Mark as ${nextStatus?.charAt(0).toUpperCase()}${nextStatus?.slice(1)}`}
              onPress={() => handleUpdateStatus(nextStatus!)}
              loading={updating}
              style={styles.updateButton}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    padding: spacing.xl,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 120,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  orderTime: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    ...textStyles.body,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  customerEmail: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginLeft: spacing.lg,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vegIndicator: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegBorder: { borderColor: colors.veg },
  nonVegBorder: { borderColor: colors.nonVeg },
  vegDot: { width: 7, height: 7, borderRadius: 3.5 },
  vegDotGreen: { backgroundColor: colors.veg },
  vegDotRed: { backgroundColor: colors.nonVeg },
  itemInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  itemName: {
    ...textStyles.body,
    color: colors.textPrimary,
  },
  itemPrice: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  itemTotal: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
  textSuccess: { color: colors.success },
  textWarning: { color: colors.warning },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  totalLabel: {
    ...textStyles.h4,
    color: colors.textPrimary,
  },
  totalValue: {
    ...textStyles.h3,
    color: colors.success,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.xl,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  cancelButton: {
    flex: 1,
  },
  updateButton: {
    flex: 2,
  },
});
