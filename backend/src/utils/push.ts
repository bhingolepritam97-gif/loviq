const { Expo } = require("expo-server-sdk");

const expo = new Expo();

async function sendPushNotification(pushToken, title, body, data = {}) {
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
