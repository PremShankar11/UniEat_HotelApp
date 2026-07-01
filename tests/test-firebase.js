// Test script to verify Firebase connection and database operations
// Run with: node tests/test-firebase.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyD2rzfb7lI0t8wSbuLrCUi_HkFZ9dmf6w8',
  authDomain: 'foodapp3076.firebaseapp.com',
  projectId: 'foodapp3076',
  storageBucket: 'foodapp3076.firebasestorage.app',
  messagingSenderId: '877601519014',
  appId: '1:877601519014:web:f7174884c9355b76770b67'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'foood');

async function testConnection() {
  console.log('Testing Firebase connection...\n');

  try {
    // Test 1: Fetch restaurants
    console.log('1. Fetching restaurants...');
    const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
    console.log(`   Found ${restaurantsSnapshot.size} restaurant(s)`);
    
    restaurantsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name} (ID: ${doc.id})`);
      console.log(`     Menu items: ${data.menu?.length || 0}`);
      console.log(`     Owner ID: ${data.owner_id}`);
    });

    // Test 2: Fetch orders
    console.log('\n2. Fetching orders...');
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    console.log(`   Found ${ordersSnapshot.size} order(s)`);
    
    ordersSnapshot.docs.slice(0, 3).forEach(doc => {
      const data = doc.data();
      console.log(`   - Order #${data.orderNumber} - ${data.status} - ₹${data.totalAmount}`);
    });

    // Test 3: Fetch customers
    console.log('\n3. Fetching customers...');
    const customersSnapshot = await getDocs(collection(db, 'customers'));
    console.log(`   Found ${customersSnapshot.size} customer(s)`);

    console.log('\n✅ All tests passed! Firebase connection is working.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

testConnection();
