// Mock RevenueCat Service for Expo Go compatibility
// In a real app with a dev client, you would import 'react-native-purchases'

const MOCK_PACKAGES = [
  { identifier: 'gold_yearly', packageType: 'ANNUAL', product: { title: 'Vela Gold (1 Year)', priceString: '$59.99', description: 'Billed annually at $4.99/mo' } },
  { identifier: 'gold_biannual', packageType: 'SIX_MONTH', product: { title: 'Vela Gold (6 Months)', priceString: '$47.99', description: 'Billed every 6 months at $7.99/mo' } },
  { identifier: 'gold_monthly', packageType: 'MONTHLY', product: { title: 'Vela Gold (1 Month)', priceString: '$12.99', description: 'Billed monthly' } },
];

export const Purchases = {
  configure: ({ apiKey, appUserID }) => {
    console.log(`[RevenueCat] Configured with user: ${appUserID}`);
  },
  
  getOfferings: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      current: {
        availablePackages: MOCK_PACKAGES
      }
    };
  },
  
  purchasePackage: async (pkg) => {
    console.log(`[RevenueCat] Purchasing package: ${pkg.identifier}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simulate successful purchase and updated customer info
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
        active: {} // Empty by default for mock
      }
    };
  }
};
