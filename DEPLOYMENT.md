# FreshTrack - Mobile App Deployment Guide

This guide will help you deploy FreshTrack to the Apple App Store and Google Play Store using Capacitor.

## Prerequisites

Before you begin, ensure you have:

- **For iOS:**
  - A Mac computer with Xcode installed (version 14 or later)
  - An Apple Developer account ($99/year)
  - CocoaPods installed (`sudo gem install cocoapods`)

- **For Android:**
  - Android Studio installed
  - Java Development Kit (JDK) 11 or later
  - A Google Play Developer account ($25 one-time fee)

## Initial Setup

1. **Export to GitHub:**
   - Click "Export to Github" button in Lovable
   - Clone your repository locally:
   ```bash
   git clone <your-repo-url>
   cd receipt-recipe-radar
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Add iOS and Android Platforms:**
   ```bash
   # Add iOS platform
   npx cap add ios
   
   # Add Android platform
   npx cap add android
   ```

4. **Update Native Dependencies:**
   ```bash
   # For iOS
   npx cap update ios
   
   # For Android
   npx cap update android
   ```

## Development Build

### Build the Web App
```bash
npm run build
```

### Sync with Native Platforms
```bash
npx cap sync
```

## iOS Deployment

### 1. Configure Capacitor for Production

Edit `capacitor.config.ts` and remove or comment out the `server` section:

```typescript
// Comment out for production:
// server: {
//   url: 'https://...',
//   cleartext: true
// },
```

### 2. Open in Xcode
```bash
npx cap open ios
```

### 3. Configure App Settings in Xcode

1. **Select your project** in the navigator
2. **Update Bundle Identifier:** Use a unique identifier (e.g., `com.yourcompany.freshtrack`)
3. **Set Team:** Select your Apple Developer account
4. **Configure App Icons:**
   - Add app icons in Assets.xcassets
   - Use sizes: 20x20, 29x29, 40x40, 60x60, 76x76, 83.5x83.5, 1024x1024 (all @2x and @3x)

5. **Update Info.plist** with required permissions:
   - `NSCameraUsageDescription`: "FreshTrack needs camera access to scan receipts"
   - `NSPhotoLibraryUsageDescription`: "FreshTrack needs photo access to select receipt images"

### 4. Test on Device
1. Connect your iPhone
2. Select your device in Xcode
3. Click the Run button (▶️)

### 5. Create Archive for App Store
1. In Xcode menu: **Product > Archive**
2. Once complete, click **Distribute App**
3. Choose **App Store Connect**
4. Follow the wizard to upload

### 6. Submit for Review
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app
3. Fill in all required information:
   - App name, description, keywords
   - Screenshots (required sizes)
   - Privacy policy URL
   - Support URL
4. Submit for review

## Android Deployment

### 1. Configure Capacitor for Production

Same as iOS - comment out the `server` section in `capacitor.config.ts`.

### 2. Open in Android Studio
```bash
npx cap open android
```

### 3. Configure App Settings

1. **Update `android/app/build.gradle`:**
   ```gradle
   android {
       defaultConfig {
           applicationId "app.lovable.a55083331c2e4cf1bbbe1709e09a477d"
           minSdkVersion 22
           targetSdkVersion 34
           versionCode 1
           versionName "1.0.0"
       }
   }
   ```

2. **Update App Name** in `android/app/src/main/res/values/strings.xml`:
   ```xml
   <string name="app_name">FreshTrack</string>
   ```

3. **Add App Icons:**
   - Place icons in `android/app/src/main/res/mipmap-*` folders
   - Sizes needed: hdpi, mdpi, xhdpi, xxhdpi, xxxhdpi

4. **Configure Permissions** in `AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
   ```

### 4. Generate Signing Key

```bash
keytool -genkey -v -keystore freshtrack.keystore -alias freshtrack -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore file securely and remember the passwords!

### 5. Configure Signing in `android/app/build.gradle`

```gradle
android {
    signingConfigs {
        release {
            storeFile file('path/to/freshtrack.keystore')
            storePassword 'your-store-password'
            keyAlias 'freshtrack'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 6. Build Release APK/AAB

```bash
cd android
./gradlew bundleRelease  # For AAB (recommended)
# OR
./gradlew assembleRelease  # For APK
```

The output will be in:
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

### 7. Submit to Google Play

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Complete the store listing:
   - Title, short description, full description
   - App icon and feature graphic
   - Screenshots (phone, tablet)
   - Privacy policy URL
4. Upload the AAB file
5. Complete the content rating questionnaire
6. Set up pricing and distribution
7. Submit for review

## App Store Requirements Checklist

### iOS App Store
- [ ] Privacy policy URL configured
- [ ] Support URL configured
- [ ] App icons (all required sizes)
- [ ] Screenshots (iPhone and iPad)
- [ ] App description and keywords
- [ ] Age rating completed
- [ ] Camera permission descriptions in Info.plist
- [ ] Test on actual device
- [ ] No crashes or major bugs

### Google Play Store
- [ ] Privacy policy URL configured
- [ ] App icons (all densities)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone and tablet)
- [ ] App description (short and full)
- [ ] Content rating completed
- [ ] Target API level 33+ (Android 13)
- [ ] Camera permissions declared
- [ ] Signed with release key
- [ ] Test on actual device
- [ ] No crashes or major bugs

## Common Issues & Solutions

### Issue: "Could not find CocoaPods"
**Solution:** Install CocoaPods: `sudo gem install cocoapods`

### Issue: Android build fails
**Solution:** 
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Issue: Camera not working on iOS
**Solution:** Ensure `NSCameraUsageDescription` is in Info.plist

### Issue: App crashes on startup
**Solution:** Check console logs in Xcode/Android Studio for detailed error messages

## Ongoing Updates

When you make changes to your app:

1. **Pull latest code from GitHub:**
   ```bash
   git pull
   ```

2. **Build web assets:**
   ```bash
   npm run build
   ```

3. **Sync with native platforms:**
   ```bash
   npx cap sync
   ```

4. **Update version numbers** in:
   - iOS: Xcode project settings
   - Android: `build.gradle` (increment `versionCode` and `versionName`)

5. **Rebuild and resubmit** following the deployment steps above

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Developer Policy](https://play.google.com/about/developer-content-policy/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

## Support

For issues specific to FreshTrack, contact: support@freshtrack.app
For Capacitor issues, visit: https://forum.ionicframework.com/c/capacitor/

## Notes

- The `capacitor.config.ts` includes a development server URL for hot-reload during development. Make sure to comment this out for production builds.
- Always test thoroughly on real devices before submitting to app stores.
- Review process can take 1-7 days for iOS and 1-3 days for Android.
- Keep your signing keys secure and backed up!
