const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, orderBy, limit } = require('firebase/firestore');
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'foood');

async function getRecentOrders() {
  try {
    console.log('=== RECENT ORDERS ===');
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(10));
    const ordersSnap = await getDocs(q);
    
    ordersSnap.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      
      console.log(`\nOrder: ${data.orderNumber}`);
      console.log(`Date: ${createdAt.toLocaleString()}`);
      console.log(`Restaurant: ${data.restaurantName}`);
      console.log(`Customer: ${data.customerName} (${data.customerEmail})`);
      console.log(`Status: ${data.status} | Payment: ${data.paymentStatus}`);
      console.log(`Amount: ₹${data.totalAmount}`);
      console.log(`Items: ${data.items?.length || 0}`);
      
      if (data.items?.length > 0) {
        data.items.slice(0, 2).forEach(item => {
          console.log(`  - ${item.name} x${item.quantity} = ₹${item.price * item.quantity}`);
        });
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getRecentOrders();
