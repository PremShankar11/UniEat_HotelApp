import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

interface Props {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function MenuImageUploader({ images, onImagesChange, maxImages = 5 }: Props) {
  const pickImages = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Limit Reached', `Maximum ${maxImages} images allowed`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: maxImages - images.length,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map(asset => asset.uri);
      onImagesChange([...images, ...newImages].slice(0, maxImages));
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Upload Menu Images ({images.length}/{maxImages})</Text>
      <Text style={styles.hint}>Upload clear photos of your menu for automatic extraction</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
        {images.map((uri, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        ))}
        
        {images.length < maxImages && (
          <TouchableOpacity style={styles.addButton} onPress={pickImages}>
            <Ionicons name="add-circle-outline" size={32} color={colors.primary} />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { ...textStyles.label, color: colors.textPrimary, marginBottom: spacing.xs },
  hint: { ...textStyles.caption, color: colors.gray500, marginBottom: spacing.md },
  imageScroll: { flexDirection: 'row' },
  imageContainer: { position: 'relative', marginRight: spacing.sm },
  image: { width: 100, height: 100, borderRadius: borderRadius.md },
  removeBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: colors.white, borderRadius: 12 },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { ...textStyles.caption, color: colors.primary, marginTop: spacing.xs },
});
