import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export const uploadImage = async (uri: string, path: string): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Convert URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Create storage reference
    const storageRef = ref(storage, path);
    
    // Upload
    await uploadBytes(storageRef, blob);
    
    // Get download URL
    const url = await getDownloadURL(storageRef);
    
    return { success: true, url };
  } catch (error: any) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
};

export const uploadRestaurantImage = async (restaurantId: string, uri: string, type: 'hero' | 'menu'): Promise<{ success: boolean; url?: string; error?: string }> => {
  const timestamp = Date.now();
  const path = `restaurants/${restaurantId}/${type}_${timestamp}.jpg`;
  return uploadImage(uri, path);
};

export const uploadMenuItemImage = async (restaurantId: string, itemId: string, uri: string): Promise<{ success: boolean; url?: string; error?: string }> => {
  const path = `restaurants/${restaurantId}/menu/${itemId}.jpg`;
  return uploadImage(uri, path);
};
