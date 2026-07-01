import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { Button } from '../components/ui';
import { MenuImageUploader, ExtractedMenuReview } from '../components/menu';
import { extractMenuFromImages, ExtractedMenuItem, ExtractionResult } from '../services/menuExtractor';
import { useAuth } from '../contexts/AuthContext';
import { updateRestaurant } from '../services/firestore';

type Step = 'upload' | 'processing' | 'review';

export default function SmartMenuScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: 'signup' | 'add' }>();
  const { restaurant, refreshRestaurant } = useAuth();
  
  const [step, setStep] = useState<Step>('upload');
  const [images, setImages] = useState<string[]>([]);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [saving, setSaving] = useState(false);

  const handleExtract = async () => {
    if (images.length === 0) {
      Alert.alert('Error', 'Please upload at least one menu image');
      return;
    }

    setStep('processing');

    try {
      const result = await extractMenuFromImages(images);
      setExtractionResult(result);
      setStep('review');
    } catch (error: any) {
      Alert.alert('Extraction Failed', error.message || 'Could not extract menu from images');
      setStep('upload');
    }
  };

  const handleConfirm = async (items: ExtractedMenuItem[]) => {
    if (!restaurant?.id) {
      Alert.alert('Error', 'Restaurant not found');
      return;
    }

    setSaving(true);

    const existingMenu = restaurant.menu || [];
    const newMenuItems = items.map((item, index) => ({
      id: (Date.now() + index).toString(),
      name: item.name || '',
      price: item.price || 0,
      category: item.category || 'Uncategorized',
      isVeg: item.isVeg ?? true,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const updatedMenu = mode === 'signup' ? newMenuItems : [...existingMenu, ...newMenuItems];

    const result = await updateRestaurant(restaurant.id, { menu: updatedMenu });
    setSaving(false);

    if (result.success) {
      await refreshRestaurant?.();
      Alert.alert('Success', `${items.length} items added to menu`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to save menu');
    }
  };

  const handleCancel = () => {
    if (step === 'review') {
      setStep('upload');
      setExtractionResult(null);
    } else {
      router.back();
    }
  };

  if (step === 'processing') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingTitle}>Analyzing Menu...</Text>
          <Text style={styles.processingHint}>This may take a few seconds</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'review' && extractionResult) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ExtractedMenuReview
          items={extractionResult.items}
          unclear={extractionResult.unclear}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          loading={saving}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Menu Add</Text>
        <Text style={styles.subtitle}>Upload photos of your menu and we'll extract items automatically</Text>
      </View>

      <View style={styles.content}>
        <MenuImageUploader images={images} onImagesChange={setImages} maxImages={5} />

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            For best results, upload clear photos with good lighting. You can review and edit all items before saving.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button title="Cancel" variant="outline" onPress={handleCancel} style={styles.cancelBtn} />
        <Button 
          title="Extract Menu" 
          onPress={handleExtract} 
          disabled={images.length === 0}
          style={styles.extractBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  title: { ...textStyles.h2, color: colors.textPrimary },
  subtitle: { ...textStyles.body, color: colors.gray500, marginTop: spacing.xs },
  content: { flex: 1, padding: spacing.xl },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  infoText: { ...textStyles.caption, color: colors.primaryDark, flex: 1 },
  footer: { flexDirection: 'row', padding: spacing.xl, gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.gray100 },
  cancelBtn: { flex: 1 },
  extractBtn: { flex: 2 },
  processingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  processingTitle: { ...textStyles.h3, color: colors.textPrimary, marginTop: spacing.lg },
  processingHint: { ...textStyles.caption, color: colors.gray500, marginTop: spacing.xs },
});
