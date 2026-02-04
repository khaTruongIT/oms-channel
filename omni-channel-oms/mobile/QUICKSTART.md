# 🚀 Quick Start Guide - OMS Mobile App

## Prerequisites

Trước khi bắt đầu, đảm bảo bạn đã cài đặt:

- ✅ Node.js 18+ (hiện tại: v20.18.1)
- ✅ npm hoặc yarn
- ✅ React Native CLI: `npm install -g react-native-cli`
- ✅ Xcode (cho iOS development - macOS only)
- ✅ Android Studio (cho Android development)
- ✅ CocoaPods: `sudo gem install cocoapods`

---

## 📦 Installation Steps

### 1. Navigate to Mobile Directory

```bash
cd omni-channel-oms/mobile
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install iOS Pods (macOS only)

```bash
cd ios
pod install
cd ..
```

### 4. Setup Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

Update `.env` với thông tin backend:

```env
API_BASE_URL=http://localhost:4000

# Firebase (optional - for push notifications)
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

---

## 🏃 Running the App

### Start Metro Bundler

```bash
npm start
```

### Run on iOS Simulator

```bash
npm run ios
```

### Run on Android Emulator

```bash
npm run android
```

### Run on Physical Device

**iOS:**

```bash
npm run ios -- --device "iPhone Name"
```

**Android:**

```bash
# List connected devices
adb devices

# Run on specific device
npm run android -- --deviceId=device_id
```

---

## 🧪 Testing the App

### 1. Start Backend Server

Đảm bảo backend đang chạy tại `http://localhost:4000`:

```bash
cd ../backend
npm run start:dev
```

### 2. Test Authentication Flow

1. **Register**: Tạo tài khoản mới
   - Name: Test User
   - Email: test@example.com
   - Password: password123

2. **Login**: Đăng nhập với tài khoản vừa tạo

3. **Dashboard**: Xem dashboard với statistics và recent orders

### 3. Test Orders Features

1. **View Orders**: Navigate to Orders tab
2. **Search**: Tìm kiếm orders theo order number hoặc customer name
3. **Order Details**: Tap vào order để xem chi tiết
4. **Update Status**: (Owner/Warehouse Manager only)
   - Pending → Processing
   - Processing → Shipped
   - Shipped → Delivered

### 4. Test Pull-to-Refresh

- Kéo xuống ở Dashboard hoặc Orders list để refresh data

---

## 🎨 Design Features

### Color Palette

- **Primary**: Purple (#7C3AED)
- **CTA**: Orange (#F97316)
- **Background**: Light Purple (#FAF5FF)

### Typography

- **Font**: Plus Jakarta Sans
- **Sizes**: 12px → 48px

### Touch Targets

- **Minimum**: 44x44px (iOS Human Interface Guidelines)
- **Buttons**: 48px height
- **Inputs**: 48px height

### Animations

- **Fast**: 150ms
- **Normal**: 200ms
- **Slow**: 300ms

---

## 📱 App Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── EmptyState.tsx
│   ├── screens/             # Screen components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── orders/
│   │   │   ├── OrdersListScreen.tsx
│   │   │   └── OrderDetailsScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   └── SplashScreen.tsx
│   ├── navigation/          # Navigation setup
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── RootNavigator.tsx
│   ├── services/            # API services
│   │   ├── api.ts
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
│   └── types/               # TypeScript types
│       └── index.ts
├── App.tsx                  # App entry point
└── index.js                 # React Native entry
```

---

## 🔧 Troubleshooting

### iOS Build Issues

```bash
# Clean build
cd ios
rm -rf Pods Podfile.lock build
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

# Or
watchman watch-del-all
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### Module Not Found Errors

```bash
# Clear watchman
watchman watch-del-all

# Clear metro cache
rm -rf $TMPDIR/metro-*

# Reinstall
rm -rf node_modules
npm install
```

---

## 📝 Available Features

### ✅ Implemented

- Authentication (Login, Register, Logout)
- Dashboard with role-based widgets
- Orders list with search and filters
- Order details with status updates
- Pull-to-refresh
- Role-based access control
- Redux state management
- API integration with backend

### 🚧 To Be Implemented

- Products management screens
- Inventory management screens
- Profile screen
- Settings screen
- Push notifications
- Offline support
- Unit tests
- E2E tests

---

## 🎯 User Roles & Features

### Owner

- ✅ Full access to all features
- ✅ View dashboard with all statistics
- ✅ Manage orders (view, update status)
- ✅ Manage products (CRUD)
- ✅ Manage inventory (adjust stock)

### Warehouse Manager

- ✅ View dashboard with inventory focus
- ✅ Manage orders (view, update status)
- ✅ Manage products (create, edit)
- ✅ Manage inventory (adjust stock)

### Sales Staff

- ✅ View dashboard with sales focus
- ✅ View orders (read-only)
- ✅ View products (read-only)
- ❌ Cannot modify inventory

---

## 📞 Support

Nếu gặp vấn đề, hãy check:

1. Backend server đang chạy tại `http://localhost:4000`
2. `.env` file đã được cấu hình đúng
3. Dependencies đã được cài đặt đầy đủ
4. iOS pods đã được cài đặt (macOS only)

---

**Happy Coding! 🎉**
