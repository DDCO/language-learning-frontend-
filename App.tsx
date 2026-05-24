import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { getProfiles } from './src/api/profile';
import { setupNotifications } from './src/notifications';

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { token, loading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    (async () => {
      if (!token) {
        setHasProfile(false);
        return;
      }

      setCheckingProfile(true);
      setupNotifications().catch(() => {
        // Do not block app routing on notification setup failure.
      });

      try {
        const profiles = await getProfiles();
        setHasProfile(profiles.length > 0);
      } catch {
        setHasProfile(false);
      } finally {
        setCheckingProfile(false);
      }
    })();
  }, [token]);

  if (loading || checkingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {token ? (
          hasProfile ? (
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Language Learning' }} />
          ) : (
            <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
              {() => <OnboardingScreen onComplete={() => setHasProfile(true)} />}
            </Stack.Screen>
          )
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
