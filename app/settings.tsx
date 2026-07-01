import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, shadows } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import { updateRestaurant, updateOperatingHours, OperatingHours } from '../services/firestore';
import { uploadRestaurantImage } from '../services/storage';
import { Button, Input, TimePicker } from '../components/ui';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function SettingsScreen() {
  const router = useRouter();
  const { restaurant, logout, refreshRestaurant } = useAuth();
  
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Editable fields
  const [name, setName] = useState(restaurant?.name || '');
  const [description, setDescription] = useState(restaurant?.description || '');
  const [heroImage, setHeroImage] = useState(restaurant?.heroImage || '');
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(
    restaurant?.operatingHours || {}
  );

  // Track if image changed
  const [imageChanged, setImageChanged] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setHeroImage(result.assets[0].uri);
      setImageChanged(true);
    }
  };

  const toggleDay = (day: string) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], isOpen: !prev[day]?.isOpen }
    }));
  };

  const updateTime = (day: string, type: 'open' | 'close', time: string) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: time }
    }));
  };

  const handleSave = async () => {
    if (!restaurant?.id) return;
    
    setSaving(true);
    
    let finalHeroImage = heroImage;
    
    // Upload new image if changed
    if (imageChanged && heroImage && !heroImage.startsWith('http')) {
      const uploadResult = await uploadRestaurantImage(restaurant.id, heroImage, 'hero');
      if (uploadResult.success && uploadResult.url) {
        finalHeroImage = uploadResult.url;
      }
    }
    
    const updateData: any = {
      name: name || '',
      description: description || '',
    };
    
    if (finalHeroImage) {
      updateData.heroImage = finalHeroImage;
    }
    
    const result = await updateRestaurant(restaurant.id, updateData);
    
    const hoursResult = await updateOperatingHours(restaurant.id, operatingHours);
    
    setSaving(false);
    
    if (result.success && hoursResult.success) {
      await refreshRestaurant();
      setEditing(false);
      setImageChanged(false);
      Alert.alert('Success', 'Settings saved');
    } else {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/login');
      }},
    ]);
  };

  const menuCount = restaurant?.menu?.length || 0;
  const availableCount = restaurant?.menu?.filter((i: any) => i.isAvailable).length || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        {editing ? (
          <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
            <Ionicons name="create-outline" size={16} color={colors.white} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Image */}
        <TouchableOpacity 
          style={styles.heroSection} 
          onPress={editing ? pickImage : undefined}
          disabled={!editing}
        >
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="storefront" size={48} color={colors.gray400} />
            </View>
          )}
          {editing && (
            <View style={styles.editOverlay}>
              <Ionicons name="camera" size={24} color={colors.white} />
            </View>
          )}
        </TouchableOpacity>

        {/* Restaurant Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Info</Text>
          
          {editing ? (
            <>
              <Input label="Name" value={name} onChangeText={setName} />
              <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
            </>
          ) : (
            <View style={styles.infoCard}>
              <Text style={styles.restaurantName}>{restaurant?.name}</Text>
              <Text style={styles.restaurantDesc}>{restaurant?.description || 'No description'}</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{menuCount}</Text>
                  <Text style={styles.statLabel}>Items</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{availableCount}</Text>
                  <Text style={styles.statLabel}>Available</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Operating Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>
          
          {DAYS.map((day, i) => {
            const hours = operatingHours[day] || { open: '09:00', close: '22:00', isOpen: false };
            return (
              <View key={day} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
                  {editing ? (
                    <Switch
                      value={hours.isOpen}
                      onValueChange={() => toggleDay(day)}
                      trackColor={{ false: colors.gray300, true: colors.successLight }}
                      thumbColor={hours.isOpen ? colors.success : colors.gray400}
                    />
                  ) : (
                    <View style={[styles.statusDot, hours.isOpen ? styles.dotOpen : styles.dotClosed]} />
                  )}
                </View>
                {hours.isOpen && (
                  editing ? (
                    <View style={styles.timeRow}>
                      <TimePicker value={hours.open} onChange={(t) => updateTime(day, 'open', t)} label="Opens" />
                      <Text style={styles.timeSeparator}>to</Text>
                      <TimePicker value={hours.close} onChange={(t) => updateTime(day, 'close', t)} label="Closes" />
                    </View>
                  ) : (
                    <Text style={styles.timeDisplay}>{hours.open} - {hours.close}</Text>
                  )
                )}
              </View>
            );
          })}
        </View>

        {/* Actions */}
        {!editing && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: colors.errorLight }]}>
                  <Ionicons name="log-out-outline" size={20} color={colors.error} />
                </View>
                <Text style={[styles.menuItemText, { color: colors.error }]}>Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>

      {/* Save Button */}
      {editing && (
        <View style={styles.footer}>
          <Button title="Save Changes" onPress={handleSave} loading={saving} size="large" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...textStyles.h3, color: colors.textPrimary },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, gap: spacing.xs },
  editBtnText: { ...textStyles.labelSmall, color: colors.white },
  cancelBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  cancelText: { ...textStyles.label, color: colors.textSecondary },
  scrollContent: { paddingBottom: 120 },
  heroSection: { height: 180, marginHorizontal: spacing.xl, marginBottom: spacing.xl, borderRadius: borderRadius.xl, overflow: 'hidden', position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { width: '100%', height: '100%', backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  editOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  section: { paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  sectionTitle: { ...textStyles.labelSmall, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md },
  infoCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg, ...shadows.sm },
  restaurantName: { ...textStyles.h2, color: colors.textPrimary, marginBottom: spacing.xs },
  restaurantDesc: { ...textStyles.body, color: colors.textSecondary, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.xl },
  stat: { alignItems: 'center' },
  statValue: { ...textStyles.h2, color: colors.primary },
  statLabel: { ...textStyles.caption, color: colors.textSecondary },
  dayCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayLabel: { ...textStyles.label, color: colors.textPrimary },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  timeSeparator: { ...textStyles.body, color: colors.textSecondary },
  timeDisplay: { ...textStyles.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotOpen: { backgroundColor: colors.success },
  dotClosed: { backgroundColor: colors.gray300 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, padding: spacing.lg, borderRadius: borderRadius.lg, ...shadows.sm },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  menuItemText: { ...textStyles.body, color: colors.textPrimary },
  version: { ...textStyles.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.xl },
  footer: { padding: spacing.xl, paddingBottom: spacing.xxxl, borderTopWidth: 1, borderTopColor: colors.gray100, backgroundColor: colors.white },
});
