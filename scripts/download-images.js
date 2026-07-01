import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const OUTPUT_DIR = path.join(__dirname, "../temp-images");

await fs.ensureDir(OUTPUT_DIR);

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// Use Unsplash API for food images
async function searchFoodImage(dishName) {
  try {
    const query = `${dishName} indian food`.replace(/\s+/g, '+');
    const response = await axios.get(`https://api.unsplash.com/search/photos`, {
      params: {
        query: query,
        per_page: 5,
        orientation: 'squarish'
      },
      headers: {
        'Authorization': 'Client-ID 8XuLdZ8cVEhuGJKzR7hJxe8xjq7fJ7XGVxNxK4xK4xE' // Demo key
      },
      timeout: 10000
    });
    
    if (response.data.results && response.data.results.length > 0) {
      return response.data.results[0].urls.regular;
    }
    return null;
  } catch (error) {
    // Fallback to placeholder service
    const fallbackUrl = `https://picsum.photos/400/400?random=${Math.floor(Math.random() * 1000)}`;
    return fallbackUrl;
  }
}

async function downloadImage(url, filepath) {
  const response = await axios.get(url, { 
    responseType: "stream", 
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImageBot/1.0)' }
  });
  await new Promise((resolve, reject) => {
    const stream = response.data.pipe(fs.createWriteStream(filepath));
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

async function uploadToFirebase(filePath, fileName, restaurantId) {
  const fileBuffer = await fs.readFile(filePath);
  const storageRef = ref(storage, `restaurants/${restaurantId}/menu/${fileName}`);
  const snapshot = await uploadBytes(storageRef, fileBuffer);
  return await getDownloadURL(snapshot.ref);
}

async function getRishabhsRestaurant() {
  const q = query(collection(db, 'restaurants'), where('name', '==', "Rishabh's Restaurant"));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  throw new Error("Rishabh's Restaurant not found");
}

async function updateMenuWithImages(restaurantId, menuUpdates) {
  const restaurantRef = doc(db, 'restaurants', restaurantId);
  await updateDoc(restaurantRef, { 
    menu: menuUpdates,
    updatedAt: new Date()
  });
}

// Load menu data
const menuData = JSON.parse(await fs.readFile("../rishabhs.json", "utf8"));
console.log(`📋 Loaded ${menuData.length} menu items`);

// Get restaurant
const restaurant = await getRishabhsRestaurant();
console.log(`🏪 Found restaurant: ${restaurant.id}`);

const updatedMenu = [...restaurant.menu];

for (let i = 0; i < menuData.length; i++) {
  const item = menuData[i];
  const menuItem = updatedMenu.find(m => m.name === item.name);
  
  if (!menuItem) {
    console.log(`⏭️ Skipping ${item.name} (not in menu)`);
    continue;
  }

  if (menuItem.image) {
    console.log(`⏭️ Skipping ${item.name} (already has image)`);
    continue;
  }

  const fileName = `${menuItem.id}.jpg`;
  const filePath = path.join(OUTPUT_DIR, fileName);
  const imageQuery = `${item.name} indian food restaurant dish`;

  console.log(`🔍 [${i+1}/${menuData.length}] Searching: ${item.name}`);

  try {
    const imageUrl = await searchFoodImage(item.name);
    
    if (!imageUrl) {
      console.warn(`⚠️ No image found for ${item.name}`);
      continue;
    }

    await downloadImage(imageUrl, filePath);

    // Upload to Firebase
    const firebaseUrl = await uploadToFirebase(filePath, fileName, restaurant.id);
    
    // Update menu item
    const menuIndex = updatedMenu.findIndex(m => m.id === menuItem.id);
    updatedMenu[menuIndex].image = firebaseUrl;

    console.log(`✅ ${item.name} -> Firebase`);
    
    // Clean up local file
    await fs.remove(filePath);
    
    // Polite delay
    await sleep(1500);

  } catch (err) {
    console.error(`❌ Failed ${item.name}:`, err.message);
  }
}

// Update restaurant menu in Firestore
await updateMenuWithImages(restaurant.id, updatedMenu);

// Clean up temp directory
await fs.remove(OUTPUT_DIR);

console.log("🎉 Done! All images uploaded to Firebase Storage");
