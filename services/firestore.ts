import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

// Helper to remove undefined values from objects
const removeUndefined = <T extends object>(obj: T): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
};

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  isVeg: boolean;
  isAvailable: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OperatingHours {
  [key: string]: {
    open: string;
    close: string;
    isOpen: boolean;
  };
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  ownerId?: string;
  owner_id?: string;  // Legacy field
  phone?: string;
  address?: string;
  cuisines?: string[];
  heroImage?: string;
  gallery?: string[];
  operatingHours?: OperatingHours;
  menu?: MenuItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Restaurant operations
export const createRestaurant = async (restaurantData: Partial<Restaurant>) => {
  try {
    const cleanData = removeUndefined(restaurantData);
    const docRef = await addDoc(collection(db, 'restaurants'), {
      ...cleanData,
      menu: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getRestaurantByOwnerId = async (ownerId: string) => {
  try {
    // Try ownerId first (used by existing restaurants)
    let q = query(
      collection(db, 'restaurants'),
      where('ownerId', '==', ownerId)
    );
    let querySnapshot = await getDocs(q);
    
    // Fallback to owner_id if not found
    if (querySnapshot.empty) {
      q = query(
        collection(db, 'restaurants'),
        where('owner_id', '==', ownerId)
      );
      querySnapshot = await getDocs(q);
    }
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Restaurant not found for this owner' };
    }
    
    const doc = querySnapshot.docs[0];
    return { success: true, data: { id: doc.id, ...doc.data() } as Restaurant };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getRestaurant = async (restaurantId: string) => {
  try {
    const docRef = doc(db, 'restaurants', restaurantId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } as Restaurant };
    }
    return { success: false, error: 'Restaurant not found' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateRestaurant = async (restaurantId: string, updates: Partial<Restaurant>) => {
  try {
    const cleanUpdates = removeUndefined(updates);
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(restaurantRef, {
      ...cleanUpdates,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Menu operations
export const getMenuItems = async (restaurantId: string) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);
    
    if (!restaurantDoc.exists()) {
      return { success: false, error: 'Restaurant not found' };
    }
    
    const menu = restaurantDoc.data().menu || [];
    return { success: true, data: menu as MenuItem[] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const createMenuItem = async (restaurantId: string, menuItemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);
    
    if (!restaurantDoc.exists()) {
      return { success: false, error: 'Restaurant not found' };
    }
    
    const cleanData = removeUndefined(menuItemData);
    const currentMenu = restaurantDoc.data().menu || [];
    const newMenuItem: MenuItem = {
      id: Date.now().toString(),
      name: '',
      price: 0,
      category: '',
      isVeg: true,
      isAvailable: true,
      ...cleanData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await updateDoc(restaurantRef, {
      menu: [...currentMenu, newMenuItem],
      updatedAt: new Date()
    });
    
    return { success: true, id: newMenuItem.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateMenuItem = async (restaurantId: string, itemId: string, updates: Partial<MenuItem>) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);
    
    if (!restaurantDoc.exists()) {
      return { success: false, error: 'Restaurant not found' };
    }
    
    const cleanUpdates = removeUndefined(updates);
    
    const currentMenu = restaurantDoc.data().menu || [];
    const updatedMenu = currentMenu.map((item: MenuItem) => 
      item.id === itemId 
        ? { ...item, ...cleanUpdates, updatedAt: new Date() }
        : item
    );
    
    await updateDoc(restaurantRef, {
      menu: updatedMenu,
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateMenuItemAvailability = async (restaurantId: string, itemId: string, isAvailable: boolean) => {
  return updateMenuItem(restaurantId, itemId, { isAvailable });
};

export const deleteMenuItem = async (restaurantId: string, itemId: string) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);
    
    if (!restaurantDoc.exists()) {
      return { success: false, error: 'Restaurant not found' };
    }
    
    const currentMenu = restaurantDoc.data().menu || [];
    const updatedMenu = currentMenu.filter((item: MenuItem) => item.id !== itemId);
    
    await updateDoc(restaurantRef, {
      menu: updatedMenu,
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateOperatingHours = async (restaurantId: string, operatingHours: OperatingHours) => {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    await updateDoc(restaurantRef, {
      operatingHours,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
