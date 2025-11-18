# App Store Submission Checklist

Use this checklist to ensure your FreshTrack app is ready for submission to both Apple App Store and Google Play Store.

## Pre-Submission Checklist

### General Requirements
- [ ] App has been thoroughly tested on real devices (iOS and Android)
- [ ] No crashes or major bugs present
- [ ] All features work as expected
- [ ] App works offline where appropriate
- [ ] Privacy Policy page is complete and accessible (/privacy)
- [ ] Terms of Service page is complete and accessible (/terms)
- [ ] App loads quickly (< 3 seconds on average connection)

### Content Requirements
- [ ] All placeholder content has been replaced with real content
- [ ] No Lorem Ipsum or test text visible to users
- [ ] All images are high quality and properly licensed
- [ ] App name is final and checked for trademark conflicts
- [ ] App description is compelling and accurate

### Camera & Photos
- [ ] Camera permission request includes clear explanation
- [ ] Photo library access request includes clear explanation
- [ ] Camera feature works reliably on both iOS and Android
- [ ] Receipt scanning produces accurate results
- [ ] Image upload to storage works properly

### Authentication & User Data
- [ ] User signup/login works correctly
- [ ] Password reset flow is functional
- [ ] User data is properly secured
- [ ] RLS policies are properly configured
- [ ] Email verification works (if implemented)

## iOS App Store Specific

### Technical Requirements
- [ ] Built with latest stable Xcode version
- [ ] Targets iOS 13.0 or later
- [ ] App is built for production (not development)
- [ ] `server` configuration removed from capacitor.config.ts
- [ ] All dependencies are up to date
- [ ] App has been tested on multiple iOS devices/simulators

### App Icons & Assets
- [ ] App icon (1024x1024) provided
- [ ] All required icon sizes generated
- [ ] Launch screen configured properly
- [ ] No alpha channels in app icons
- [ ] Icons follow Apple's design guidelines

### Info.plist Permissions
- [ ] `NSCameraUsageDescription` added: "FreshTrack needs camera access to scan receipts"
- [ ] `NSPhotoLibraryUsageDescription` added: "FreshTrack needs photo access to select receipt images"
- [ ] Privacy manifest (PrivacyInfo.xcprivacy) is included
- [ ] All permission descriptions are clear and accurate

### App Store Connect
- [ ] App created in App Store Connect
- [ ] Bundle ID matches your configuration
- [ ] App name is available
- [ ] Primary category selected (Food & Drink or Lifestyle)
- [ ] Age rating completed (4+)
- [ ] Privacy policy URL provided (https://yourdomain.com/privacy)
- [ ] Support URL provided
- [ ] Marketing URL provided (optional)

### Screenshots & Media (Required Sizes)
- [ ] iPhone 6.7" (1290 x 2796 pixels) - 3-10 screenshots
- [ ] iPhone 6.5" (1242 x 2688 pixels) - 3-10 screenshots  
- [ ] iPhone 5.5" (1242 x 2208 pixels) - Optional
- [ ] iPad Pro 12.9" (2048 x 2732 pixels) - Optional but recommended
- [ ] App Preview video (optional)

### App Description
- [ ] App name (max 30 characters)
- [ ] Subtitle (max 30 characters)
- [ ] Promotional text (max 170 characters)
- [ ] Description (max 4000 characters)
- [ ] Keywords (max 100 characters, comma-separated)
- [ ] What's New in This Version

### Review Information
- [ ] Demo account credentials provided (if app requires login)
- [ ] Notes to reviewer explaining how to test features
- [ ] Contact information provided

## Google Play Store Specific

### Technical Requirements
- [ ] Built with Android Studio
- [ ] Target API level 33 or higher (Android 13)
- [ ] Minimum API level 22 or higher (Android 5.1)
- [ ] `server` configuration removed from capacitor.config.ts
- [ ] All dependencies are up to date
- [ ] App signed with release keystore
- [ ] ProGuard rules configured (if using minification)

### App Icons & Assets
- [ ] App icon (512x512) provided
- [ ] Adaptive icon (foreground and background) provided
- [ ] All density variants generated (hdpi, xhdpi, xxhdpi, xxxhdpi)
- [ ] Feature graphic (1024 x 500) created
- [ ] Icons follow Material Design guidelines

### AndroidManifest.xml Permissions
- [ ] `CAMERA` permission declared
- [ ] `READ_EXTERNAL_STORAGE` permission declared
- [ ] `WRITE_EXTERNAL_STORAGE` permission declared (if needed)
- [ ] `INTERNET` permission declared
- [ ] Unnecessary permissions removed

### Google Play Console
- [ ] App created in Google Play Console
- [ ] Application ID matches your configuration
- [ ] App name is available
- [ ] Primary category selected (Food & Drink or Lifestyle)
- [ ] Content rating questionnaire completed
- [ ] Privacy policy URL provided (https://yourdomain.com/privacy)
- [ ] Support email provided
- [ ] Website URL provided (optional)

### Store Listing Graphics (Required)
- [ ] App icon (512 x 512 PNG)
- [ ] Feature graphic (1024 x 500 JPG/PNG)
- [ ] Phone screenshots - 2-8 images (minimum 320px, max 3840px)
- [ ] 7-inch tablet screenshots - Optional
- [ ] 10-inch tablet screenshots - Optional
- [ ] Promotional video (YouTube URL) - Optional

### App Description
- [ ] App title (max 50 characters)
- [ ] Short description (max 80 characters)
- [ ] Full description (max 4000 characters)
- [ ] Localized descriptions for target markets

### App Release
- [ ] Release type selected (Production, Open Testing, Closed Testing)
- [ ] Countries and regions selected
- [ ] Pricing set (Free recommended initially)
- [ ] App content rating completed
- [ ] Target audience and content declared
- [ ] Data safety form completed

### Data Safety Section
- [ ] Data collection practices disclosed
- [ ] Types of data collected specified:
  - [ ] Email addresses
  - [ ] Photos (receipts)
  - [ ] App activity data
- [ ] Data usage purposes explained
- [ ] Data sharing practices disclosed
- [ ] Security practices described

## Common Rejection Reasons to Avoid

### iOS Rejections
- [ ] App crashes on launch or during common workflows
- [ ] Missing permission descriptions in Info.plist
- [ ] App doesn't work without network (if offline should work)
- [ ] Links to external payment systems (use in-app purchase)
- [ ] Privacy policy not accessible within app
- [ ] Unclear permission requests
- [ ] App contains placeholder content
- [ ] App doesn't provide enough functionality

### Android Rejections
- [ ] App crashes or freezes
- [ ] Violates content policy
- [ ] Privacy policy missing or inadequate
- [ ] Misleading app information
- [ ] Inappropriate content
- [ ] Broken functionality
- [ ] Violates permissions policy
- [ ] Missing data safety information

## Testing Checklist

### Functional Testing
- [ ] User can sign up successfully
- [ ] User can log in successfully
- [ ] Camera opens and captures photos
- [ ] Receipt scanning extracts items correctly
- [ ] Items can be added manually
- [ ] Items can be edited and deleted
- [ ] Expiry dates are tracked correctly
- [ ] Recipe suggestions are generated
- [ ] Statistics are calculated correctly
- [ ] User can sign out
- [ ] App works offline (where appropriate)

### Device Testing
- [ ] Tested on iPhone (iOS 13+)
- [ ] Tested on iPad
- [ ] Tested on Android phone (API 22+)
- [ ] Tested on Android tablet
- [ ] Tested on low-end devices
- [ ] Tested with poor network conditions

### UX Testing
- [ ] Navigation is intuitive
- [ ] Buttons and touch targets are appropriately sized
- [ ] Text is readable on all screen sizes
- [ ] App respects system dark/light mode
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Success feedback is provided

## Post-Submission

### After Submission
- [ ] Monitor review status daily
- [ ] Respond to any reviewer questions promptly (within 24 hours)
- [ ] Have demo/test credentials ready if requested
- [ ] Be prepared to explain any complex features

### If Rejected
- [ ] Read rejection reason carefully
- [ ] Fix the specific issues mentioned
- [ ] Test fixes thoroughly
- [ ] Respond to reviewer with explanation of fixes
- [ ] Resubmit within resolution timeline

### After Approval
- [ ] Monitor crash reports and user reviews
- [ ] Respond to user reviews
- [ ] Plan updates based on feedback
- [ ] Track key metrics (downloads, retention, etc.)

## Timeline Expectations

### iOS App Store
- Initial review: 1-7 days (typically 24-48 hours)
- Expedited review: Request if urgent (limited availability)
- Rejection response: Fix and resubmit within specified time

### Google Play Store
- Initial review: 1-3 days (can be as fast as a few hours)
- Policy violation: Can take longer to resolve
- Updates: Usually faster than initial submission

## Resources

- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Developer Policy](https://play.google.com/about/developer-content-policy/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design for Android](https://material.io/design)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

## Support Contacts

For technical issues with FreshTrack:
- Email: support@freshtrack.app
- Documentation: See DEPLOYMENT.md

For platform-specific issues:
- Apple Developer Support: https://developer.apple.com/contact/
- Google Play Support: https://support.google.com/googleplay/android-developer/

---

**Pro Tip**: Submit to Google Play first! The review is typically faster, and you can identify and fix issues before the iOS submission.