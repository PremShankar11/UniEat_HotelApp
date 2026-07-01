# HotelApp - Restaurant Management Platform

A modern, full-featured restaurant management and ordering platform built with React Native and Expo. HotelApp enables restaurant owners to manage their menus, process orders, collect reviews, and engage with customers seamlessly across iOS, Android, and Web.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the App](#running-the-app)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

HotelApp is a comprehensive restaurant management system that bridges the gap between restaurant owners and their customers. The platform provides:

- **For Restaurant Owners**: Complete control over menu management, order processing, customer reviews, and restaurant information
- **For Customers**: Easy browsing of menus, placing orders, tracking delivery, and sharing reviews
- **Cross-Platform**: Native support for iOS, Android, and Web platforms

The app leverages Firebase for backend services, including authentication, real-time database operations, and cloud storage.

---

## Tech Stack

### Frontend Framework
- **React Native** (v0.81.5) - Cross-platform mobile development
- **Expo** (v54.0.30) - React Native framework and development environment
- **Expo Router** (v6.0.21) - File-based routing for React Native

### Language & Type Safety
- **TypeScript** (~5.9.2) - Static type checking for JavaScript
- **React** (19.1.0) - UI library for component-based development

### Navigation & UI
- **React Native Screens** (~4.16.0) - Native navigation components
- **React Native Gesture Handler** (~2.28.0) - Advanced gesture handling
- **React Native Reanimated** (~4.1.1) - Powerful animation library
- **React Native Safe Area Context** (~5.6.0) - Safe area management

### Backend & Data
- **Firebase** (^12.7.0) - Backend services including:
  - Firebase Authentication (email/password)
  - Firestore - Real-time NoSQL database
  - Firebase Storage - Image and file management

### Native Modules
- **Expo Audio** (~1.1.1) - Audio playback (for order notifications)
- **Expo Image Picker** (~17.0.10) - Camera and gallery access
- **Expo File System** (~19.0.21) - File system operations
- **Expo Haptics** (~15.0.8) - Haptic feedback
- **Expo Font** (~14.0.10) - Custom font support
- **Expo Asset** (~12.0.12) - Asset management
- **Expo Constants** (~18.0.12) - App constants and configuration

### Storage
- **AsyncStorage** (2.2.0) - Local device storage for authentication tokens and user preferences

### Fonts
- **@expo-google-fonts/inter** (^0.2.3) - Inter font family from Google Fonts

---

## Features Implemented

### Authentication & Account Management
- **User Registration** - Create new restaurant owner accounts with email and password
- **Login System** - Secure authentication with Firebase
- **Session Management** - Auto-login on app launch, logout functionality
- **Profile Management** - View and edit restaurant details

### Menu Management
- **Add Menu Items** - Create new dishes with name, description, price, and images
- **Edit Menu Items** - Modify existing menu items and details
- **Delete Menu Items** - Remove items from the menu
- **Image Upload** - Upload high-quality images for menu items
- **Smart Menu Features** - AI-powered menu extraction from images
- **Menu Organization** - Organize items by categories and cuisines

### Orders Management
- **View Orders** - Real-time order list with status tracking
- **Order Details** - View complete order information including items and customer details
- **Order Status** - Track order lifecycle (pending, confirmed, preparing, ready, completed)
- **Status Badges** - Visual indicators for order status
- **Order Notifications** - Audio alerts for new orders using Expo Audio

### Reviews & Ratings
- **Customer Reviews** - View customer feedback and ratings
- **Review Management** - Monitor and respond to reviews
- **Review Analytics** - Analyze customer sentiment and ratings

### Settings
- **Operating Hours** - Set restaurant opening and closing times by day
- **Restaurant Info** - Manage restaurant name, description, address, phone
- **Cuisine Types** - Update restaurant cuisine specialties
- **Hero Image** - Set restaurant showcase image

### UI/UX Features
- **Responsive Design** - Works seamlessly on all device sizes
- **Tabbed Navigation** - Easy switching between menu, orders, and reviews
- **Status Badges** - Visual status indicators for orders
- **Modal Workflows** - Smooth modal presentations for adding items and menus
- **Loading States** - Skeleton loaders for better UX while loading data
- **Custom Components** - Reusable Button, Input, and UI components

---

## Project Structure

```
hotelapp-main/
├── app/                           # Main application screens
│   ├── (tabs)/                    # Tab-based navigation screens
│   │   ├── _layout.tsx           # Tab layout
│   │   ├── index.tsx             # Menu tab
│   │   ├── menu.tsx              # Menu management
│   │   ├── orders.tsx            # Orders management
│   │   └── reviews.tsx           # Reviews management
│   ├── index.tsx                 # App entry point
│   ├── login.tsx                 # Login screen
│   ├── signup.tsx                # Registration screen
│   ├── add-item.tsx              # Add menu item screen
│   ├── edit-item/[id].tsx        # Edit menu item screen
│   ├── settings.tsx              # Settings screen
│   ├── smart-menu.tsx            # AI menu extraction
│   ├── order/[id].tsx            # Order details screen
│   └── _layout.tsx               # Root layout & navigation setup
├── components/                    # Reusable React components
│   ├── menu/                      # Menu-related components
│   │   ├── MenuItemCard.tsx      # Menu item display card
│   │   ├── MenuImageUploader.tsx # Image upload component
│   │   ├── ExtractedMenuReview.tsx # Menu extraction preview
│   │   └── index.ts              # Barrel export
│   ├── orders/                    # Order-related components
│   │   ├── OrderCard.tsx         # Order display card
│   │   ├── StatusBadge.tsx       # Order status indicator
│   │   └── index.ts              # Barrel export
│   └── ui/                        # Generic UI components
│       ├── Button.tsx            # Button component
│       ├── Input.tsx             # Input field component
│       ├── Skeleton.tsx          # Loading skeleton
│       ├── TimePicker.tsx        # Time selection component
│       └── index.ts              # Barrel export
├── services/                      # Business logic & API integration
│   ├── firebase.ts               # Firebase initialization & config
│   ├── firestore.ts              # Firestore database operations
│   ├── storage.ts                # Firebase Storage operations
│   ├── orders.ts                 # Order management logic
│   ├── reviews.ts                # Review management logic
│   ├── menuExtractor.ts          # AI menu extraction from images
│   └── authentication.ts         # Auth helper functions
├── contexts/                      # React Context for state management
│   └── AuthContext.tsx           # Authentication context & provider
├── constants/                     # App-wide constants
│   ├── colors.ts                 # Color palette
│   └── typography.ts             # Typography styles
├── assets/                        # Static assets
│   ├── icon.png                  # App icon
│   ├── splash-icon.png           # Splash screen image
│   ├── adaptive-icon.png         # Android adaptive icon
│   ├── favicon.png               # Web favicon
│   └── orderRing.mp3             # Order notification sound
├── tests/                         # Firebase and integration tests
│   ├── test-firebase.js          # Firebase connection test
│   ├── test-login-debug.js       # Login flow testing
│   ├── seed-rishabhs.js          # Database seeding
│   └── run-all.js                # Test runner script
├── app.json                       # Expo configuration
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript configuration
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Expo CLI** - Install globally with `npm install -g expo-cli`

### For iOS Development
- **Xcode** (macOS only) - [Download](https://developer.apple.com/xcode/)
- **CocoaPods** - Install with `sudo gem install cocoapods`

### For Android Development
- **Android Studio** - [Download](https://developer.android.com/studio)
- **Android SDK** - Configure through Android Studio
- **Java Development Kit (JDK)** - Version 11 or higher

### Firebase Setup
- Firebase account - [Create at firebase.google.com](https://firebase.google.com)
- Firebase project for the app
- Firebase credentials (config file with API keys)

---

## Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/hotelapp-main.git
cd hotelapp-main
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Firebase Configuration

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable the following Firebase services:
   - **Authentication** - Enable Email/Password provider
   - **Firestore Database** - Create a new database
   - **Storage** - Set up storage for images
3. Get your Firebase configuration:
   - Go to Project Settings
   - Copy the Firebase config object
4. Update `services/firebase.ts` with your Firebase credentials:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 4: Environment Variables (Optional)

Create a `.env.local` file in the root directory if needed:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

---

## Running the App

### Start the Development Server

```bash
npm start
# or
yarn start
```

This will open the Expo CLI menu with available options.

### Running on Different Platforms

#### iOS (macOS only)
```bash
npm run ios
```
- Starts the app in the iOS Simulator
- Requires Xcode installed

#### Android
```bash
npm run android
```
- Starts the app in the Android Emulator (ensure it's running)
- Or connects to a physical Android device via USB

#### Web
```bash
npm run web
```
- Starts the app in your default web browser
- Available at `http://localhost:8081`

### Using Expo Go (Easiest for Testing)

1. Install the **Expo Go** app on your physical device
2. Run `npm start`
3. Scan the QR code with Expo Go
4. The app will load on your device

---

## Configuration

### Firestore Database Rules

Set up the following Firestore security rules to protect your data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Restaurants collection
    match /restaurants/{restaurantId} {
      allow read: if true;
      allow create, update: if request.auth.uid == resource.data.ownerId;
      allow delete: if request.auth.uid == resource.data.ownerId;
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.restaurantOwnerId;
    }
    
    // Reviews collection
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
    }
  }
}
```

### App Configuration (app.json)

The `app.json` file contains Expo configuration:
- **name**: App display name
- **slug**: Unique identifier
- **version**: App version number
- **icon**: App icon file
- **splash**: Splash screen configuration
- **plugins**: Expo plugins for native modules

---

## Scripts

The following npm scripts are available:

```bash
# Start development server with menu
npm start

# Run on iOS Simulator (macOS)
npm run ios

# Run on Android Emulator
npm run android

# Run on Web Browser
npm run web

# Build for production
npm run build

# Run tests
npm test
```

---

## Development Workflow

### Adding New Features

1. Create screens in the `app/` directory
2. Create reusable components in `components/`
3. Add business logic in `services/`
4. Use TypeScript for type safety
5. Follow the existing code style and conventions

### Code Organization

- **Screens**: Full-page components in `app/` directory
- **Components**: Reusable UI components in `components/`
- **Services**: API calls and business logic in `services/`
- **Contexts**: Global state management in `contexts/`
- **Constants**: App-wide constants in `constants/`

### TypeScript

The project uses TypeScript for type safety. Ensure proper typing:

```typescript
// Good: Explicitly typed
const fetchRestaurant = async (id: string): Promise<Restaurant | null> => {
  // Implementation
};

// Avoid: Implicit any type
const fetchData = async (id) => {
  // Implementation
};
```

---

## Database Structure

### Firestore Collections

#### `restaurants` Collection
```javascript
{
  id: string,
  name: string,
  ownerId: string,
  description: string,
  address: string,
  phone: string,
  cuisines: string[],
  heroImage: string,
  operatingHours: {
    monday: { open: string, close: string, isOpen: boolean },
    // ... other days
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `orders` Collection
```javascript
{
  id: string,
  restaurantId: string,
  customerId: string,
  items: MenuItem[],
  totalAmount: number,
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed",
  deliveryAddress: string,
  notes: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `reviews` Collection
```javascript
{
  id: string,
  restaurantId: string,
  customerId: string,
  rating: number,
  comment: string,
  createdAt: timestamp
}
```

---

## Troubleshooting

### Common Issues

**Issue: "Cannot find module" errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

**Issue: Expo Go app not connecting**
- Ensure your device is on the same network as your computer
- Check that the development server is running
- Restart Expo CLI with `npm start`

**Issue: Firebase authentication fails**
- Verify Firebase config in `services/firebase.ts`
- Check Firestore rules allow authentication
- Enable Email/Password provider in Firebase Console

**Issue: Android build fails**
- Ensure Android SDK is properly installed
- Run `expo prebuild --clean` to rebuild native modules
- Check Java version: `java -version`

**Issue: iOS build fails (macOS)**
- Run `pod install` in iOS directory
- Clear Xcode build cache: `cmd + shift + K`
- Ensure Xcode Command Line Tools are installed

---

## Security Considerations

1. **Never commit credentials** - Keep Firebase keys in environment variables
2. **Firestore Rules** - Always set proper security rules in Firestore
3. **Authentication** - Use Firebase Authentication for user verification
4. **Storage** - Restrict Firebase Storage access by user ownership
5. **Environment Variables** - Use `.env.local` for sensitive data

---

## Useful Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Expo Router Guide](https://docs.expo.dev/routing/introduction/)

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

**Happy Coding**
