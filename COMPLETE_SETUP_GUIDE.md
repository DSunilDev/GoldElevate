# 🚀 GoldElevate - Complete Setup Guide

## Complete Installation & Setup Instructions

This is the **ONLY** guide you need to set up and run the GoldElevate application from scratch on your local machine and phone.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Setup](#backend-setup)
4. [Mobile App Setup](#mobile-app-setup)
5. [Environment Configuration](#environment-configuration)
6. [MSG91 OTP Configuration](#msg91-otp-configuration)
7. [Network Configuration for Phone Testing](#network-configuration-for-phone-testing)
8. [Running the Application](#running-the-application)
9. [Building APK for Deployment](#building-apk-for-deployment)
10. [Testing the Application](#testing-the-application)
11. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### Required Software

#### 1.1 Node.js
- **Version**: Node.js 18 or higher
- **Installation**:
  ```bash
  # Check if Node.js is installed
  node --version
  
  # If not installed, download from https://nodejs.org/
  # Or use a package manager:
  # macOS: brew install node@18
  # Ubuntu/Debian: sudo apt-get install nodejs npm
  # Windows: Download installer from nodejs.org
  ```

#### 1.2 MySQL Database
- **Version**: MySQL 8.0 or higher
- **Installation**:
  ```bash
  # macOS
  brew install mysql
  brew services start mysql
  
  # Ubuntu/Debian
  sudo apt-get install mysql-server
  sudo systemctl start mysql
  sudo systemctl enable mysql
  
  # Windows: Download MySQL Installer from mysql.com
  ```

#### 1.3 Git (Optional but Recommended)
- Download from: https://git-scm.com/downloads

#### 1.4 For Mobile Development

**For Android:**
- Android Studio (latest version)
- Android SDK (API level 33+)
- Java Development Kit (JDK) 17 or higher
- Android device or emulator

**For iOS (macOS only):**
- Xcode (latest version)
- CocoaPods: `sudo gem install cocoapods`
- iOS Simulator or physical device

**For Expo (Recommended for Quick Testing):**
- Install Expo Go app on your phone:
  - Android: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

---

## 2. Database Setup

### 2.1 Create Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE IF NOT EXISTS gold_investment;
USE gold_investment;

# Exit MySQL
EXIT;
```

### 2.2 Create Database User (Recommended)

```bash
# Login to MySQL as root
mysql -u root -p

# Create user and grant privileges
CREATE USER 'gold_user'@'localhost' IDENTIFIED BY 'gold123';
GRANT ALL PRIVILEGES ON gold_investment.* TO 'gold_user'@'localhost';
FLUSH PRIVILEGES;

# Exit MySQL
EXIT;
```

### 2.3 Run Database Schema Scripts

Navigate to the project root directory and run:

```bash
# Run complete database initialization (includes schema, indexes, migrations, and test data)
mysql -u root -p gold_investment < database/01_init.sql
```

**Note**: If you created a database user, replace `root` with `gold_user`:
```bash
mysql -u gold_user -p gold_investment < database/01_init.sql
```

**What's included in `01_init.sql`:**
- All table structures
- All performance indexes
- All migrations (phone column, payment gateway, signup_type, etc.)
- All stored procedures, triggers, and views
- Test users (testadmin/testuser)

### 2.4 Verify Database Setup

```bash
# Check if tables were created
mysql -u root -p gold_investment -e "SHOW TABLES;"

# You should see tables like: member, admin, def_type, sale, upi_payment, income, etc.
```

### 2.5 Run Database Migrations (if any)

```bash
cd backend
npm run migrate
```

---

## 3. Backend Setup

### 3.1 Navigate to Backend Directory

```bash
cd backend
```

### 3.2 Install Dependencies

```bash
npm install
```

This will install all required packages including:
- express
- mysql2
- jsonwebtoken
- bcryptjs
- cors
- helmet
- morgan
- winston
- and others

### 3.3 Create Environment File

Create a `.env` file in the `backend` directory:

```bash
# In backend directory
touch .env
```

### 3.4 Configure Environment Variables

Edit `backend/.env` with the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=gold_user
DB_PASSWORD=gold123
DB_NAME=gold_investment

# Server Configuration
PORT=8081
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# MSG91 OTP Configuration (See MSG91 Setup section below)
MSG91_AUTH_KEY=your_msg91_auth_key_here
MSG91_SENDER_ID=DSHOTP
MSG91_ROUTE=4

# Admin Signup Key
ADMIN_SIGNUP_KEY=ADMIN_SECRET_KEY_2024

# Rate Limiting (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

**Important Notes**:
- Replace `DB_PASSWORD` with your actual MySQL password
- Replace `JWT_SECRET` with a strong random string (use `openssl rand -base64 32` to generate)
- Replace `MSG91_AUTH_KEY` with your actual MSG91 auth key (see MSG91 Setup section)
- If you didn't create a database user, use `root` for `DB_USER`

### 3.5 Create Logs Directory

```bash
mkdir -p backend/logs
```

### 3.6 Test Database Connection

The database connection will be tested automatically when you start the backend server. If there are connection issues, check:

1. MySQL is running: `mysql -u root -p -e "SELECT 1;"`
2. Database exists: `mysql -u root -p -e "SHOW DATABASES LIKE 'gold_investment';"`
3. User has permissions: `mysql -u root -p -e "SHOW GRANTS FOR 'gold_user'@'localhost';"`

You can also test the connection by starting the backend (see next step) - it will show connection status.

### 3.7 Start Backend Server

```bash
# From backend directory
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

**Expected Output**:
```
✅ Database connected successfully
🚀 Server running on port 8081
📊 Environment: development
🔗 API available at http://localhost:8081/api
```

### 3.8 Verify Backend is Running

Open a new terminal and test:

```bash
# Health check
curl http://localhost:8081/api/health

# Should return: {"success":true,"message":"Server is running"}
```

---

## 4. Mobile App Setup

### 4.1 Navigate to Mobile App Directory

```bash
# From project root
cd mobile-app
```

### 4.2 Install Dependencies

```bash
npm install
```

This will install all React Native and Expo dependencies.

### 4.3 Install iOS Dependencies (macOS only)

If you're on macOS and want to run on iOS:

```bash
cd ios
pod install
cd ..
```

### 4.4 Configure API URL

Edit `mobile-app/src/config/api.js` and update the API base URL:

**For Web Browser Testing:**
```javascript
// Line ~30-40 in api.js
const getBaseURL = () => {
  // For web, always use localhost
  if (isWeb) {
    return 'http://localhost:8081/api';
  }
  // For mobile, use your computer's IP address
  return 'http://YOUR_COMPUTER_IP:8081/api';
};
```

**For Phone Testing:**
You need to replace `YOUR_COMPUTER_IP` with your computer's local IP address. See "Network Configuration" section below.

**Example:**
```javascript
// If your computer's IP is 192.168.1.100
return 'http://192.168.1.100:8081/api';
```

### 4.5 Configure MSG91 SDK (for OTP)

Edit `mobile-app/src/utils/msg91SDK.js` and update:

```javascript
// Line ~20-25
const WIDGET_ID = '356c42676f6d373231353532';
const TOKEN_AUTH = '485059TdWlYZWpMtU46950d955P1';
```

**Note**: These are the MSG91 credentials. If you have different credentials, update them here.

---

## 5. Environment Configuration

### 5.1 Backend Environment Variables Summary

All backend environment variables should be in `backend/.env`:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DB_HOST` | MySQL host | `localhost` | Yes |
| `DB_PORT` | MySQL port | `3306` | Yes |
| `DB_USER` | MySQL username | `gold_user` | Yes |
| `DB_PASSWORD` | MySQL password | `gold123` | Yes |
| `DB_NAME` | Database name | `gold_investment` | Yes |
| `PORT` | Backend server port | `8081` | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | - | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration | `24h` | Optional |
| `MSG91_AUTH_KEY` | MSG91 API auth key | - | Optional* |
| `MSG91_SENDER_ID` | MSG91 sender ID | `DSHOTP` | Optional* |
| `MSG91_ROUTE` | MSG91 route (4=Transactional) | `4` | Optional* |
| `ADMIN_SIGNUP_KEY` | Key for admin signup | `ADMIN_SECRET_KEY_2024` | Optional |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:8080` | Optional |

*MSG91 is optional but recommended for OTP functionality

### 5.2 Mobile App Configuration

The mobile app doesn't use a `.env` file. All configuration is in:
- `mobile-app/src/config/api.js` - API base URL
- `mobile-app/src/utils/msg91SDK.js` - MSG91 SDK credentials

---

## 6. MSG91 OTP Configuration

### 6.1 What is MSG91?

MSG91 is an SMS service provider used for sending OTP (One-Time Password) messages to users' phones.

### 6.2 Get MSG91 Credentials

1. **Sign up at [MSG91.com](https://msg91.com)**
2. **Get your Auth Key**:
   - Login to MSG91 dashboard
   - Go to Settings → API Keys
   - Copy your Auth Key
3. **Get/Request Sender ID**:
   - Go to Settings → Sender ID
   - Use existing sender ID or request a new one
   - Common sender IDs: `DSHOTP`, `GOLDEV`, `GOLDELV`

### 6.3 Configure Backend MSG91

Edit `backend/.env`:

```env
MSG91_AUTH_KEY=your_actual_auth_key_from_msg91_dashboard
MSG91_SENDER_ID=DSHOTP
MSG91_ROUTE=4
```

**Note**: 
- `MSG91_ROUTE=4` means Transactional SMS (required for OTP)
- `MSG91_ROUTE=1` means Promotional SMS (not suitable for OTP)

### 6.4 Configure Mobile App MSG91 SDK

Edit `mobile-app/src/utils/msg91SDK.js`:

```javascript
// Line ~20-25
const WIDGET_ID = 'your_widget_id_from_msg91';
const TOKEN_AUTH = 'your_auth_token_from_msg91';
```

**Note**: The widget ID and auth token are different from the backend auth key. Get these from MSG91 dashboard under "Widget" or "Web SDK" section.

### 6.5 MSG91 Without Credentials (Development Mode)

If you don't have MSG91 credentials:
- OTP will be generated and logged to console
- OTP will be shown in API response (for testing)
- You can manually enter OTP in the app
- Backend will still work, just without SMS sending

---

## 7. Network Configuration for Phone Testing

### 7.1 Find Your Computer's IP Address

**macOS/Linux:**
```bash
# Find your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or use:
ipconfig getifaddr en0  # macOS
hostname -I             # Linux
```

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

**Example Output**: `192.168.1.100`

### 7.2 Setup ADB Reverse Port Forwarding (Android - Recommended)

If you're testing on an Android device, you can use `adb reverse` to forward ports, allowing your phone to access `localhost` on your computer. This is the easiest method.

**Prerequisites:**
- Android device connected via USB
- USB debugging enabled on your device
- Android SDK Platform Tools installed (adb command)

**Install ADB (if not installed):**

**macOS:**
```bash
brew install android-platform-tools
```

**Linux:**
```bash
sudo apt-get install android-tools-adb
```

**Windows:**
Download from: https://developer.android.com/studio/releases/platform-tools

**Setup Port Forwarding:**

1. **Check if device is connected:**
```bash
adb devices
# Should show your device listed
```

2. **Forward backend API port (8081):**
```bash
adb reverse tcp:8081 tcp:8081
```

3. **Forward Metro bundler port (19000) - if needed:**
```bash
adb reverse tcp:19000 tcp:19000
```

4. **Forward port 3000:**
```bash
adb reverse tcp:3000 tcp:3000
```

5. **Verify forwarding is active:**
```bash
adb reverse --list
# Should show: tcp:8081 tcp:8081
```

**Note:** You need to run these commands each time you reconnect your device. The port forwarding is active until you disconnect the device or restart adb.

### 7.3 Update Mobile App API URL

**Option A: Using ADB Reverse (Recommended for Android)**
If you've set up adb reverse (see section 7.2), you can use `localhost` in your API config:

Edit `mobile-app/src/config/api.js` - it should already use `localhost:8081/api` for mobile devices.

**Option B: Using Network IP (Alternative)**
If adb reverse doesn't work, use your computer's IP address:

Edit `mobile-app/src/config/api.js`:
```javascript
// Replace YOUR_COMPUTER_IP with your actual IP (found in section 7.1)
API_BASE_URL = 'http://YOUR_COMPUTER_IP:8081/api';
```

### 7.4 Ensure Phone and Computer are on Same Network

- Both devices must be on the same Wi-Fi network
- Computer's firewall must allow connections on port 8081

### 7.5 Configure Firewall (if needed)

**macOS:**
```bash
# Allow incoming connections on port 8081
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

**Linux:**
```bash
# Allow port 8081
sudo ufw allow 8081
```

**Windows:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port `8081`
6. Allow the connection

### 7.6 Test Network Connectivity

From your phone's browser, try:
```
http://YOUR_COMPUTER_IP:8081/api/health
```

Should return: `{"success":true,"message":"Server is running"}`

---

## 8. Running the Application

### 8.1 Start Backend Server

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

Keep this terminal open. You should see:
```
✅ Database connected successfully
🚀 Server running on port 8081
```

### 8.2 Start Mobile App

**Terminal 2 - Mobile App:**
```bash
cd mobile-app
npm start
```

Or with Expo:
```bash
npx expo start
```

**Options:**
- Press `a` for Android
- Press `i` for iOS
- Press `w` for web
- Scan QR code with Expo Go app on your phone

### 8.3 Running on Physical Phone

**Option 1: Expo Go (Easiest)**
1. Install Expo Go app on your phone
2. Scan the QR code shown in terminal
3. App will load on your phone

**Option 2: Development Build**
```bash
# Android
npm run android

# iOS (macOS only)
npm run ios
```

**Option 3: Web Browser**
```bash
npm start
# Press 'w' or open http://localhost:8080
```

---

## 9. Building APK for Deployment

### 9.1 Prerequisites for Building APK

Before building an APK, ensure you have:
- Android Studio installed
- Android SDK (API level 33+)
- Java Development Kit (JDK) 17 or higher
- `android` folder in `mobile-app` directory (if missing, run `npx expo prebuild`)

### 9.2 Update Production Backend URL

**IMPORTANT**: Before building for production, update the backend URL in `mobile-app/app.config.js`:

```javascript
extra: {
  apiUrl: "https://your-production-api.com/api", // Update this!
}
```

Replace `https://your-production-api.com/api` with your actual production backend URL.

### 9.3 Option 1: EAS Build (Cloud Build - Recommended)

EAS Build is the easiest method - it builds your APK in the cloud without needing Android Studio.

**Steps:**

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   cd mobile-app
   eas login
   ```
   (Create a free account at https://expo.dev if needed)

3. **Initialize project (if first time):**
   ```bash
   eas init
   ```
   This will create/update your project ID in `app.config.js`

4. **Build APK:**
   ```bash
   eas build --platform android --profile preview
   ```

5. **Wait for build** (10-20 minutes):
   - You'll get a download link in the terminal
   - Or check: https://expo.dev/accounts/[your-account]/projects/gold-elevate/builds

6. **Download and install:**
   - Download the APK to your Android phone
   - Enable "Install from unknown sources" in Settings
   - Install and test!

**Pros:**
- ✅ No Android Studio needed
- ✅ Works on any computer
- ✅ Automatic signing
- ✅ Free tier: 30 builds/month

**Cons:**
- ❌ Requires Expo account
- ❌ Build takes 10-20 minutes
- ❌ Requires internet connection

**Quick Build Script:**
```bash
cd mobile-app
./build-apk.sh
```

### 9.4 Option 2: Local Build with Gradle (Fastest if Android Studio is set up)

This method builds the APK locally using Gradle.

**Steps:**

1. **Navigate to mobile-app directory:**
   ```bash
   cd mobile-app
   ```

2. **Build APK using script:**
   ```bash
   ./build-apk-local.sh
   ```

   **OR build manually:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

3. **Find your APK:**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

4. **Install on phone:**
   - Transfer APK to phone (USB, email, cloud storage)
   - Enable "Install from unknown sources" in Settings
   - Open APK file and install

**Prerequisites:**
- Android Studio installed
- Android SDK configured
- `ANDROID_HOME` environment variable set:
   ```bash
   # macOS/Linux
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

**Pros:**
- ✅ Fast builds (2-5 minutes)
- ✅ No internet needed after setup
- ✅ Full control over build process
- ✅ No account required

**Cons:**
- ❌ Requires Android Studio (~1GB download)
- ❌ More setup required

**Quick Build Script:**
```bash
cd mobile-app
./build-apk-simple.sh
```

### 9.5 Option 3: Using Expo CLI Directly

```bash
cd mobile-app
npx expo run:android --variant release
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### 9.6 Cleaning Build Cache

If you encounter build errors related to cached files, clean the build cache:

```bash
cd mobile-app/android
./gradlew clean
```

Then rebuild:
```bash
./gradlew assembleRelease
```

### 9.7 Installing APK on Android Phone

After building, install on your Android device:

1. **Transfer APK to phone:**
   - Email it to yourself
   - Use Google Drive/Dropbox
   - Use USB cable
   - Or use: `adb install app-release.apk` (if USB debugging enabled)

2. **Enable "Install from Unknown Sources":**
   - Settings → Security → Install Unknown Apps
   - Or Settings → Apps → Special Access → Install Unknown Apps
   - Enable for the app you're using to install (File Manager, Chrome, etc.)

3. **Install:**
   - Open APK file on phone
   - Tap "Install"
   - Done! 🎉

### 9.8 Troubleshooting APK Build

**Error: "PNG file corrupted" or "failed to read PNG signature"**
- Solution: Ensure all image files in `mobile-app/assets` are valid PNG files
- If a file is actually WebP, convert it:
  ```bash
  cd mobile-app/assets
  sips -s format png filename.webp --out filename.png
  ```
- Clean build cache: `cd mobile-app/android && ./gradlew clean`

**Error: "Build failed with exception"**
- Clean the build: `cd mobile-app/android && ./gradlew clean`
- Check Android SDK is installed
- Verify Java/JDK version (should be 17+)
- Check `ANDROID_HOME` is set correctly

**Error: "Command not found: gradlew"**
- Make sure you're in the `mobile-app/android` directory
- Run: `chmod +x gradlew` (if on macOS/Linux)

**APK too large:**
- This is normal for React Native apps (usually 30-50MB)
- For production, consider using App Bundle (AAB) instead of APK
- Use ProGuard/R8 for code shrinking (configured in `android/app/build.gradle`)

### 9.9 Building for Production (App Store/Play Store)

For Play Store submission, build an Android App Bundle (AAB) instead:

**Using EAS Build:**
```bash
cd mobile-app
eas build --platform android --profile production
```

**Using Gradle:**
```bash
cd mobile-app/android
./gradlew bundleRelease
```

AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

**Note:** For production builds:
- Update `versionCode` in `android/app/build.gradle`
- Update version in `app.config.js`
- Sign the bundle with your production keystore
- Test thoroughly before submission

---

## 10. Testing the Application

### 10.1 Test Backend API

```bash
# Health check
curl http://localhost:8081/api/health

# Should return: {"success":true,"message":"Server is running"}
```

### 10.2 Test User Signup

1. Open the app on your phone/browser
2. Click "Sign Up"
3. Fill in the form:
   - First Name
   - Last Name
   - Email
   - Phone Number (10 digits, starting with 6-9)
   - Password (if using password signup)
   - Confirm Password (if using password signup)
   - Upload ID Proof Front (required)
   - Upload ID Proof Back (required)
   - Upload User Photo (required)
   - Accept Terms & Conditions
4. Enter referral code (optional)
5. Click "Send OTP & Continue" (for OTP signup) or "Create Account" (for password signup)
6. If using OTP: Enter OTP received via SMS (or check backend console for OTP)
7. Complete signup

### 10.3 Test User Login

1. Click "Login"
2. Enter phone number
3. Click "Login with OTP"
4. Enter OTP received via SMS
5. Should login successfully

### 10.4 Test Admin Signup

1. Click "Admin Signup"
2. Enter phone number
3. Enter admin key: `ADMIN_SECRET_KEY_2024`
4. Click "Send OTP"
5. Enter OTP
6. Complete admin signup

### 10.5 Test Admin Login

1. Click "Login as Admin" or navigate to Admin Login
2. Enter admin phone number
3. Click "Send OTP"
4. Enter OTP
5. Should login to admin dashboard

### 10.6 Test Payment Flow

1. Login as a user
2. Navigate to "Investments" or "Packages"
3. Select a package
4. Click "Invest Now"
5. Choose payment method (GPay/PhonePe/Other)
6. Enter transaction details
7. Submit payment
8. Payment should appear in admin panel for verification

### 10.7 Test Admin Functions

1. Login as admin
2. Navigate to "Pending Applications"
3. Approve pending user signups
4. Navigate to "Payments"
5. Verify pending payments
6. Navigate to "Withdrawals"
7. Approve/reject withdrawal requests

---

## 11. Troubleshooting

### 11.1 Database Connection Errors

**Error**: `Database connection failed`

**Solutions**:
1. Check MySQL is running:
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status mysql
   
   # Windows: Check Services panel
   ```

2. Verify database credentials in `backend/.env`

3. Test connection manually:
   ```bash
   mysql -u gold_user -p gold_investment
   ```

4. Check database exists:
   ```bash
   mysql -u root -p -e "SHOW DATABASES;"
   ```

### 11.2 Backend Won't Start

**Error**: `Port 8081 already in use`

**Solutions**:
1. Find and kill the process:
   ```bash
   # macOS/Linux
   lsof -ti:8081 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :8081
   taskkill /PID <PID> /F
   ```

2. Or change port in `backend/.env`:
   ```env
   PORT=8082
   ```

### 11.3 Mobile App Can't Connect to Backend

**Error**: `Network request failed` or `Connection refused`

**Solutions**:
1. Verify backend is running on port 8081

2. Check API URL in `mobile-app/src/config/api.js`:
   - For web: `http://localhost:8081/api`
   - For phone: `http://YOUR_COMPUTER_IP:8081/api`

3. Ensure phone and computer are on same Wi-Fi network

4. Test from phone browser:
   ```
   http://YOUR_COMPUTER_IP:8081/api/health
   ```

5. Check firewall settings (see Network Configuration section)

6. Try restarting backend server

### 11.4 OTP Not Received

**Solutions**:
1. **Check MSG91 Configuration**:
   - Verify `MSG91_AUTH_KEY` in `backend/.env`
   - Check MSG91 dashboard for SMS logs
   - Verify account has balance

2. **Check Backend Logs**:
   ```bash
   tail -f backend/logs/combined.log
   ```
   Look for OTP generation logs

3. **Development Mode**:
   - OTP is logged to console
   - Check backend terminal for OTP code
   - OTP may be shown in API response

4. **Verify Phone Number Format**:
   - Must be 10 digits
   - Must start with 6, 7, 8, or 9
   - No country code

### 11.5 Mobile App Build Errors

**Error**: `Metro bundler failed` or `Module not found`

**Solutions**:
1. Clear cache and reinstall:
   ```bash
   cd mobile-app
   rm -rf node_modules
   npm install
   npm start -- --reset-cache
   ```

2. For iOS (macOS only):
   ```bash
   cd ios
   pod deintegrate
   pod install
   cd ..
   ```

3. Check Node.js version:
   ```bash
   node --version  # Should be 18+
   ```

### 11.6 Expo Go Connection Issues

**Error**: `Unable to connect to Expo`

**Solutions**:
1. Ensure phone and computer are on same network

2. Try tunnel mode:
   ```bash
   npx expo start --tunnel
   ```

3. Check Expo CLI version:
   ```bash
   npm install -g expo-cli@latest
   ```

4. Restart Expo:
   ```bash
   # Stop current process (Ctrl+C)
   npx expo start --clear
   ```

### 11.7 Database Migration Errors

**Error**: `Table already exists` or `Column already exists`

**Solutions**:
1. Check if migration already ran:
   ```bash
   mysql -u root -p gold_investment -e "SHOW TABLES;"
   ```

2. If tables exist, migrations may have already run

3. For fresh start, drop and recreate database:
   ```bash
   mysql -u root -p -e "DROP DATABASE gold_investment;"
   mysql -u root -p -e "CREATE DATABASE gold_investment;"
   # Then run schema scripts again
   ```

### 11.8 CORS Errors (Web Browser)

**Error**: `CORS policy blocked`

**Solutions**:
1. Backend CORS is already configured to allow all origins
2. If still getting errors, check `backend/server.js` CORS configuration
3. Ensure `FRONTEND_URL` in `.env` matches your frontend URL

### 11.9 JWT Token Errors

**Error**: `Invalid token` or `Token expired`

**Solutions**:
1. Clear app storage:
   - In app: Logout and login again
   - Or clear AsyncStorage in React Native

2. Check `JWT_SECRET` in `backend/.env` hasn't changed

3. Verify token expiration: `JWT_EXPIRES_IN=24h`

### 11.10 Payment Verification Errors

**Error**: `Payment verification failed`

**Solutions**:
1. Check payment status in database:
   ```bash
   mysql -u root -p gold_investment -e "SELECT * FROM upi_payment ORDER BY created DESC LIMIT 5;"
   ```

2. Verify payment gateway configuration in admin panel

3. Check backend logs for payment processing errors

---

## 📝 Additional Notes

### Default Credentials

**Database:**
- User: `gold_user`
- Password: `gold123`
- Database: `gold_investment`

**Admin Signup:**
- Admin Key: `ADMIN_SECRET_KEY_2024`

**⚠️ IMPORTANT**: Change all default passwords and keys in production!

### Project Structure

```
GoldElevate/
├── backend/              # Node.js/Express backend
│   ├── config/          # Database and other configs
│   ├── routes/          # API routes
│   ├── middleware/      # Auth and other middleware
│   ├── utils/           # Utility functions
│   ├── scripts/         # (Empty - for future scripts if needed)
│   ├── logs/            # Application logs
│   ├── uploads/         # Uploaded files
│   ├── .env             # Environment variables (create this)
│   └── server.js        # Main server file
├── mobile-app/          # React Native mobile app
│   ├── src/
│   │   ├── screens/     # App screens
│   │   ├── config/      # API configuration
│   │   ├── utils/       # Utility functions
│   │   └── context/     # React context
│   └── package.json
├── database/            # Database schema files
│   ├── 01_init.sql      # Main schema
│   └── 01_init.sql (includes all migrations and indexes)
└── COMPLETE_SETUP_GUIDE.md  # This file
```

### API Endpoints

**Base URL**: `http://localhost:8081/api` (or `http://YOUR_IP:8081/api` for phone)

**Authentication:**
- `POST /auth/signup` - User signup
- `POST /auth/login` - User login
- `POST /auth/login-send-otp` - Send login OTP
- `POST /auth/login-verify-otp` - Verify login OTP
- `POST /auth/agent-signup` - Agent signup
- `POST /auth/admin-signup` - Admin signup
- `POST /auth/admin-login-send-otp` - Admin login OTP
- `POST /auth/admin-login-verify-otp` - Admin login verify

**Dashboard:**
- `GET /dashboard/member` - Member dashboard
- `GET /admin/dashboard` - Admin dashboard

**Payments:**
- `POST /payment/init` - Initialize payment
- `POST /payment/submit` - Submit payment
- `GET /payment/history` - Payment history

**Admin:**
- `GET /admin/members` - List all members
- `GET /admin/pending-signups` - Pending applications
- `POST /admin/approve-signup/:id` - Approve signup
- `GET /admin/payments` - List payments
- `POST /admin/verify-payment/:id` - Verify payment
- `GET /admin/withdraws` - List withdrawals
- `POST /admin/approve-withdraw/:id` - Approve withdrawal

### Development vs Production

**Development:**
- Uses default credentials
- OTP shown in console/logs
- CORS allows all origins
- Detailed error messages
- Hot reload enabled

**Production:**
- Change all default passwords
- Use strong JWT secret
- Configure proper CORS
- Hide error details
- Use environment-specific configs
- Enable HTTPS
- Set up proper logging

---

## ✅ Setup Checklist

Use this checklist to ensure everything is set up correctly:

### Database
- [ ] MySQL installed and running
- [ ] Database `gold_investment` created
- [ ] Database user `gold_user` created (or using root)
- [ ] Database initialization script executed (`01_init.sql`)
- [ ] Tables verified (`SHOW TABLES;`)

### Backend
- [ ] Node.js 18+ installed
- [ ] Backend dependencies installed (`npm install`)
- [ ] `.env` file created in `backend/` directory
- [ ] Database credentials configured in `.env`
- [ ] JWT_SECRET set in `.env`
- [ ] MSG91 credentials configured (optional)
- [ ] Backend starts without errors
- [ ] Health check endpoint works (`/api/health`)

### Mobile App
- [ ] Mobile app dependencies installed (`npm install`)
- [ ] API URL configured in `mobile-app/src/config/api.js`
- [ ] MSG91 SDK credentials configured (if using)
- [ ] iOS pods installed (macOS only, if testing iOS)
- [ ] App starts without errors

### Network
- [ ] Computer's IP address identified
- [ ] Phone and computer on same Wi-Fi network
- [ ] Firewall allows port 8081
- [ ] Can access backend from phone browser (`http://IP:8081/api/health`)

### Testing
- [ ] Backend health check works
- [ ] User signup works
- [ ] User login works
- [ ] OTP received (or visible in logs)
- [ ] Admin signup works
- [ ] Admin login works
- [ ] Payment flow works
- [ ] Admin functions work

---

## 🎉 You're All Set!

If you've completed all steps above, your GoldElevate application should be running successfully!

**Next Steps:**
1. Test all features
2. Create test users
3. Test payment flows
4. Test admin functions
5. Customize for your needs

**For Support:**
- Check logs: `backend/logs/combined.log`
- Check backend console output
- Check mobile app console (if using Expo)
- Review this guide's troubleshooting section

---

**Last Updated**: January 2026  
**Version**: 1.0.0
