import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { getTodayStats, getOrders, Order } from '../../services/orders';
import { Skeleton } from '../../components/ui';
import { OrderCard } from '../../components/orders';

export default function DashboardScreen() {
  const router = useRouter();
  const { restaurant, logout } = useAuth();
  const [stats, setStats] = useState({ totalOrders: 0, completedOrders: 0, pendingOrders: 0, totalRevenue: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!restaurant?.id) return;
    
    const [statsResult, ordersResult] = await Promise.all([
      getTodayStats(restaurant.id),
      getOrders(restaurant.id)
    ]);
    
    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data);
    }
    
    if (ordersResult.success && ordersResult.data) {
      setRecentOrders(ordersResult.data.slice(0, 5));
    }
    
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, [restaurant?.id]);

  const isOpen = checkIfOpen(restaurant?.operatingHours);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.restaurantName}>{restaurant?.name || 'Restaurant'}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, isOpen ? styles.statusOpen : styles.statusClosed]} />
              <Text style={[styles.statusText, isOpen ? styles.textOpen : styles.textClosed]}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="receipt-outline" size={24} color={colors.primaryDark} />
            <Text style={styles.statValue}>{loading ? '-' : stats.totalOrders}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.successLight }]}>
            <Ionicons name="cash-outline" size={24} color={colors.success} />
            <Text style={styles.statValue}>{loading ? '-' : `₹${stats.totalRevenue}`}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="time-outline" size={24} color={colors.warning} />
            <Text style={styles.statValue}>{loading ? '-' : stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.infoLight }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.info} />
            <Text style={styles.statValue}>{loading ? '-' : stats.completedOrders}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/add-item')}>
              <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>Add Item</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/menu')}>
              <View style={[styles.actionIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="restaurant-outline" size={24} color={colors.success} />
              </View>
              <Text style={styles.actionText}>View Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/(tabs)/orders')}>
              <View style={[styles.actionIcon, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="list-outline" size={24} color={colors.info} />
              </View>
              <Text style={styles.actionText}>All Orders</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <>
              <Skeleton height={100} style={{ marginBottom: spacing.md }} />
              <Skeleton height={100} style={{ marginBottom: spacing.md }} />
            </>
          ) : recentOrders.length > 0 ? (
            recentOrders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onPress={() => router.push(`/order/${order.id}`)} 
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={colors.gray300} />
              <Text style={styles.emptyText}>No orders yet today</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function checkIfOpen(operatingHours: any): boolean {
  if (!operatingHours) return false;
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const today = days[now.getDay()];
  const todayHours = operatingHours[today];
  
  if (!todayHours?.isOpen) return false;
  
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
  
  const openTime = openHour * 100 + openMin;
  const closeTime = closeHour * 100 + closeMin;
  
  return currentTime >= openTime && currentTime <= closeTime;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerLeft: {
    flex: 1,
  },
  restaurantName: {
    ...textStyles.h1,
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusOpen: {
    backgroundColor: colors.success,
  },
  statusClosed: {
    backgroundColor: colors.error,
  },
  statusText: {
    ...textStyles.labelSmall,
  },
  textOpen: {
    color: colors.success,
  },
  textClosed: {
    color: colors.error,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  statValue: {
    ...textStyles.h2,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  seeAll: {
    ...textStyles.label,
    color: colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    ...textStyles.labelSmall,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
});
