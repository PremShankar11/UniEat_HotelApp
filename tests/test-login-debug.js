// Test script to debug login and restaurant fetching
// Run with: node tests/test-login-debug.js

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, getDocs, query, where, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyD2rzfb7lI0t8wSbuLrCUi_HkFZ9dmf6w8',
  authDomain: 'foodapp3076.firebaseapp.com',
  projectId: 'foodapp3076',
  storageBucket: 'foodapp3076.firebasestorage.app',
  messagingSenderId: '877601519014',
  appId: '1:877601519014:web:f7174884c9355b76770b67'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, 'foood');

async function debugLogin() {
  console.log('=== DEBUG LOGIN TEST ===\n');

  try {
    // Step 1: Login with the credentials
    console.log('1. Attempting login with abc@qwe.com...');
    const userCredential = await signInWithEmailAndPassword(auth, 'abc@qwe.com', '123456');
    const user = userCredential.user;
    console.log('   ✅ Login successful!');
    console.log(`   User UID: ${user.uid}`);
    console.log(`   Email: ${user.email}`);

    // Step 2: Check all restaurants and their owner_ids
    console.log('\n2. Fetching ALL restaurants to see owner_id field...');
    const allRestaurants = await getDocs(collection(db, 'restaurants'));
    console.log(`   Found ${allRestaurants.size} restaurant(s):\n`);
    
    allRestaurants.forEach(doc => {
      const data = doc.data();
      console.log(`   Restaurant: ${data.name}`);
      console.log(`   - Doc ID: ${doc.id}`);
      console.log(`   - owner_id: ${data.owner_id || 'NOT SET'}`);
      console.log(`   - ownerId: ${data.ownerId || 'NOT SET'}`);
      console.log(`   - Menu items: ${data.menu?.length || 0}`);
      console.log('');
    });

    // Step 3: Try to find restaurant by owner_id
    console.log(`3. Searching for restaurant with owner_id = "${user.uid}"...`);
    const q = query(collection(db, 'restaurants'), where('owner_id', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('   ❌ No restaurant found with owner_id matching this user!');
      
      // Try ownerId instead
      console.log(`\n4. Trying with "ownerId" field instead...`);
      const q2 = query(collection(db, 'restaurants'), where('ownerId', '==', user.uid));
      const querySnapshot2 = await getDocs(q2);
      
      if (querySnapshot2.empty) {
        console.log('   ❌ No restaurant found with ownerId either!');
      } else {
        console.log('   ✅ Found restaurant with ownerId!');
        querySnapshot2.forEach(doc => {
          console.log(`   Restaurant: ${doc.data().name} (ID: ${doc.id})`);
        });
      }
    } else {
      console.log('   ✅ Found restaurant!');
      querySnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   Restaurant: ${data.name}`);
        console.log(`   Doc ID: ${doc.id}`);
        console.log(`   Menu items: ${data.menu?.length || 0}`);
      });
    }

    // Step 5: Check orders
    console.log('\n5. Checking orders collection...');
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    console.log(`   Total orders in database: ${ordersSnapshot.size}`);
    
    // Show unique restaurantIds in orders
    const restaurantIds = new Set();
    ordersSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.restaurantId) restaurantIds.add(data.restaurantId);
    });
    console.log(`   Unique restaurantIds in orders: ${Array.from(restaurantIds).join(', ')}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   Code:', error.code);
  }

  process.exit(0);
}

debugLogin();
