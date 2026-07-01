const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, getDocs, query, where, deleteDoc, doc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');
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
const auth = getAuth(app);
const db = getFirestore(app, 'foood');

// Restaurant owner credentials
const OWNER_EMAIL = 'rishabh@restaurant.com';
const OWNER_PASSWORD = 'Rishabh123!';

async function seedRishabhsRestaurant() {
  try {
    let ownerId;

    // Try to sign in first, if fails create new account
    try {
      console.log('🔑 Signing in existing account...');
      const userCredential = await signInWithEmailAndPassword(auth, OWNER_EMAIL, OWNER_PASSWORD);
      ownerId = userCredential.user.uid;
      console.log(`✅ Signed in with ID: ${ownerId}`);
      
      // Delete existing restaurant for this owner
      console.log('🗑️ Deleting existing restaurant...');
      const q = query(collection(db, 'restaurants'), where('ownerId', '==', ownerId));
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, 'restaurants', docSnap.id));
        console.log(`Deleted restaurant: ${docSnap.id}`);
      }
    } catch (signInError) {
      console.log('🔥 Creating new account...');
      const userCredential = await createUserWithEmailAndPassword(auth, OWNER_EMAIL, OWNER_PASSWORD);
      ownerId = userCredential.user.uid;
      console.log(`✅ Created account with ID: ${ownerId}`);
    }

    // Load menu data
    const menuPath = path.join(__dirname, '../rishabhs.json');
    const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
    console.log(`📋 Loaded ${menuData.length} menu items`);

    // Transform menu items to match database structure (keep original categories)
    const menu = menuData.map((item, index) => ({
      id: (Date.now() + index).toString(),
      name: item.name,
      price: item.price,
      category: item.category,
      isVeg: item.isVeg,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Operating hours (open daily 6 AM to 11 PM)
    const operatingHours = {
      monday: { open: '06:00', close: '23:00', isOpen: true },
      tuesday: { open: '06:00', close: '23:00', isOpen: true },
      wednesday: { open: '06:00', close: '23:00', isOpen: true },
      thursday: { open: '06:00', close: '23:00', isOpen: true },
      friday: { open: '06:00', close: '23:00', isOpen: true },
      saturday: { open: '06:00', close: '23:00', isOpen: true },
      sunday: { open: '06:00', close: '23:00', isOpen: true }
    };

    // Create restaurant
    console.log('🏪 Creating restaurant...');
    const restaurantData = {
      name: "Rishabh's Restaurant",
      description: "Authentic South Indian cuisine with a variety of delicious dishes",
      ownerId: ownerId,
      phone: '+91 9876543210',
      address: 'MG Road, Bangalore, Karnataka 560001',
      cuisines: ['South Indian', 'North Indian', 'Chinese', 'Beverages'],
      operatingHours: operatingHours,
      menu: menu,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'restaurants'), restaurantData);
    console.log(`✅ Restaurant created with ID: ${docRef.id}`);

    // Summary
    const categories = [...new Set(menu.map(item => item.category))];
    console.log('\n🎉 SEEDING COMPLETE!');
    console.log('='.repeat(50));
    console.log(`Restaurant: Rishabh's Restaurant`);
    console.log(`Restaurant ID: ${docRef.id}`);
    console.log(`Owner ID: ${ownerId}`);
    console.log(`Menu Items: ${menu.length}`);
    console.log(`Categories: ${categories.length}`);
    console.log(`Categories: ${categories.join(', ')}`);
    console.log('='.repeat(50));
    console.log('LOGIN CREDENTIALS:');
    console.log(`Email: ${OWNER_EMAIL}`);
    console.log(`Password: ${OWNER_PASSWORD}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'auth/email-already-in-use') {
      console.log('💡 Email already exists. Use existing credentials to login.');
    }
  }
}

seedRishabhsRestaurant();
