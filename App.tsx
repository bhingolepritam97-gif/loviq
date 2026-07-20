import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import OfflineNotice from './src/components/OfflineNotice';
import { ThemeProvider } from './src/context/ThemeContext';
import { ResponsiveProvider } from './src/context/ResponsiveContext';

export default function App() {
  return (
    <ThemeProvider>
      <ResponsiveProvider>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <AuthProvider>
            <ErrorBoundary>
              <AppNavigator />
              <OfflineNotice />
            </ErrorBoundary>
          </AuthProvider>
        </SafeAreaProvider>
      </ResponsiveProvider>
    </ThemeProvider>
  );
}
