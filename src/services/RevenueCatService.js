// Hybrid RevenueCat Service Adapter
// Supports native 'react-native-purchases' inside development clients
// while falling back gracefully in Expo Go sandbox clients to avoid crashing.
import { Platform } from 'react-native';

const API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || 'goog_pHDyZivGMcHIsbVwZlGlaqVvExq';
const API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || 'goog_pHDyZivGMcHIsbVwZlGlaqVvExq';

const MOCK_PACKAGES = [
  { identifier: 'gold_yearly', packageType: 'ANNUAL', product: { title: 'Vela Gold (1 Year)', priceString: '$59.99', description: 'Billed annually at $4.99/mo' } },
  { identifier: 'gold_biannual', packageType: 'SIX_MONTH', product: { title: 'Vela Gold (6 Months)', priceString: '$47.99', description: 'Billed every 6 months at $7.99/mo' } },
  { identifier: 'gold_monthly', packageType: 'MONTHLY', product: { title: 'Vela Gold (1 Month)', priceString: '$12.99', description: 'Billed monthly' } },
];

let PurchasesSDK = null;
let isNativeSupported = false;

try {
  // Synchronous require to load package only if present in runtime context
  PurchasesSDK = require('react-native-purchases').default;
  isNativeSupported = true;
  console.log('[RevenueCat] Native SDK detected and loaded successfully.');
} catch (e) {
  console.log('[RevenueCat] Native purchases SDK not found (Expo Go runtime). Loading mock wrapper.');
}

const mockPurchases = {
  configure: ({ apiKey, appUserID }) => {
    console.log(`[RevenueCat Mock] Configured with user: ${appUserID}`);
  },
  
  getOfferings: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      current: {
        availablePackages: MOCK_PACKAGES
      }
    };
  },
  
  purchasePackage: async (pkg) => {
    console.log(`[RevenueCat Mock] Purchasing package: ${pkg.identifier}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      customerInfo: {
        entitlements: {
          active: {
            'gold': { identifier: 'gold', isActive: true }
          }
        }
      }
    };
  },
  
  getCustomerInfo: async () => {
    return {
      entitlements: {
        active: {}
      }
    };
  }
};

export const configureRevenueCat = (appUserID) => {
  if (isNativeSupported && PurchasesSDK) {
    const apiKey = Platform.select({
      ios: API_KEY_IOS,
      android: API_KEY_ANDROID,
      default: '',
    });
    if (apiKey) {
      try {
        PurchasesSDK.configure({ apiKey, appUserID });
      } catch (err) {
        console.warn('[RevenueCat] Failed to configure Purchases:', err.message);
      }
    }
  } else {
    mockPurchases.configure({ apiKey: 'mock', appUserID });
  }
};

export const Purchases = isNativeSupported && PurchasesSDK ? PurchasesSDK : mockPurchases;
