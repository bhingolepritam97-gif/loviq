let Expo: any;
let expo: any;
try {
  const expoSdk = require("expo-server-sdk");
  Expo = expoSdk.Expo;
  if (Expo) expo = new Expo();
} catch (e) {
  console.warn("[push] expo-server-sdk fallback active");
}

async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!expo || !Expo) {
    console.log(`[push-fallback] Notification to ${pushToken}: ${title} - ${body}`);
    return;
  }
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  const message = {
    to: pushToken,
    sound: "default",
    title,
    body,
    data,
  };

  try {
    const receipts = await expo.sendPushNotificationsAsync([message]);
    console.log("Push notification sent:", receipts);
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

module.exports = { sendPushNotification };

export {};
