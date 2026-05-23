import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../context/AuthContext';
import { exchangeGoogleIdToken } from '../api/auth';
import { config } from '../config';

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const { signInWithToken } = useAuth();
  const [manualToken, setManualToken] = useState('');

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: config.googleWebClientId,
    androidClientId: config.googleAndroidClientId,
  });

  useEffect(() => {
    (async () => {
      if (response?.type !== 'success') return;
      const idToken = response.params.id_token;
      if (!idToken) {
        Alert.alert('Google sign-in failed', 'No ID token received.');
        return;
      }

      try {
        const auth = await exchangeGoogleIdToken(idToken);
        await signInWithToken(auth.access_token);
      } catch {
        Alert.alert('Login failed', 'Could not exchange Google token with backend.');
      }
    })();
  }, [response, signInWithToken]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Language Learning</Text>
      <Text style={styles.subtitle}>Sign in with Google to continue</Text>
      <Button
        title="Continue with Google"
        disabled={!request}
        onPress={() => promptAsync()}
      />

      <Text style={styles.or}>or paste access token</Text>
      <TextInput
        value={manualToken}
        onChangeText={setManualToken}
        placeholder="eyJhbGciOi..."
        autoCapitalize="none"
        style={styles.input}
      />
      <Button
        title="Use token"
        onPress={async () => {
          if (!manualToken.trim()) {
            Alert.alert('Missing token', 'Paste an access token first.');
            return;
          }
          await signInWithToken(manualToken.trim());
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#555' },
  or: { textAlign: 'center', marginVertical: 8, color: '#666' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
