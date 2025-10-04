# DebsMatch Beta Testing Guide

## Overview
This guide will help you set up beta testing for DebsMatch so your friends can test the app and create accounts.

## Prerequisites
- Expo account (free)
- Apple Developer account (for iOS testing) - $99/year
- Google Play Console account (for Android testing) - $25 one-time fee

## Option 1: EAS Build + TestFlight/Google Play (Recommended)

### Step 1: Set up EAS
1. Create an Expo account at https://expo.dev
2. Run `eas login` in your terminal and log in
3. Run `eas build:configure` to set up the project

### Step 2: Configure App Signing
For iOS:
1. Run `eas credentials` to set up iOS credentials
2. You'll need an Apple Developer account
3. EAS will help you create certificates and provisioning profiles

For Android:
1. Run `eas credentials` to set up Android credentials
2. EAS will generate a keystore for you

### Step 3: Create Development Builds
```bash
# For iOS (TestFlight)
eas build --platform ios --profile development

# For Android (Google Play Internal Testing)
eas build --platform android --profile development

# For both platforms
eas build --platform all --profile development
```

### Step 4: Distribute to Testers
1. **iOS**: Upload to TestFlight and invite testers via email
2. **Android**: Upload to Google Play Console and add testers to internal testing track

## Option 2: Expo Go (Quick Setup)

### Pros:
- No app store required
- Instant updates
- Easy to share

### Cons:
- Limited to Expo SDK features
- May not work with all native modules

### Setup:
1. Your friends install Expo Go from App Store/Google Play
2. Run `expo start` in your project
3. Share the QR code with friends
4. They scan the QR code in Expo Go

## Option 3: Development Builds (EAS)

### Create a development build:
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Distribute via:
1. **Direct download**: Share the build URL
2. **TestFlight/Google Play**: Upload the build
3. **Ad Hoc distribution**: For iOS, add device UDIDs

## Testing Workflow

### For You (Developer):
1. Make changes to your app
2. Create a new build: `eas build --profile development`
3. Distribute to testers
4. Collect feedback

### For Your Friends (Testers):
1. Install the app (via TestFlight, Google Play, or direct download)
2. Create an account
3. Test all features
4. Report bugs and feedback

## Feedback Collection

### Built-in Options:
1. **Expo Feedback**: Use `expo-feedback` package
2. **Custom feedback form**: Add to your app
3. **External tools**: TestFlight feedback, Google Play feedback

### Recommended Setup:
```bash
npm install expo-feedback
```

## Environment Configuration

### Development vs Production:
- Use different Supabase projects for testing
- Set up test user accounts
- Configure different API endpoints

### Example environment setup:
```typescript
// config/environment.ts
const isDevelopment = __DEV__;
const isBeta = process.env.EXPO_PUBLIC_BETA === 'true';

export const config = {
  supabaseUrl: isBeta ? 'your-beta-url' : 'your-prod-url',
  supabaseKey: isBeta ? 'your-beta-key' : 'your-prod-key',
};
```

## Best Practices

### 1. Version Management
- Use semantic versioning (1.0.0-beta.1)
- Tag releases in git
- Keep changelog

### 2. Testing Checklist
- [ ] Account creation works
- [ ] Login/logout works
- [ ] All onboarding steps work
- [ ] Profile creation works
- [ ] Matching system works
- [ ] Chat functionality works
- [ ] Photo upload works
- [ ] Settings work

### 3. Data Management
- Use test data for beta
- Clear sensitive data between tests
- Monitor database usage

## Troubleshooting

### Common Issues:
1. **Build fails**: Check EAS logs
2. **App crashes**: Check device logs
3. **Features don't work**: Verify all dependencies are included

### Getting Help:
- Expo Discord: https://discord.gg/expo
- EAS Documentation: https://docs.expo.dev/build/introduction/
- TestFlight Guide: https://developer.apple.com/testflight/

## Next Steps

1. Choose your preferred testing method
2. Set up EAS and credentials
3. Create your first build
4. Invite your first testers
5. Collect feedback and iterate

## Cost Breakdown

- **Expo**: Free tier available
- **Apple Developer**: $99/year (required for TestFlight)
- **Google Play**: $25 one-time (required for Google Play)
- **EAS Build**: Free tier includes 30 builds/month

Total minimum cost: $25 (Google Play only) or $99 (iOS + Android)


