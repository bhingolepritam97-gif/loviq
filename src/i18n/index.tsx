import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from './en.json';
import mr from './mr.json';

const i18n = new I18n({
  en,
  mr
});

// Set default fallback
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

// Get device locale (e.g. "en-US", "mr-IN")
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';

// Set active locale (we will override this via AsyncStorage in App.js)
i18n.locale = deviceLanguage;

export default i18n;
