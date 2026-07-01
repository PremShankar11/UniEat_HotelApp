const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = require('firebase/firestore');
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app, 'foood');

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

function getSearchTerm(dishName, category) {
  const lower = dishName.toLowerCase();
  if (lower.includes('biryani') || lower.includes('pulao')) return 'biryani';
  if (lower.includes('dosa')) return 'dosa';
  if (lower.includes('idli')) return 'idli';
  if (lower.includes('parotta') || lower.includes('paratha')) return 'paratha';
  if (lower.includes('noodles')) return 'noodles';
  if (lower.includes('fried rice')) return 'fried-rice';
  if (lower.includes('paneer')) return 'paneer';
  if (lower.includes('chicken')) return 'chicken-curry';
  if (lower.includes('egg') || lower.includes('omelette')) return 'egg';
  if (lower.includes('coffee')) return 'coffee';
  if (lower.includes('tea')) return 'tea';
  if (lower.includes('juice')) return 'juice';
  if (lower.includes('lassi') || lower.includes('milkshake')) return 'milkshake';
  if (lower.includes('samosa')) return 'samosa';
  if (lower.includes('maggi')) return 'noodles';
  if (lower.includes('chapathi')) return 'roti';
  if (lower.includes('gobi')) return 'cauliflower';
  if (lower.includes('mushroom')) return 'mushroom';
  if (lower.includes('gravy') || lower.includes('masala') || lower.includes('curry')) return 'curry';
  if (lower.includes('rice')) return 'rice';
  if (category?.toLowerCase().includes('beverage')) return 'beverage';
  return 'indian-food';
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const makeRequest = (requestUrl, redirectCount = 0) => {
      if (redirectCount > 5) {
        reject(new Error('Too many redirects'));
        return;
      }
      const urlObj = new URL(requestUrl);
      https.get({
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          makeRequest(res.headers.location, redirectCount + 1);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    };
    makeRequest(url);
  });
}

async function uploadToFirebase(buffer, fileName, restaurantId) {
  const storageRef = ref(storage, `restaurants/${restaurantId}/menu/${fileName}`);
  const snapshot = await uploadBytes(storageRef, buffer, { contentType: 'image/jpeg' });
  return await getDownloadURL(snapshot.ref);
}

async function getRishabhsRestaurant() {
  const q = query(collection(db, 'restaurants'), where('name', '==', "Rishabh's Restaurant"));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }
  throw new Error("Rishabh's Restaurant not found");
}

async function main() {
  const fs = require('fs');
  const restaurant = await getRishabhsRestaurant();
  console.log(`🏪 Restaurant: ${restaurant.id} (${restaurant.menu.length} items)`);

  const updatedMenu = [...restaurant.menu];
  let success = 0, skip = 0;

  for (let i = 0; i < updatedMenu.length; i++) {
    const item = updatedMenu[i];
    
    if (item.image) { skip++; continue; }

    const term = getSearchTerm(item.name, item.category);
    // Unsplash Source - no API key needed, returns actual food images
    const url = `https://source.unsplash.com/400x400/?${term},food`;
    
    process.stdout.write(`[${i+1}/${updatedMenu.length}] ${item.name}... `);

    try {
      const buffer = await downloadImage(url);
      const firebaseUrl = await uploadToFirebase(buffer, `${item.id}.jpg`, restaurant.id);
      updatedMenu[i].image = firebaseUrl;
      success++;
      console.log('✅');
      await sleep(1000); // Unsplash rate limit
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }

  await updateDoc(doc(db, 'restaurants', restaurant.id), { menu: updatedMenu, updatedAt: new Date() });
  console.log(`\n🎉 Done! ${success} uploaded, ${skip} skipped`);
}

main().catch(console.error);
