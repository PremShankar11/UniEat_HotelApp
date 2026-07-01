import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, KeyboardAvoidingView, Platform, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { Button, Input, Skeleton } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { updateMenuItem, MenuItem } from '../../services/firestore';
import { uploadMenuItemImage } from '../../services/storage';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    if (restaurant?.menu && id) {
      const item = restaurant.menu.find((i: MenuItem) => i.id === id);
      if (item) {
        setName(item.name);
        setDescription(item.description || '');
        setPrice(item.price.toString());
        setCategory(item.category);
        setIsVeg(item.isVeg);
        setIsAvailable(item.isAvailable);
        setImage(item.image || null);
      }
    }
    setLoading(false);
  }, [restaurant, id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewImageUri(result.assets[0].uri);
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
    if (!restaurant?.id || !id) {
      Alert.alert('Error', 'Item not found');
      return;
    }

    setSaving(true);

    let imageUrl = image;
    
    // Upload new image if changed
    if (newImageUri) {
      const uploadResult = await uploadMenuItemImage(restaurant.id, id, newImageUri);
      if (uploadResult.success && uploadResult.url) {
        imageUrl = uploadResult.url;
      } else {
        Alert.alert('Warning', 'Failed to upload image, saving other changes');
      }
    }

    const updateData: any = {
      name: name.trim(),
      description: description.trim() || '',
      price: Number(price),
      category,
      isVeg,
      isAvailable,
    };
    
    if (imageUrl) {
      updateData.image = imageUrl;
    }

    const result = await updateMenuItem(restaurant.id, id, updateData);

    setSaving(false);

    if (result.success) {
      router.back();
    } else {
      Alert.alert('Error', result.error || 'Failed to update item');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Item</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Skeleton height={48} style={{ marginBottom: spacing.lg }} />
          <Skeleton height={100} style={{ marginBottom: spacing.lg }} />
          <Skeleton height={48} style={{ marginBottom: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  const displayImage = newImageUri || image;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Item</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Item Image</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {displayImage ? (
                <Image source={{ uri: displayImage }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={32} color={colors.gray400} />
                  <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={14} color={colors.white} />
              </View>
            </TouchableOpacity>
          </View>

          <Input
            label="Item Name"
            placeholder="e.g., Chicken Biryani"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Input
            label="Description (Optional)"
            placeholder="Describe your dish..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <Input
            label="Price"
            placeholder="Enter price in ₹"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryGrid}>
              {existingCategories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                    {cat}
                  </Text>
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
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
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
            <View style={styles.toggleInfo}>
              <Ionicons 
                name={isAvailable ? 'checkmark-circle' : 'close-circle'} 
                size={20} 
                color={isAvailable ? colors.success : colors.error} 
              />
              <Text style={styles.toggleLabel}>{isAvailable ? 'Available' : 'Unavailable'}</Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={setIsAvailable}
              trackColor={{ false: colors.gray300, true: colors.successLight }}
              thumbColor={isAvailable ? colors.success : colors.gray400}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={saving}
            size="large"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...textStyles.h3, color: colors.textPrimary },
  placeholder: { width: 40 },
  loadingContainer: { padding: spacing.xl },
  scrollContent: { padding: spacing.xl, paddingBottom: 100 },
  section: { marginBottom: spacing.lg },
  label: { ...textStyles.label, color: colors.textPrimary, marginBottom: spacing.sm },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: { ...textStyles.caption, color: colors.gray500, marginTop: spacing.xs },
  editBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryChipActive: { backgroundColor: colors.primaryLight },
  addCategoryChip: { borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed', backgroundColor: 'transparent' },
  categoryText: { ...textStyles.labelSmall, color: colors.textSecondary },
  categoryTextActive: { color: colors.primaryDark },
  newCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  newCategoryInput: { flex: 1, borderWidth: 1, borderColor: colors.gray300, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...textStyles.body },
  addCategoryBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  addCategoryBtnText: { color: colors.white, ...textStyles.labelSmall },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  toggleInfo: { flexDirection: 'row', alignItems: 'center' },
  vegIndicator: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  vegBorder: { borderColor: colors.veg },
  nonVegBorder: { borderColor: colors.nonVeg },
  vegDot: { width: 9, height: 9, borderRadius: 4.5 },
  vegDotGreen: { backgroundColor: colors.veg },
  vegDotRed: { backgroundColor: colors.nonVeg },
  toggleLabel: { ...textStyles.body, color: colors.textPrimary, marginLeft: spacing.sm },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
});
