import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { useAuth } from '../../contexts/AuthContext';
import { getReviewsByRestaurant, getRestaurantStats, Review } from '../../services/reviews';

type FilterType = 'all' | '5' | '4' | '3' | '2' | '1';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: '5', label: '5★' },
  { key: '4', label: '4★' },
  { key: '3', label: '3★' },
  { key: '2', label: '2★' },
  { key: '1', label: '1★' },
];

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= rating ? 'star' : 'star-outline'}
          size={size}
          color={star <= rating ? colors.warning : colors.gray300}
          style={{ marginRight: 1 }}
        />
      ))}
    </View>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const date = review.createdAt instanceof Date 
    ? review.createdAt 
    : (review.createdAt as any)?.toDate?.() || new Date();
  
  const timeAgo = getTimeAgo(date);
  const itemsSummary = review.items.map(i => `${i.quantity}x ${i.name}`).join(', ');

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {review.customerName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.customerName}>{review.customerName}</Text>
            <Text style={styles.username}>@{review.username}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <StarRating rating={review.rating} />
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
      </View>

      <Text style={styles.description}>{review.description}</Text>

      <View style={styles.footer}>
        {review.photoUrl && (
          <Image
            source={{ uri: review.photoUrl }}
            style={styles.photo}
            resizeMode="cover"
          />
        )}
        <View style={styles.orderInfo}>
          <Ionicons name="receipt-outline" size={14} color={colors.textTertiary} />
          <Text style={styles.orderText}>Order #{review.orderNumber}</Text>
        </View>
      </View>
      
      <Text style={styles.itemsText} numberOfLines={1}>{itemsSummary}</Text>
    </View>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ReviewsScreen() {
  const { restaurant } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ avgRating: number; reviewCount: number; ratingCounts: Record<number, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const fetchData = async (filter: FilterType = 'all') => {
    if (!restaurant?.id) return;
    
    const [reviewsResult, statsResult] = await Promise.all([
      getReviewsByRestaurant(restaurant.id, filter !== 'all' ? { rating: parseInt(filter) } : undefined),
      getRestaurantStats(restaurant.id),
    ]);
    
    if (reviewsResult.success) {
      setReviews(reviewsResult.data);
    }
    if (statsResult.success && statsResult.data) {
      setStats(statsResult.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(activeFilter);
  }, [restaurant?.id, activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(activeFilter);
    setRefreshing(false);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setLoading(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Reviews</Text>
      </View>

      {/* Stats Card */}
      {stats && (
        <View style={styles.statsCard}>
          <View style={styles.statsMain}>
            <Text style={styles.avgRating}>{stats.avgRating.toFixed(1)}</Text>
            <StarRating rating={Math.round(stats.avgRating)} size={20} />
            <Text style={styles.reviewCount}>{stats.reviewCount} reviews</Text>
          </View>
          <View style={styles.statsBreakdown}>
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.ratingCounts[rating] || 0;
              const percentage = stats.reviewCount > 0 ? (count / stats.reviewCount) * 100 : 0;
              return (
                <View key={rating} style={styles.ratingBar}>
                  <Text style={styles.ratingLabel}>{rating}★</Text>
                  <View style={styles.barContainer}>
                    <View style={[styles.barFill, { width: `${percentage}%` }]} />
                  </View>
                  <Text style={styles.ratingCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTERS.map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterBtn, activeFilter === filter.key && styles.filterBtnActive]}
              onPress={() => handleFilterChange(filter.key)}
            >
              <Text style={[styles.filterText, activeFilter === filter.key && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading reviews...</Text>
          </View>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={64} color={colors.gray300} />
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyText}>
              {activeFilter !== 'all' 
                ? `No ${activeFilter}★ reviews found.`
                : 'Reviews from customers will appear here.'}
            </Text>
          </View>
        ) : (
          reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundSecondary },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  title: { ...textStyles.h1, color: colors.textPrimary },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  statsMain: {
    alignItems: 'center',
    paddingRight: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: colors.gray100,
  },
  avgRating: {
    ...textStyles.displayLarge,
    color: colors.textPrimary,
  },
  reviewCount: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsBreakdown: {
    flex: 1,
    paddingLeft: spacing.lg,
    justifyContent: 'center',
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  ratingLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    width: 24,
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: 3,
    marginHorizontal: spacing.sm,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 3,
  },
  ratingCount: {
    ...textStyles.caption,
    color: colors.textTertiary,
    width: 24,
    textAlign: 'right',
  },
  filtersContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  filtersContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    marginRight: spacing.sm,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...textStyles.labelSmall,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  content: { flex: 1, padding: spacing.lg },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  loadingText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...textStyles.label,
    color: colors.black,
  },
  userDetails: {
    marginLeft: spacing.sm,
  },
  customerName: {
    ...textStyles.label,
    color: colors.textPrimary,
  },
  username: {
    ...textStyles.caption,
    color: colors.textTertiary,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  timeAgo: {
    ...textStyles.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  description: {
    ...textStyles.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderText: {
    ...textStyles.caption,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
  },
  itemsText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    backgroundColor: colors.gray50,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyTitle: { ...textStyles.h3, color: colors.textPrimary, marginTop: spacing.lg },
  emptyText: { 
    ...textStyles.body, 
    color: colors.textSecondary, 
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
});
