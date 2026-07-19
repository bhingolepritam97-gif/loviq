import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = (Constants.executionEnvironment as string) === 'store-client' || Constants.appOwnership === 'expo';
// Skip analytics on web — @react-native-firebase/analytics uses deprecated namespaced SDK on web
const isWeb = Platform.OS === 'web';

class AnalyticsService {
  private getAnalytics() {
    if (isExpoGo || isWeb) {
      return null;
    }
    try {
      // Conditionally require to prevent Expo Go from crashing
      const analytics = require('@react-native-firebase/analytics').default;
      return analytics();
    } catch (e) {
      return null;
    }
  }

  /**
   * Tracks a screen view
   */
  async trackScreen(screenName: string, screenClass?: string) {
    try {
      const analytics = this.getAnalytics();
      if (!analytics) return;
      
      await analytics.logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (e) {
      console.warn('[AnalyticsService] Failed to track screen:', e);
    }
  }

  /**
   * Tracks a custom event
   */
  async trackEvent(eventName: string, params?: Record<string, any>) {
    try {
      const analytics = this.getAnalytics();
      if (!analytics) return;
      await analytics.logEvent(eventName, {
        platform: Platform.OS,
        ...params,
      });
    } catch (e) {
      console.warn('[AnalyticsService] Failed to track event:', e);
    }
  }

  /**
   * Sets user ID
   */
  async setUserId(userId: string) {
    try {
      const analytics = this.getAnalytics();
      if (!analytics) return;
      await analytics.setUserId(userId);
    } catch (e) {
      console.warn('[AnalyticsService] Failed to set user ID:', e);
    }
  }

  /**
   * Sets user properties
   */
  async setUserProperties(properties: Record<string, string>) {
    try {
      const analytics = this.getAnalytics();
      if (!analytics) return;
      await analytics.setUserProperties(properties);
    } catch (e) {
      console.warn('[AnalyticsService] Failed to set user properties:', e);
    }
  }
}

export default new AnalyticsService();
