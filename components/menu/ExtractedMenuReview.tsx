import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { ExtractedMenuItem } from '../../services/menuExtractor';
import { Button } from '../ui';

interface Props {
  items: ExtractedMenuItem[];
  unclear: string[];
  onConfirm: (items: ExtractedMenuItem[]) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ExtractedMenuReview({ items: initialItems, unclear, onConfirm, onCancel, loading }: Props) {
  const [items, setItems] = useState<ExtractedMenuItem[]>(initialItems);

  const updateItem = (index: number, field: keyof ExtractedMenuItem, value: any) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const addManualItem = () => {
    setItems(prev => [...prev, { name: '', price: 0, category: 'Uncategorized', isVeg: true }]);
  };

  const handleConfirm = () => {
    const validItems = items.filter(item => item.name.trim() && item.price > 0);
    if (validItems.length === 0) {
      Alert.alert('Error', 'Add at least one valid item');
      return;
    }
    onConfirm(validItems);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Review Extracted Menu</Text>
        <Text style={styles.subtitle}>{items.length} items found • Edit before saving</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <TouchableOpacity onPress={() => updateItem(index, 'isVeg', !item.isVeg)}>
                <View style={[styles.vegIndicator, item.isVeg ? styles.vegBorder : styles.nonVegBorder]}>
                  <View style={[styles.vegDot, item.isVeg ? styles.vegDotGreen : styles.vegDotRed]} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.nameInput}
              value={item.name}
              onChangeText={(v) => updateItem(index, 'name', v)}
              placeholder="Item name"
            />
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.priceInput]}
                value={item.price ? String(item.price) : ''}
                onChangeText={(v) => updateItem(index, 'price', Number(v) || 0)}
                placeholder="Price"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.categoryInput]}
                value={item.category}
                onChangeText={(v) => updateItem(index, 'category', v)}
                placeholder="Category"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addManualItem}>
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={styles.addBtnText}>Add Item Manually</Text>
        </TouchableOpacity>

        {unclear.length > 0 && (
          <View style={styles.unclearSection}>
            <Text style={styles.unclearTitle}>Unclear Items ({unclear.length})</Text>
            <Text style={styles.unclearHint}>These couldn't be read clearly. Add manually if needed:</Text>
            {unclear.map((text, i) => (
              <Text key={i} style={styles.unclearItem}>• {text}</Text>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Cancel" variant="outline" onPress={onCancel} style={styles.cancelBtn} />
        <Button title={`Save ${items.filter(i => i.name && i.price).length} Items`} onPress={handleConfirm} loading={loading} style={styles.confirmBtn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  title: { ...textStyles.h3, color: colors.textPrimary },
  subtitle: { ...textStyles.caption, color: colors.gray500, marginTop: spacing.xs },
  scroll: { flex: 1, padding: spacing.lg },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  vegIndicator: { width: 18, height: 18, borderWidth: 2, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  vegBorder: { borderColor: colors.veg },
  nonVegBorder: { borderColor: colors.nonVeg },
  vegDot: { width: 9, height: 9, borderRadius: 4.5 },
  vegDotGreen: { backgroundColor: colors.veg },
  vegDotRed: { backgroundColor: colors.nonVeg },
  removeBtn: { padding: spacing.xs },
  nameInput: { ...textStyles.body, fontWeight: '600', borderBottomWidth: 1, borderBottomColor: colors.gray200, paddingVertical: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  input: { borderWidth: 1, borderColor: colors.gray200, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, ...textStyles.body },
  priceInput: { width: 80 },
  categoryInput: { flex: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed', borderRadius: borderRadius.md, marginBottom: spacing.lg },
  addBtnText: { ...textStyles.label, color: colors.primary, marginLeft: spacing.xs },
  unclearSection: { backgroundColor: colors.warningLight, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.lg, borderLeftWidth: 3, borderLeftColor: colors.warning },
  unclearTitle: { ...textStyles.label, color: colors.warning, marginBottom: spacing.xs },
  unclearHint: { ...textStyles.caption, color: colors.gray600, marginBottom: spacing.sm },
  unclearItem: { ...textStyles.caption, color: colors.gray700, marginBottom: spacing.xs },
  footer: { flexDirection: 'row', padding: spacing.lg, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.gray100 },
  cancelBtn: { flex: 1 },
  confirmBtn: { flex: 2 },
});
