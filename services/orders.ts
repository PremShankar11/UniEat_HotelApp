import { 
  collection, 
  doc, 
  updateDoc, 
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isVeg?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurantName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  createdAt: any;
  updatedAt: any;
}

export const getOrders = async (restaurantId: string) => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
    return { success: true, data: orders };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getOrder = async (orderId: string) => {
  try {
    const docRef = doc(db, 'orders', orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } as Order };
    }
    return { success: false, error: 'Order not found' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Real-time orders listener
export const subscribeToOrders = (
  restaurantId: string, 
  callback: (orders: Order[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'orders'),
    where('restaurantId', '==', restaurantId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
    callback(orders);
  });
};

// Get today's orders stats
export const getTodayStats = async (restaurantId: string) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await getOrders(restaurantId);
    if (!result.success || !result.data) {
      return { success: false, error: result.error };
    }
    
    const todayOrders = result.data.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt);
      return orderDate >= today;
    });
    
    // Revenue = sum of totalAmount from orders that are paid
    const paidOrders = todayOrders.filter(o => o.paymentStatus === 'paid');
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const completedOrders = todayOrders.filter(o => o.status === 'completed');
    const pendingOrders = todayOrders.filter(o => 
      ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
    );
    
    return {
      success: true,
      data: {
        totalOrders: todayOrders.length,
        completedOrders: completedOrders.length,
        pendingOrders: pendingOrders.length,
        totalRevenue
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
