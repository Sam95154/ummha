# MOMIN Google Play release readiness

Last reviewed: 3 November 2026

This checklist is for the Android application `com.momin.noorulislam`. It records known repository/CI state separately from tasks that must be completed in Play Console or on a physical Android device.

## Version 1.0.2 — personal-account no-Giving release

- Giving, fundraising, crowdfunding, donation instructions, campaigns and contribution tracking are not offered in the User app or Admin panel in this release.
- Historical campaign/contribution tables and existing records are retained; no destructive database migration or record deletion is part of this release.
- The privacy policy and Terms page disclose that these features are disabled while explaining any historical financial-record retention.
- Suggested Play Store copy is maintained in `PLAY_STORE_DESCRIPTION_1.0.1.md`; make the Play Console listing consistent with that text and the tested app.
- Android build identity is `versionCode 3`, `versionName 1.0.2`.


## 1. Build identity and signed bundle

- [x] Android application ID is `com.momin.noorulislam`.
- [x] CI checks Android target SDK 36.
- [ ] Confirm the final application ID, app name, version name, and monotonically increasing version code before the first Play upload.
- [ ] Configure the real Firebase Android `google-services.json` as GitHub Actions secret `MOMIN_GOOGLE_SERVICES_JSON`. CI currently falls back to a placeholder config if it is missing.
- [ ] Create and securely retain the Play upload keystore. Never commit it to Git.
- [ ] Configure all four GitHub Actions signing secrets: `MOMIN_UPLOAD_KEYSTORE_BASE64`, `MOMIN_UPLOAD_KEYSTORE_PASSWORD`, `MOMIN_UPLOAD_KEY_ALIAS`, and `MOMIN_UPLOAD_KEY_PASSWORD`.
- [ ] Build and download the signed release AAB. The last checked Android CI run produced a debug APK; the signed AAB task was skipped because the release prerequisites were absent.
- [ ] Enrol in Play App Signing when setting up the Play Console release, and protect the upload key and recovery copy.

Google Play requires new apps and updates to target Android 16 / API 36 or higher from 31 August 2026. See the [Target API level requirements](https://support.google.com/googleplay/android-developer/answer/11926878).

## 2. Firebase and Android runtime validation

- [ ] Use a real Firebase project configured for package `com.momin.noorulislam`.
- [ ] Confirm the matching Google OAuth Android and Web client IDs and the Supabase redirect URL.
- [ ] Configure Supabase FCM sender secrets `FCM_SERVICE_ACCOUNT_JSON` and `FCM_PROJECT_ID` on the server only.
- [ ] Build with the real Firebase configuration and install that build on physical Android devices.
- [ ] Register at least one real FCM token and confirm Admin-to-User push delivery in foreground, background, locked and terminated-app states.
- [ ] Verify notification tap routing, duplicate suppression and app-inbox read/delete behaviour.
- [ ] Test Azan and prayer reminders at a controlled time, after force-close, device lock, reboot and permission changes.
- [ ] Verify exact-alarm permission behaviour and explain it clearly to the user. Review the Play policy before using `USE_EXACT_ALARM`: it is restricted to supported core use cases and requires a declaration. Evaluate `SCHEDULE_EXACT_ALARM` if the app does not meet the restricted permission criteria. See [Permissions and APIs that access sensitive information](https://support.google.com/googleplay/android-developer/answer/16558241).

Current production database inspection found zero active Android FCM tokens and zero active Web Push subscriptions. Code being deployed is not proof of successful device delivery.

## 3. Privacy, data safety and account deletion

- [x] Privacy policy and public account-deletion implementation merged in PR #25.
- [ ] Verify the live privacy page is publicly accessible over HTTPS and matches the actual production data flows.
- [ ] Verify the external account-deletion page works end-to-end and can be used without reinstalling the app.
- [ ] Verify the in-app account deletion entry point and the confirmation flow.
- [ ] Complete the Play Console Data safety form accurately, including data collected/shared, location use, user profile details, notification/device data, retention and deletion.
- [ ] Enter the public account-deletion URL in the Play Console Data safety declaration.
- [ ] Ensure the privacy policy is linked both in the Play Store listing and inside MOMIN.
- [ ] Check that privacy contact details and developer identity match the Play Console listing.

Google Play requires a privacy policy and, for apps that support account creation, a discoverable deletion path both in the app and through a public web resource. The web deletion resource must let users request deletion without having to reinstall the app. See [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311) and [Account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111).

## 4. Play Console app content and review access

- [ ] Complete the app access declaration and provide a dedicated working review/test account if any app functionality requires sign-in. Do not provide a production user's credentials.
- [ ] Complete the target-audience and content-rating declarations accurately.
- [ ] Declare whether the app contains ads.
- [ ] Review all sensitive permission declarations, especially location, notification and exact-alarm permissions.
- [ ] Add reviewer steps and, where required, a video demonstrating the app's core functionality and permission use.
- [ ] Ensure all listed features are present, working and consistent with the store listing.

See [Prepare your app for review](https://support.google.com/googleplay/android-developer/answer/9859455) and [Declare permissions for your app](https://support.google.com/googleplay/android-developer/answer/9214102).

## 5. Store listing assets

- [ ] Finalise the public developer name and support contact.
- [ ] Prepare the high-resolution app icon, feature graphic, phone screenshots, and tablet screenshots.
- [ ] Write the app title, short description and full description.
- [ ] Ensure screenshots and descriptions show only features that have passed release QA; do not advertise fundraising, donation campaigns, contribution tracking or unfinished online donation checkout; do not advertise unverified push delivery.
- [ ] Add the public privacy policy URL and support contact.
- [ ] Review all language/localisation entries before submitting.

See [Best practices for your store listing](https://support.google.com/googleplay/android-developer/answer/13393723).

## 6. Testing track and production rollout

- [ ] Install and smoke-test the signed AAB through the Play internal testing track.
- [ ] Test registration, verified login, profile completion/editing, User/Admin profile sync, prayer times, Azan, Quran, Qibla, Duas, Tasbeeh, calendar, mosque listings, notifications, complaints and account deletion.
- [ ] Test responsive layouts on phone, tablet and desktop-sized Android/tablet/Chromebook viewports where supported.
- [ ] Resolve all critical/high-severity issues and retain test evidence.
- [ ] If this is a new **personal** Play developer account created after 13 November 2023, complete a closed test with at least 12 opted-in testers continuously for 14 days before applying for production access. Confirm the account type and creation date in Play Console; this requirement is conditional, not universal.
- [ ] Apply for production access if the account is subject to the closed-testing rule.
- [ ] Roll out gradually and monitor Android vitals, crash reports, reviews and notification delivery after release.

See [Testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465).

## Current release decision

**Not ready for production submission yet.** The source has the API 36 target check, profile persistence, responsive work, privacy/account deletion, notification and Azan code. The release is blocked by real Firebase configuration, real-device notification/Azan verification, upload signing credentials, signed AAB generation, Play Console declarations, and final test evidence.

Do not treat a debug APK, mocked Admin tests, or static source checks as proof that the signed Play Store build is production-ready.
