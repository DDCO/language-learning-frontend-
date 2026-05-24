import React, { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../context/AuthContext';
import { exchangeGoogleIdToken } from '../api/auth';
import { config, isGoogleOAuthConfigured } from '../config';

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const { signInWithToken } = useAuth();
  const [manualToken, setManualToken] = useState('');
  const redirectUri = makeRedirectUri({
    native: `${config.googleAndroidRedirectScheme}:/oauthredirect`,
  });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: config.googleWebClientId,
    androidClientId: config.googleAndroidClientId,
    redirectUri,
  });

  useEffect(() => {
    (async () => {
      if (response?.type === 'error') {
        const message =
          response.params?.error_description || response.params?.error || 'Unknown Google OAuth error';
        Alert.alert('Google sign-in failed', message);
        return;
      }

      if (response?.type !== 'success') return;
      const idToken = response.params.id_token;
      if (!idToken) {
        Alert.alert('Google sign-in failed', 'No ID token received.');
        return;
      }

      try {
        const auth = await exchangeGoogleIdToken(idToken);
        await signInWithToken(auth.access_token);
      } catch (error: any) {
        const backendMessage =
          error?.response?.data?.message || error?.message || 'Could not exchange Google token with backend.';
        Alert.alert('Login failed', String(backendMessage));
      }
    })();
  }, [response, signInWithToken]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Language Learning</Text>
      <Text style={styles.subtitle}>Sign in with Google to continue</Text>
      {!isGoogleOAuthConfigured() ? (
        <Text style={styles.warning}>
          Google OAuth is not configured in this app build.
        </Text>
      ) : null}
      <Button
        title="Continue with Google"
        disabled={!request || !isGoogleOAuthConfigured()}
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
  warning: { color: '#b45309' },
  or: { textAlign: 'center', marginVertical: 8, color: '#666' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
