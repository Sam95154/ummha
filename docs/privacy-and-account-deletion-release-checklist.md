# MOMIN privacy and account-deletion release checklist

## Public URLs
- Privacy Policy: https://noor-ul-islam-dua.onrender.com/privacy.html
- External account-deletion request: https://noor-ul-islam-dua.onrender.com/delete-account.html

These pages are in the user-app repository. They are not live until the reviewed PR is merged and the Render deployment completes.

## Required Supabase Auth redirect configuration
Before testing the external email-verification flow on the deployed website, add the following exact URL to Supabase Dashboard > Authentication > URL Configuration > Redirect URLs:

https://noor-ul-islam-dua.onrender.com/delete-account.html

Dashboard:
https://supabase.com/dashboard/project/qzwqpiquvhpjwqgaxorp/auth/url-configuration

The page uses the Supabase passwordless email flow with account creation disabled. The email link verifies account control; final deletion still invokes the existing JWT-protected momin-delete-account Edge Function. Do not disable JWT verification or place a service-role key in browser code.

## Required release testing
1. Merge only after the draft PR CI passes and the policy text has been reviewed by the service owner.
2. Deploy the Render web app and confirm both URLs return HTTP 200 without requiring authentication or app installation.
3. Test with a controlled account: request email, link callback in the same browser, correct account shown, explicit confirmation, deletion, sign-out and inability to sign in again.
4. Test unknown email, Google-linked account, expired/used link, link opened in another browser, repeated requests/rate limits and deletion-service failure. The page must never report success unless the Edge Function returns success=true.
5. Verify the existing in-app Settings > Profile > Delete account flow still works.
6. Confirm the developer/legal identity displayed in the policy matches the Google Play developer listing. No registered company name or postal address has been invented here.
7. Complete the Play Console Data safety declarations to match the final release binary and every included SDK. This policy is not a substitute for the Data safety form.
8. Have the retention exception and legal wording reviewed for the developer's legal circumstances.

## Data practices reflected in the policy
- Account and optional profile information.
- User-submitted complaints, replies and attachments.
- Device/session identifiers, FCM tokens, web-push endpoints and delivery records.
- Location, city, timezone and prayer settings used by prayer and notification features.
- Prayer/Qibla, Quran, transliteration and geocoding API requests.
- Local device preferences and reading/progress data.
- Contribution ledger records: the existing delete function detaches the account user_id but retains limited transaction fields.

## Scope and safety
This implementation reuses the existing momin-delete-account function. It does not add a public delete-by-email endpoint, deploy a new Edge Function, apply a database migration, change production configuration or deploy the app.
