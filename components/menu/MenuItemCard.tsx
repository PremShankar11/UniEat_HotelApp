import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { MenuItem } from '../../services/firestore';

interface MenuItemCardProps {
  item: MenuItem;
  onToggleAvailability: (isAvailable: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MenuItemCard({ item, onToggleAvailability, onEdit, onDelete }: MenuItemCardProps) {
  return (
    <View style={[styles.card, !item.isAvailable && styles.cardUnavailable]}>
      {/* Image Section */}
      <View style={styles.imageSection}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="restaurant-outline" size={28} color={colors.gray400} />
          </View>
        )}
        
        {/* Out of stock overlay */}
        {!item.isAvailable && (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>Unavailable</Text>
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          {/* Veg/Non-veg indicator */}
          <View style={[styles.vegIndicator, item.isVeg ? styles.vegBorder : styles.nonVegBorder]}>
            <View style={[styles.vegDot, item.isVeg ? styles.vegDotGreen : styles.vegDotRed]} />
          </View>
          
          {/* Toggle */}
          <Switch
            value={item.isAvailable}
            onValueChange={onToggleAvailability}
            trackColor={{ false: colors.gray300, true: colors.successLight }}
            thumbColor={item.isAvailable ? colors.success : colors.gray400}
            style={styles.switch}
          />
        </View>

        <Text style={[styles.name, !item.isAvailable && styles.textMuted]} numberOfLines={1}>
          {item.name}
        </Text>
        
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        )}

        <View style={styles.bottomRow}>
          <View style={styles.priceCategory}>
            <Text style={styles.price}>₹{item.price}</Text>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
          </View>
          
          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
              <Ionicons name="create-outline" size={18} color={colors.info} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardUnavailable: {
    opacity: 0.7,
  },
  imageSection: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableText: {
    ...textStyles.labelSmall,
    color: colors.white,
    fontSize: 10,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
  switch: { transform: [{ scale: 0.8 }] },
  name: {
    ...textStyles.h4,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  textMuted: {
    color: colors.textTertiary,
  },
  description: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  price: {
    ...textStyles.label,
    color: colors.success,
  },
  categoryBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    padding: spacing.xs,
  },
});
