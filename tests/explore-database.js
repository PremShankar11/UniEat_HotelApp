const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
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

async function exploreDatabase() {
  try {
    console.log('=== RESTAURANTS ===');
    const restaurantsSnap = await getDocs(collection(db, 'restaurants'));
    console.log(`Total restaurants: ${restaurantsSnap.size}`);
    
    restaurantsSnap.forEach(doc => {
      const data = doc.data();
      console.log(`\nID: ${doc.id}`);
      console.log(`Name: ${data.name || 'No name'}`);
      console.log(`Owner: ${data.ownerId || data.owner_id || 'No owner'}`);
      console.log(`Menu items: ${data.menu?.length || 0}`);
      if (data.menu?.length > 0) {
        console.log(`Sample items: ${data.menu.slice(0, 3).map(item => item.name).join(', ')}`);
      }
    });

    console.log('\n=== ORDERS ===');
    const ordersSnap = await getDocs(collection(db, 'orders'));
    console.log(`Total orders: ${ordersSnap.size}`);
    
    ordersSnap.docs.slice(0, 5).forEach(doc => {
      const data = doc.data();
      console.log(`\nOrder: ${data.orderNumber || doc.id}`);
      console.log(`Restaurant: ${data.restaurantName}`);
      console.log(`Customer: ${data.customerName}`);
      console.log(`Status: ${data.status}`);
      console.log(`Amount: ₹${data.totalAmount}`);
    });

    console.log('\n=== CUSTOMERS ===');
    const customersSnap = await getDocs(collection(db, 'customers'));
    console.log(`Total customers: ${customersSnap.size}`);
    
    customersSnap.docs.slice(0, 3).forEach(doc => {
      const data = doc.data();
      console.log(`\nCustomer: ${data.name || data.username}`);
      console.log(`Email: ${data.email}`);
      console.log(`Friends: ${data.friends?.length || 0}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

exploreDatabase();
