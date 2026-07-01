import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { getRestaurantByOwnerId, createRestaurant, updateRestaurant, Restaurant, OperatingHours } from '../services/firestore';
import { uploadRestaurantImage } from '../services/storage';

interface SignupData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  description?: string;
  address?: string;
  cuisines?: string[];
  heroImage?: string;
  operatingHours?: OperatingHours;
}

interface AuthContextType {
  user: User | null;
  restaurant: Restaurant | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshRestaurant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRestaurant = async (userId: string) => {
    const result = await getRestaurantByOwnerId(userId);
    if (result.success && result.data) {
      setRestaurant(result.data);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchRestaurant(user.uid);
      } else {
        setRestaurant(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await fetchRestaurant(result.user.uid);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Create restaurant document first
      const restaurantResult = await createRestaurant({
        name: data.name,
        ownerId: result.user.uid,
        phone: data.phone,
        description: data.description,
        address: data.address,
        cuisines: data.cuisines || [],
        operatingHours: data.operatingHours || {
          monday: { open: '09:00', close: '22:00', isOpen: true },
          tuesday: { open: '09:00', close: '22:00', isOpen: true },
          wednesday: { open: '09:00', close: '22:00', isOpen: true },
          thursday: { open: '09:00', close: '22:00', isOpen: true },
          friday: { open: '09:00', close: '22:00', isOpen: true },
          saturday: { open: '09:00', close: '22:00', isOpen: true },
          sunday: { open: '09:00', close: '22:00', isOpen: false },
        }
      });
      
      if (!restaurantResult.success || !restaurantResult.id) {
        return { success: false, error: restaurantResult.error };
      }

      // Upload hero image if provided
      if (data.heroImage) {
        const uploadResult = await uploadRestaurantImage(restaurantResult.id, data.heroImage, 'hero');
        if (uploadResult.success && uploadResult.url) {
          await updateRestaurant(restaurantResult.id, { heroImage: uploadResult.url });
        }
      }
      
      await fetchRestaurant(result.user.uid);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setRestaurant(null);
  };

  const refreshRestaurant = async () => {
    if (user) {
      await fetchRestaurant(user.uid);
    }
  };

  return (
    <AuthContext.Provider value={{ user, restaurant, loading, login, signup, logout, refreshRestaurant }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
