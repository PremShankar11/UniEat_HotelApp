import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeToOrders, updateOrderStatus, Order, OrderStatus } from '../../services/orders';
import { Skeleton } from '../../components/ui';

type TabType = 'new' | 'preparing' | 'ready' | 'completed';

export default function OrdersScreen() {
  const { restaurant } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const player = useAudioPlayer(require('../../assets/orderRing.mp3'));
  const prevNewOrdersRef = useRef<string[]>([]);

  // Play/stop notification sound for new orders
  useEffect(() => {
    const newOrders = orders.filter(o => o.status === 'confirmed' && o.paymentStatus === 'paid');
    const newOrderIds = newOrders.map(o => o.id);
    
    // Check if there's a genuinely new order
    const hasNewOrder = newOrderIds.some(id => !prevNewOrdersRef.current.includes(id));
    if (hasNewOrder && prevNewOrdersRef.current.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    if (newOrders.length > 0 && !player.playing) {
      player.loop = true;
      player.play();
    } else if (newOrders.length === 0 && player.playing) {
      player.pause();
    }
    
    prevNewOrdersRef.current = newOrderIds;
  }, [orders, player]);

  useEffect(() => {
    if (!restaurant?.id) return;
    const unsubscribe = subscribeToOrders(restaurant.id, (newOrders) => {
      setOrders(newOrders);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [restaurant?.id]);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await updateOrderStatus(orderId, newStatus);
    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to update order status');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'new': return orders.filter(o => o.status === 'confirmed' && o.paymentStatus === 'paid');
      case 'preparing': return orders.filter(o => o.status === 'preparing');
      case 'ready': return orders.filter(o => o.status === 'ready');
      case 'completed': return orders.filter(o => ['completed', 'cancelled'].includes(o.status));
    }
  };

  const counts = {
    new: orders.filter(o => o.status === 'confirmed' && o.paymentStatus === 'paid').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    completed: orders.filter(o => ['completed', 'cancelled'].includes(o.status)).length,
  };

  const tabs: { key: TabType; label: string; icon: string }[] = [
    { key: 'new', label: 'New', icon: 'notifications' },
    { key: 'preparing', label: 'Preparing', icon: 'flame' },
    { key: 'ready', label: 'Ready', icon: 'checkmark-circle' },
    { key: 'completed', label: 'Done', icon: 'checkmark-done' },
  ];

  const filteredOrders = getFilteredOrders();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
      </View>

      {/* Status Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive, tab.key === 'new' && counts.new > 0 && styles.tabNew]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? colors.white : (tab.key === 'new' && counts.new > 0 ? colors.accent : colors.textSecondary)} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive, tab.key === 'new' && counts.new > 0 && !activeTab.includes('new') && styles.tabTextNew]}>
              {tab.label} ({counts[tab.key]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {loading ? (
          <>
            <Skeleton height={160} style={{ marginBottom: spacing.md }} />
            <Skeleton height={160} style={{ marginBottom: spacing.md }} />
          </>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <OrderQuickCard
              key={order.id}
              order={order}
              tab={activeTab}
              onAccept={() => handleStatusUpdate(order.id, 'preparing')}
              onReject={() => handleStatusUpdate(order.id, 'cancelled')}
              onReady={() => handleStatusUpdate(order.id, 'ready')}
              onComplete={() => handleStatusUpdate(order.id, 'completed')}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>No {activeTab} orders</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface OrderQuickCardProps {
  order: Order;
  tab: TabType;
  onAccept: () => void;
  onReject: () => void;
  onReady: () => void;
  onComplete: () => void;
}

function OrderQuickCard({ order, tab, onAccept, onReject, onReady, onComplete }: OrderQuickCardProps) {
  const timeAgo = getTimeAgo(order.createdAt);

  return (
    <View style={[styles.card, tab === 'new' && styles.cardNew]}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.customerName}>{order.customerName}</Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.total}>₹{order.totalAmount}</Text>
          <Text style={styles.time}>{timeAgo}</Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        {order.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={[styles.vegIndicator, { backgroundColor: item.isVeg ? colors.veg : colors.nonVeg }]} />
            <Text style={styles.itemText}>{item.quantity}x {item.name}</Text>
          </View>
        ))}
      </View>

      {/* Action Buttons based on tab */}
      {tab === 'new' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={onReject}>
            <Ionicons name="close" size={20} color={colors.white} />
            <Text style={styles.actionText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={onAccept}>
            <Ionicons name="checkmark" size={20} color={colors.white} />
            <Text style={styles.actionText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
      {tab === 'preparing' && (
        <TouchableOpacity style={[styles.actionBtn, styles.readyBtn, styles.fullBtn]} onPress={onReady}>
          <Ionicons name="checkmark-circle" size={20} color={colors.white} />
          <Text style={styles.actionText}>Mark Ready</Text>
        </TouchableOpacity>
      )}
      {tab === 'ready' && (
        <TouchableOpacity style={[styles.actionBtn, styles.completeBtn, styles.fullBtn]} onPress={onComplete}>
          <Ionicons name="checkmark-done" size={20} color={colors.white} />
          <Text style={styles.actionText}>Complete</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function getTimeAgo(timestamp: any): string {
  const date = timestamp?.toDate?.() || new Date(timestamp);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { ...textStyles.h1, color: colors.textPrimary },
  tabsScroll: { maxHeight: 50 },
  tabsContainer: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  tabActive: { backgroundColor: colors.primary },
  tabNew: { backgroundColor: colors.accentLight },
  tabText: { ...textStyles.label, color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  tabTextNew: { color: colors.accent },
  listContent: { padding: spacing.xl, paddingBottom: 120 },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardNew: { borderLeftWidth: 4, borderLeftColor: colors.accent },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  orderNumber: { ...textStyles.h3, color: colors.textPrimary },
  customerName: { ...textStyles.bodySmall, color: colors.textSecondary, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  total: { ...textStyles.h4, color: colors.success },
  time: { ...textStyles.caption, color: colors.textTertiary, marginTop: 2 },
  itemsList: { backgroundColor: colors.gray50, borderRadius: borderRadius.md, padding: spacing.sm, marginBottom: spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  vegIndicator: { width: 8, height: 8, borderRadius: 2, marginRight: spacing.sm },
  itemText: { ...textStyles.body, color: colors.textPrimary },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  fullBtn: { flex: 1 },
  rejectBtn: { backgroundColor: colors.error },
  acceptBtn: { backgroundColor: colors.success },
  readyBtn: { backgroundColor: colors.statusPreparing },
  completeBtn: { backgroundColor: colors.success },
  actionText: { ...textStyles.label, color: colors.white },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl },
  emptyText: { ...textStyles.body, color: colors.textTertiary, marginTop: spacing.md },
});
