import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface Review {
  id?: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  username: string;
  restaurantId: string;
  restaurantName: string;
  rating: number;
  description: string;
  photoUrl?: string;
  items: { name: string; quantity: number }[];
  createdAt: Date;
  updatedAt: Date;
}

export const getReviewsByRestaurant = async (restaurantId: string, filters?: { rating?: number; sortBy?: 'recent' | 'oldest' }) => {
  try {
    let q;
    
    if (filters?.rating) {
      q = query(
        collection(db, 'reviews'),
        where('restaurantId', '==', restaurantId),
        where('rating', '==', filters.rating),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'reviews'),
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', filters?.sortBy === 'oldest' ? 'asc' : 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: reviews as Review[] };
  } catch (error: any) {
    console.log('getReviewsByRestaurant error:', error.message);
    // Fallback: try without orderBy if index doesn't exist
    try {
      const fallbackQuery = query(
        collection(db, 'reviews'),
        where('restaurantId', '==', restaurantId)
      );
      const snapshot = await getDocs(fallbackQuery);
      let reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
      
      // Sort in memory
      reviews.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date();
        const dateB = b.createdAt instanceof Date ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date();
        return dateB.getTime() - dateA.getTime();
      });
      
      // Filter by rating in memory if needed
      if (filters?.rating) {
        reviews = reviews.filter(r => r.rating === filters.rating);
      }
      
      return { success: true, data: reviews };
    } catch (fallbackError: any) {
      return { success: false, error: fallbackError.message, data: [] };
    }
  }
};

export const getRestaurantStats = async (restaurantId: string) => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('restaurantId', '==', restaurantId)
    );
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => doc.data());
    
    const reviewCount = reviews.length;
    let avgRating = 0;
    
    if (reviewCount > 0) {
      const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      avgRating = Math.round((sum / reviewCount) * 10) / 10;
    }
    
    // Count by rating
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingCounts[r.rating]++;
      }
    });
    
    return { success: true, data: { avgRating, reviewCount, ratingCounts } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
