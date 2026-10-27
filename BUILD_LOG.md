# Tennis Line Caller (Owl Vision) - Android Build & Diagnostics Log

**Date:** 2026-10-28  
**Status:** Build Triggered in Cloud (In Progress / Queued)  
**Active Build ID:** `60c3476a-7d8b-4145-ad01-a9bfb1ee46e9`  
**EAS Build URL:** https://expo.dev/accounts/shyambravo/projects/tennis_line_caller/builds/60c3476a-7d8b-4145-ad01-a9bfb1ee46e9

---

## 1. Summary of Tonight's Progress

1. **Packaging Strategy Selected**: Standalone Android `.apk` via Expo Application Services (EAS Build) under user account `@shyambravo/tennis_line_caller`.
2. **Permissions & Configuration**:
   - Updated `app.json` to explicitly configure `android.permission.CAMERA` and `android.permission.RECORD_AUDIO`.
   - Replaced invalid `react-native-vision-camera` config plugin reference with official `expo-camera` plugin.
   - Generated remote Android signing Keystore on Expo's secure credentials store.
3. **Dependency Conflict Resolved**:
   - Added `.npmrc` with `legacy-peer-deps=true` to ensure npm ci resolves cleanly on EAS Linux workers.
4. **Gradle Serialization Error Diagnosed & Fixed**:
   - Identified root cause of: `Field 'version' is required for type with serial name 'expo.modules.plugin.configuration.Publication' at $.modules[5].projects[0].publication`.
   - Mismatched packages (`expo-file-system@58.0.11` and `expo-image-picker@58.0.10`) were downgraded to official Expo SDK 54 versions (`~19.0.24` and `~17.0.11`).
   - Verified that `npx expo-modules-autolinking resolve --platform android` now generates complete `publication.version` strings across all modules.
   - Verified all 13 test suites (38 unit tests) pass cleanly (`npm test`).
5. **Fresh Build Queued**:
   - Pushed commit `aad93d5` and dispatched a fresh build `60c3476a-7d8b-4145-ad01-a9bfb1ee46e9` to EAS to compile overnight.

---

## 2. Root Cause Analysis of Previous Failure

### Error from EAS Build:
```
* Where:
Settings file '/home/expo/workingdir/build/android/settings.gradle' line: 32
* What went wrong:
A problem occurred evaluating settings 'android'.
> Field 'version' is required for type with serial name 'expo.modules.plugin.configuration.Publication', but it was missing at path: $.modules[5].projects[0].publication
```

### Investigation & Resolution:
1. Running `npx expo-modules-autolinking resolve --platform android` revealed that module index 5 was `expo-file-system`, which had `version: 58.0.11`.
2. Because SDK 58 versions omit publication metadata expected by SDK 54's autolinking Gradle plugin, Gradle failed during deserialization of `settings.gradle`.
3. Running `npx expo install --check` confirmed that for Expo SDK 54:
   - `expo-file-system` expected `~19.0.24`
   - `expo-image-picker` expected `~17.0.11`
   - `babel-preset-expo` expected `~54.0.10`
   - `@babel/core` expected `^7.26.0`
4. After aligning these packages in `package.json` and running `npm install`, autolinking resolved properly:
   ```json
   {
     "packageName": "expo-file-system",
     "packageVersion": "19.0.24",
     "publication": {
       "groupId": "host.exp.exponent",
       "artifactId": "expo.modules.filesystem",
       "version": "19.0.24",
       "repository": "local-maven-repo"
     }
   }
   ```

---

## 3. How to Install the App Tomorrow Morning

1. Wake up and open the EAS build link on your phone or computer:
   **https://expo.dev/accounts/shyambravo/projects/tennis_line_caller/builds/60c3476a-7d8b-4145-ad01-a9bfb1ee46e9**
2. When the status displays **Finished**, you will see:
   - A direct **Download APK** button
   - An installable **QR Code**
3. Scan the QR code or tap Download on your Android phone.
4. Tap the downloaded `.apk` file and select **Install**.
   *(If prompted by Android, toggle "Allow from this source" in Chrome/Browser settings to install external APKs).*

---

## 4. Useful Commands for Tomorrow

- **Check Build Status in Terminal:**
  ```powershell
  cd tennis_line_caller
  npx eas-cli build:view 60c3476a-7d8b-4145-ad01-a9bfb1ee46e9
  ```
- **Run Unit Tests:**
  ```powershell
  cd tennis_line_caller
  npm test
  ```
- **Start Local Expo Dev Server:**
  ```powershell
  cd tennis_line_caller
  npx expo start
  ```
