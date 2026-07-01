const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');
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

async function getDetailedRestaurantData() {
  try {
    const restaurantsSnap = await getDocs(collection(db, 'restaurants'));
    
    for (const docSnap of restaurantsSnap.docs) {
      const data = docSnap.data();
      console.log(`\n=== RESTAURANT: ${data.name} ===`);
      console.log(`ID: ${docSnap.id}`);
      console.log(`Owner ID: ${data.ownerId || data.owner_id}`);
      console.log(`Phone: ${data.phone || 'Not set'}`);
      console.log(`Address: ${data.address || 'Not set'}`);
      
      if (data.operatingHours) {
        console.log('Operating Hours:');
        Object.entries(data.operatingHours).forEach(([day, hours]) => {
          console.log(`  ${day}: ${hours.isOpen ? `${hours.open}-${hours.close}` : 'Closed'}`);
        });
      }
      
      console.log(`\nMenu (${data.menu?.length || 0} items):`);
      if (data.menu?.length > 0) {
        const categories = [...new Set(data.menu.map(item => item.category))];
        console.log(`Categories: ${categories.join(', ')}`);
        
        categories.slice(0, 2).forEach(category => {
          const categoryItems = data.menu.filter(item => item.category === category);
          console.log(`\n${category} (${categoryItems.length} items):`);
          categoryItems.slice(0, 3).forEach(item => {
            console.log(`  - ${item.name}: ₹${item.price} ${item.isVeg ? '🟢' : '🔴'}`);
          });
        });
      }
      console.log('\n' + '='.repeat(50));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getDetailedRestaurantData();
