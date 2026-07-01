import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { getMenuItems, updateMenuItemAvailability, deleteMenuItem, MenuItem } from '../../services/firestore';
import { Skeleton } from '../../components/ui';
import { MenuItemCard } from '../../components/menu';

type FilterType = 'all' | 'available' | 'unavailable' | 'veg' | 'nonveg';

export default function MenuScreen() {
  const router = useRouter();
  const { restaurant, refreshRestaurant } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchMenu = useCallback(async () => {
    if (!restaurant?.id) return;
    
    const result = await getMenuItems(restaurant.id);
    if (result.success && result.data) {
      setMenuItems(result.data);
    }
    setLoading(false);
  }, [restaurant?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMenu();
    await refreshRestaurant();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleToggleAvailability = async (itemId: string, isAvailable: boolean) => {
    if (!restaurant?.id) return;
    
    // Optimistic update
    setMenuItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, isAvailable } : item
    ));
    
    const result = await updateMenuItemAvailability(restaurant.id, itemId, isAvailable);
    if (!result.success) {
      // Revert on failure
      setMenuItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, isAvailable: !isAvailable } : item
      ));
      Alert.alert('Error', result.error || 'Failed to update availability');
    }
  };

  const handleDelete = (item: MenuItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            if (!restaurant?.id) return;
            const result = await deleteMenuItem(restaurant.id, item.id);
            if (result.success) {
              setMenuItems(prev => prev.filter(i => i.id !== item.id));
            } else {
              Alert.alert('Error', result.error || 'Failed to delete item');
            }
          }
        },
      ]
    );
  };

  const filteredItems = menuItems.filter(item => {
    switch (filter) {
      case 'available': return item.isAvailable;
      case 'unavailable': return !item.isAvailable;
      case 'veg': return item.isVeg;
      case 'nonveg': return !item.isVeg;
      default: return true;
    }
  });

  const availableCount = menuItems.filter(i => i.isAvailable).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Menu</Text>
          <Text style={styles.subtitle}>
            {availableCount} of {menuItems.length} items available
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.smartAddButton} onPress={() => router.push('/smart-menu?mode=add')}>
            <Ionicons name="scan-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-item')}>
            <Ionicons name="add" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {(['all', 'available', 'unavailable'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterChip, filter === 'veg' && styles.filterChipVeg]}
          onPress={() => setFilter(filter === 'veg' ? 'all' : 'veg')}
        >
          <View style={[styles.vegDot, { backgroundColor: colors.veg }]} />
          <Text style={[styles.filterText, filter === 'veg' && styles.filterTextVeg]}>Veg</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'nonveg' && styles.filterChipNonVeg]}
          onPress={() => setFilter(filter === 'nonveg' ? 'all' : 'nonveg')}
        >
          <View style={[styles.vegDot, { backgroundColor: colors.nonVeg }]} />
          <Text style={[styles.filterText, filter === 'nonveg' && styles.filterTextNonVeg]}>Non-veg</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Menu List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {loading ? (
          <>
            <Skeleton height={120} style={{ marginBottom: spacing.md }} />
            <Skeleton height={120} style={{ marginBottom: spacing.md }} />
            <Skeleton height={120} style={{ marginBottom: spacing.md }} />
          </>
        ) : filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              onToggleAvailability={(isAvailable) => handleToggleAvailability(item.id, isAvailable)}
              onEdit={() => router.push(`/edit-item/${item.id}`)}
              onDelete={() => handleDelete(item)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color={colors.gray300} />
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'No menu items yet' : `No ${filter} items`}
            </Text>
            {filter === 'all' && (
              <TouchableOpacity style={styles.addFirstButton} onPress={() => router.push('/add-item')}>
                <Text style={styles.addFirstText}>Add your first item</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...textStyles.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  smartAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersContainer: {
    maxHeight: 50,
    marginBottom: spacing.lg,
  },
  filtersContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
  },
  filterChipVeg: {
    backgroundColor: colors.successLight,
  },
  filterChipNonVeg: {
    backgroundColor: colors.errorLight,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  filterText: {
    ...textStyles.labelSmall,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.primaryDark,
  },
  filterTextVeg: {
    color: colors.success,
  },
  filterTextNonVeg: {
    color: colors.error,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 120,
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
  addFirstButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  addFirstText: {
    ...textStyles.button,
    color: colors.black,
  },
});
