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

async function runAll() {
  try {
    // Get one detailed restaurant
    console.log('=== DETAILED RESTAURANT SAMPLE ===');
    const restaurantsSnap = await getDocs(collection(db, 'restaurants'));
    const mainCanteen = restaurantsSnap.docs.find(doc => doc.data().name === 'Main Canteen');
    
    if (mainCanteen) {
      const data = mainCanteen.data();
      console.log(`Restaurant: ${data.name}`);
      console.log(`Menu items: ${data.menu?.length || 0}`);
      
      if (data.menu?.length > 0) {
        console.log('\nSample menu items:');
        data.menu.slice(0, 5).forEach(item => {
          console.log(`- ${item.name}: ₹${item.price} (${item.category}) ${item.isVeg ? '🟢' : '🔴'}`);
        });
      }
      
      if (data.operatingHours) {
        console.log('\nOperating Hours:');
        Object.entries(data.operatingHours).forEach(([day, hours]) => {
          console.log(`${day}: ${hours.isOpen ? `${hours.open}-${hours.close}` : 'Closed'}`);
        });
      }
    }

    // Get order details
    console.log('\n=== ORDER DETAILS ===');
    const ordersSnap = await getDocs(collection(db, 'orders'));
    const validOrders = ordersSnap.docs.filter(doc => {
      const data = doc.data();
      return data.restaurantName && data.totalAmount;
    });
    
    console.log(`Valid orders: ${validOrders.length}/${ordersSnap.size}`);
    
    if (validOrders.length > 0) {
      const order = validOrders[0].data();
      console.log(`\nSample order:`);
      console.log(`Restaurant: ${order.restaurantName}`);
      console.log(`Customer: ${order.customerName}`);
      console.log(`Items: ${order.items?.length || 0}`);
      console.log(`Total: ₹${order.totalAmount}`);
      console.log(`Status: ${order.status}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

runAll();
