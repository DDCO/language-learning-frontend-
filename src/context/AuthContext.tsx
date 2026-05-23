import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { setAuthToken } from '../api/client';

type AuthContextValue = {
  token: string | null;
  loading: boolean;
  signInWithToken: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = 'll_auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      setToken(stored);
      setAuthToken(stored);
      setLoading(false);
    })();
  }, []);

  const value = useMemo(
    () => ({
      token,
      loading,
      signInWithToken: async (nextToken: string) => {
        await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
        setToken(nextToken);
        setAuthToken(nextToken);
      },
      signOut: async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setToken(null);
        setAuthToken(null);
      },
    }),
    [token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
