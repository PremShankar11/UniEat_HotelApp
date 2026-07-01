import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, 
  Alert, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius } from '../constants/colors';
import { textStyles } from '../constants/typography';
import { Button, Input, TimePicker } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

const CUISINE_OPTIONS = ['Indian', 'Chinese', 'Italian', 'South Indian', 'Fast Food', 'Beverages', 'Desserts'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface OperatingHours {
  [key: string]: { open: string; close: string; isOpen: boolean };
}

const defaultHours = (): OperatingHours => ({
  monday: { open: '09:00', close: '22:00', isOpen: true },
  tuesday: { open: '09:00', close: '22:00', isOpen: true },
  wednesday: { open: '09:00', close: '22:00', isOpen: true },
  thursday: { open: '09:00', close: '22:00', isOpen: true },
  friday: { open: '09:00', close: '22:00', isOpen: true },
  saturday: { open: '09:00', close: '22:00', isOpen: true },
  sunday: { open: '09:00', close: '22:00', isOpen: false },
});

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  
  // Step tracking
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  
  // Step 1: Account
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 2: Restaurant Info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  
  // Step 3: Operating Hours
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(defaultHours());
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setHeroImage(result.assets[0].uri);
    }
  };

  const validateStep = () => {
    setError('');
    if (step === 1) {
      if (!email || !password || !confirmPassword) {
        setError('Please fill all fields');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    } else if (step === 2) {
      if (!name.trim()) {
        setError('Restaurant name is required');
        return false;
      }
      if (!phone.trim()) {
        setError('Phone number is required');
        return false;
      }
      if (!cuisines.length) {
        setError('Please select at least one cuisine type');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleSignup = async () => {
    if (!validateStep()) return;
    
    setLoading(true);
    setError('');

    const signupData: any = {
      email,
      password,
      name,
      phone: phone || '',
      description: description || '',
      address: address || '',
      cuisines: cuisines.length > 0 ? cuisines : [],
      operatingHours,
    };
    
    if (heroImage) {
      signupData.heroImage = heroImage;
    }
    
    const result = await signup(signupData);
    
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Signup failed');
    }
    
    setLoading(false);
  };

  const toggleDay = (day: string) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], isOpen: !prev[day].isOpen }
    }));
  };

  const updateTime = (day: string, type: 'open' | 'close', time: string) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: time }
    }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.progress}>
            {[1, 2, 3].map(s => (
              <View key={s} style={[styles.progressDot, s <= step && styles.progressDotActive]} />
            ))}
          </View>
          <View style={styles.backButton} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Step 1: Account */}
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>Create Account</Text>
              <Text style={styles.stepSubtitle}>Enter your login credentials</Text>
              
              <Input label="Email" placeholder="restaurant@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Input label="Password" placeholder="Min 6 characters" value={password} onChangeText={setPassword} secureTextEntry textContentType="oneTimeCode" autoComplete="off" />
              <Input label="Confirm Password" placeholder="Re-enter password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry textContentType="oneTimeCode" autoComplete="off" />
            </View>
          )}

          {/* Step 2: Restaurant Info */}
          {step === 2 && (
            <View>
              <Text style={styles.stepTitle}>Restaurant Details</Text>
              <Text style={styles.stepSubtitle}>Tell customers about your restaurant</Text>
              
              {/* Hero Image */}
              <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
                {heroImage ? (
                  <Image source={{ uri: heroImage }} style={styles.heroImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={32} color={colors.gray400} />
                    <Text style={styles.imageText}>Add Cover Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <Input label="Restaurant Name" placeholder="e.g., Campus Cafe" value={name} onChangeText={setName} autoCapitalize="words" />
              <Input label="Phone Number" placeholder="+91 98765 43210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Input label="Address" placeholder="Location on campus" value={address} onChangeText={setAddress} />
              <Input label="Description" placeholder="What makes your food special?" value={description} onChangeText={setDescription} multiline numberOfLines={3} />
              
              {/* Cuisine Selection - Multiple */}
              <Text style={styles.label}>Cuisine Types (select multiple)</Text>
              <View style={styles.cuisineGrid}>
                {CUISINE_OPTIONS.map(c => {
                  const isSelected = cuisines.includes(c);
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.cuisineChip, isSelected && styles.cuisineChipActive]}
                      onPress={() => {
                        if (isSelected) {
                          setCuisines(cuisines.filter(x => x !== c));
                        } else {
                          setCuisines([...cuisines, c]);
                        }
                      }}
                    >
                      {isSelected && <Ionicons name="checkmark" size={14} color={colors.primaryDark} style={{ marginRight: 4 }} />}
                      <Text style={[styles.cuisineText, isSelected && styles.cuisineTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Step 3: Operating Hours */}
          {step === 3 && (
            <View>
              <Text style={styles.stepTitle}>Operating Hours</Text>
              <Text style={styles.stepSubtitle}>When is your restaurant open?</Text>
              
              {DAYS.map((day, i) => (
                <View key={day} style={styles.dayRow}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
                    <Switch
                      value={operatingHours[day].isOpen}
                      onValueChange={() => toggleDay(day)}
                      trackColor={{ false: colors.gray300, true: colors.successLight }}
                      thumbColor={operatingHours[day].isOpen ? colors.success : colors.gray400}
                    />
                  </View>
                  {operatingHours[day].isOpen && (
                    <View style={styles.timeRow}>
                      <TimePicker 
                        value={operatingHours[day].open} 
                        onChange={(t) => updateTime(day, 'open', t)} 
                        label="Opens"
                      />
                      <Text style={styles.timeSeparator}>to</Text>
                      <TimePicker 
                        value={operatingHours[day].close} 
                        onChange={(t) => updateTime(day, 'close', t)} 
                        label="Closes"
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {step < totalSteps ? (
            <Button title="Continue" onPress={nextStep} size="large" />
          ) : (
            <Button title="Create Restaurant" onPress={handleSignup} loading={loading} size="large" />
          )}
          
          {step === 1 && (
            <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
              <Text style={styles.loginText}>Already have an account? <Text style={styles.loginBold}>Log in</Text></Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  progress: { flexDirection: 'row', gap: spacing.sm },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray300 },
  progressDotActive: { backgroundColor: colors.primary, width: 24 },
  scrollContent: { padding: spacing.xl, paddingBottom: 120 },
  stepTitle: { ...textStyles.h1, color: colors.textPrimary, marginBottom: spacing.xs },
  stepSubtitle: { ...textStyles.body, color: colors.textSecondary, marginBottom: spacing.xxl },
  imageUpload: { marginBottom: spacing.xl, borderRadius: borderRadius.xl, overflow: 'hidden' },
  heroImage: { width: '100%', height: 160, borderRadius: borderRadius.xl },
  imagePlaceholder: { width: '100%', height: 160, backgroundColor: colors.gray100, borderRadius: borderRadius.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.gray200, borderStyle: 'dashed' },
  imageText: { ...textStyles.label, color: colors.gray500, marginTop: spacing.sm },
  label: { ...textStyles.label, color: colors.textPrimary, marginBottom: spacing.sm },
  cuisineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  cuisineChip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full, backgroundColor: colors.gray100 },
  cuisineChipActive: { backgroundColor: colors.primaryLight },
  cuisineText: { ...textStyles.labelSmall, color: colors.textSecondary },
  cuisineTextActive: { color: colors.primaryDark },
  dayRow: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayLabel: { ...textStyles.label, color: colors.textPrimary },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  timeSeparator: { ...textStyles.body, color: colors.textSecondary },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.errorLight, padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.lg },
  errorText: { ...textStyles.bodySmall, color: colors.error, marginLeft: spacing.sm },
  footer: { padding: spacing.xl, paddingBottom: spacing.xxxl, borderTopWidth: 1, borderTopColor: colors.gray100, backgroundColor: colors.white },
  loginLink: { alignItems: 'center', marginTop: spacing.lg },
  loginText: { ...textStyles.body, color: colors.textSecondary },
  loginBold: { color: colors.primary, fontWeight: '600' },
});
