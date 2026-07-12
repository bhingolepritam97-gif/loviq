// PushService.js — DISABLED until google-services.json is configured.
// expo-notifications requires the FCM plugin in app.json + google-services.json to work in
// standalone builds. Until those are configured, all exports are no-ops to prevent launch crashes.
//
// To re-enable push notifications:
// 1. Go to https://console.firebase.google.com and create a Firebase project for "Loviq"
// 2. Download google-services.json and place it at the project root
// 3. Add the plugin back to app.json: ["expo-notifications", { "icon": "./assets/icon.png", "color": "#ffffff" }]
// 4. Uncomment the code below and run: npx eas-cli build --platform android --profile preview

export async function registerForPushNotificationsAsync() {
  console.log('[PushService] Notifications are disabled — google-services.json not yet configured.');
  return null;
}
