import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import { CreditsProvider } from './src/context/CreditsContext';
import AppNavigator from './src/navigation/AppNavigator';
import './src/config/i18n'; // Initialize i18n

console.log('[App] ===== APP STARTING v2 =====');

function App(): React.JSX.Element {
  console.log('[App] App component rendering');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CreditsProvider>
          <AppNavigator />
        </CreditsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

export default App;
