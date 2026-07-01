import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, KeyboardAvoidingView, Platform, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { Button, Input } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { createMenuItem } from '../services/firestore';
import { uploadMenuItemImage } from '../services/storage';

export default function AddItemScreen() {
  const router = useRouter();
  const { restaurant } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [isVeg, setIsVeg] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Get categories from restaurant's existing menu
  const existingCategories = useMemo(() => {
    if (!restaurant?.menu?.length) return [];
    const cats = [...new Set(restaurant.menu.map((item: any) => item.category).filter(Boolean))];
    return cats.sort();
  }, [restaurant?.menu]);

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategory(newCategory.trim());
      setShowNewCategory(false);
      setNewCategory('');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter item name');
      return;
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!restaurant?.id) {
      Alert.alert('Error', 'Restaurant not found');
      return;
    }

    setLoading(true);

    // Generate item ID first
    const itemId = Date.now().toString();
    let imageUrl: string | undefined;

    // Upload image if selected
    if (image) {
      const uploadResult = await uploadMenuItemImage(restaurant.id, itemId, image);
      if (uploadResult.success && uploadResult.url) {
        imageUrl = uploadResult.url;
      }
    }

    const menuItemData: any = {
      name: name.trim(),
      description: description.trim() || '',
      price: Number(price),
      category,
      isVeg,
      isAvailable,
    };
    
    if (imageUrl) {
      menuItemData.image = imageUrl;
    }

    const result = await createMenuItem(restaurant.id, menuItemData);

    setLoading(false);

    if (result.success) {
      router.back();
    } else {
      Alert.alert('Error', result.error || 'Failed to add item');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Item</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Image Upload */}
          <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image }} style={styles.itemImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={32} color={colors.gray400} />
                <Text style={styles.imageText}>Add Photo</Text>
              </View>
            )}
            {image && (
              <TouchableOpacity style={styles.removeImage} onPress={() => setImage(null)}>
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          <Input label="Item Name" placeholder="e.g., Chicken Biryani" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input label="Description" placeholder="Describe your dish..." value={description} onChangeText={setDescription} multiline numberOfLines={2} />
          <Input label="Price (₹)" placeholder="Enter price" value={price} onChangeText={setPrice} keyboardType="numeric" />

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {existingCategories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.categoryChip, styles.addCategoryChip]}
              onPress={() => setShowNewCategory(true)}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={[styles.categoryText, { color: colors.primary }]}>New</Text>
            </TouchableOpacity>
          </View>
          
          {showNewCategory && (
            <View style={styles.newCategoryRow}>
              <TextInput
                style={styles.newCategoryInput}
                placeholder="Enter category name"
                value={newCategory}
                onChangeText={setNewCategory}
                autoFocus
              />
              <TouchableOpacity style={styles.addCategoryBtn} onPress={handleAddCategory}>
                <Text style={styles.addCategoryBtnText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowNewCategory(false)}>
                <Ionicons name="close" size={24} color={colors.gray500} />
              </TouchableOpacity>
            </View>
          )}
          
          {category && !existingCategories.includes(category) && (
            <View style={[styles.categoryChip, styles.categoryChipActive, { alignSelf: 'flex-start', marginTop: 8 }]}>
              <Text style={styles.categoryTextActive}>{category}</Text>
            </View>
          )}

          {/* Toggles */}
          <View style={styles.toggleSection}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View style={[styles.vegIndicator, isVeg ? styles.vegBorder : styles.nonVegBorder]}>
                  <View style={[styles.vegDot, isVeg ? styles.vegDotGreen : styles.vegDotRed]} />
                </View>
                <Text style={styles.toggleLabel}>{isVeg ? 'Vegetarian' : 'Non-Vegetarian'}</Text>
              </View>
              <Switch
                value={isVeg}
                onValueChange={setIsVeg}
                trackColor={{ false: colors.errorLight, true: colors.successLight }}
                thumbColor={isVeg ? colors.success : colors.error}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Ionicons name={isAvailable ? 'checkmark-circle' : 'close-circle'} size={18} color={isAvailable ? colors.success : colors.error} />
                <Text style={styles.toggleLabel}>{isAvailable ? 'Available' : 'Unavailable'}</Text>
              </View>
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ false: colors.gray300, true: colors.successLight }}
                thumbColor={isAvailable ? colors.success : colors.gray400}
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button title="Add Item" onPress={handleSave} loading={loading} size="large" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyles.h3, color: colors.textPrimary },
  scrollContent: { padding: spacing.xl, paddingBottom: 120 },
  imageUpload: { alignSelf: 'center', marginBottom: spacing.xl, position: 'relative' },
  itemImage: { width: 120, height: 120, borderRadius: borderRadius.xl },
  imagePlaceholder: { width: 120, height: 120, borderRadius: borderRadius.xl, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.gray200, borderStyle: 'dashed' },
  imageText: { ...textStyles.caption, color: colors.gray500, marginTop: spacing.xs },
  removeImage: { position: 'absolute', top: -8, right: -8 },
  label: { ...textStyles.label, color: colors.textPrimary, marginBottom: spacing.sm },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  categoryChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.gray100, flexDirection: 'row', alignItems: 'center', gap: 4 },
  categoryChipActive: { backgroundColor: colors.primaryLight },
  addCategoryChip: { borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed', backgroundColor: 'transparent' },
  categoryText: { ...textStyles.labelSmall, color: colors.textSecondary },
  categoryTextActive: { color: colors.primaryDark },
  newCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  newCategoryInput: { flex: 1, borderWidth: 1, borderColor: colors.gray300, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...textStyles.body },
  addCategoryBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  addCategoryBtnText: { color: colors.white, ...textStyles.labelSmall },
  toggleSection: { marginTop: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  vegIndicator: { width: 16, height: 16, borderWidth: 2, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  vegBorder: { borderColor: colors.veg },
  nonVegBorder: { borderColor: colors.nonVeg },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  vegDotGreen: { backgroundColor: colors.veg },
  vegDotRed: { backgroundColor: colors.nonVeg },
  toggleLabel: { ...textStyles.body, color: colors.textPrimary },
  footer: { padding: spacing.xl, paddingBottom: spacing.xxxl, borderTopWidth: 1, borderTopColor: colors.gray100, backgroundColor: colors.white },
});
