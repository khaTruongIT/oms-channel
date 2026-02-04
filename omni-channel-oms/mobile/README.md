# OMS Mobile - React Native App

Ứng dụng mobile cho hệ thống Omni-Channel Order Management System, hỗ trợ iOS và Android.

## 🎨 Design System

- **Style**: Flat Design (minimalist, professional, clean)
- **Colors**: Purple (#7C3AED) + Orange (#F97316)
- **Typography**: Plus Jakarta Sans
- **Platform**: iOS + Android (React Native)

## 📱 Features

- ✅ Role-based access control (Owner, Warehouse Manager, Sales Staff)
- ✅ Dashboard với widgets tùy chỉnh theo role
- ✅ Quản lý đơn hàng (xem, filter, cập nhật trạng thái)
- ✅ Quản lý sản phẩm (CRUD operations)
- ✅ Quản lý tồn kho (xem, điều chỉnh số lượng)
- ✅ Push notifications cho đơn hàng mới
- ✅ Pull-to-refresh
- ✅ Offline-ready với AsyncStorage

## 🏗️ Tech Stack

- **Framework**: React Native 0.76.6
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: Redux Toolkit
- **API Client**: Axios
- **Storage**: AsyncStorage
- **Push Notifications**: Firebase Cloud Messaging
- **Icons**: React Native Vector Icons (Ionicons)

## 📁 Project Structure

````
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # Screen components
│   │   ├── auth/           # Login, Register
│   │   ├── orders/         # Orders list, details
│   │   ├── products/       # Products list, details
│   │   └── inventory/      # Inventory list, adjust
│   ├── navigation/          # Navigation setup
│   ├── services/            # API services
│   │   ├── api.ts          # Axios instance
│   │   ├── auth.service.ts
│   │   ├── orders.service.ts
│   │   ├── products.service.ts
│   │   └── inventory.service.ts
│   ├── store/               # Redux store
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   └── ordersSlice.ts
│   │   ├── index.ts
│   │   └── hooks.ts
│   ├── theme/               # Design system
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── App.tsx                  # App entry point
├── index.js                 # React Native entry
├── package.json
├── tsconfig.json
├── babel.config.js
└── .env.example

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS dependencies)

### Installation

```bash
# Navigate to mobile directory
cd omni-channel-oms/mobile

# Install dependencies
npm install

# Install iOS pods (macOS only)
cd ios && pod install && cd ..

# Copy environment file
cp .env.example .env
````

### Configuration

Edit `.env` file:

```env
API_BASE_URL=http://localhost:4000

# Firebase configuration (get from Firebase Console)
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### Running the App

```bash
# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on specific iOS device
npm run ios -- --device "iPhone Name"

# Run on specific Android device
npm run android -- --deviceId=device_id
```

## 📚 API Integration

App kết nối với backend API tại `http://localhost:4000` (development).

### Endpoints Used

- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `GET /auth/profile` - Get user profile
- `GET /orders` - Get orders list
- `GET /orders/:id` - Get order details
- `PUT /orders/:id/status` - Update order status
- `GET /products` - Get products list
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /inventory` - Get inventory levels
- `POST /inventory/adjust` - Adjust stock

## 🎯 User Roles & Permissions

### Owner

- Full access to all features
- Dashboard: Total orders, revenue, low stock alerts
- Can create/edit/delete products
- Can update order status
- Can adjust inventory

### Warehouse Manager

- Dashboard: Pending orders, inventory alerts
- Can create/edit products
- Can update order status
- Can adjust inventory
- Cannot delete products

### Sales Staff

- Dashboard: Today's orders, order status overview
- Read-only access to orders
- Read-only access to products
- Cannot modify inventory

## 🔔 Push Notifications

App sử dụng Firebase Cloud Messaging để nhận thông báo real-time khi có đơn hàng mới.

### Setup Firebase

1. Tạo project trên [Firebase Console](https://console.firebase.google.com/)
2. Add iOS app và download `GoogleService-Info.plist`
3. Add Android app và download `google-services.json`
4. Copy files vào:
   - iOS: `ios/GoogleService-Info.plist`
   - Android: `android/app/google-services.json`
5. Update `.env` với Firebase credentials

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (requires Detox setup)
npm run test:e2e
```

## 📦 Building for Production

### iOS

```bash
# Build release version
cd ios
xcodebuild -workspace OMSMobile.xcworkspace -scheme OMSMobile -configuration Release
```

### Android

```bash
# Build APK
cd android
./gradlew assembleRelease

# Build AAB (for Play Store)
./gradlew bundleRelease
```

## 🎨 Design Guidelines

- **Touch Targets**: Minimum 44x44px
- **Spacing**: Minimum 8px between interactive elements
- **Animations**: 150-300ms duration
- **Colors**: Use theme colors from `@theme/colors`
- **Typography**: Use text styles from `@theme/typography`
- **Icons**: Use Ionicons from `react-native-vector-icons`

## 🐛 Troubleshooting

### iOS Build Issues

```bash
# Clean build
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npm run ios
```

### Android Build Issues

```bash
# Clean build
cd android
./gradlew clean
cd ..
npm run android
```

### Metro Bundler Issues

```bash
# Reset cache
npm start -- --reset-cache
```

## 📝 License

UNLICENSED - Private project

## 👥 Support

For issues and questions, please contact the development team.

---

**Built with ❤️ using React Native and TypeScript**
