import { api } from './client';
import { ApiEnvelope } from '../types/api';

export type AuthPayload = {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

export async function exchangeGoogleIdToken(idToken: string) {
  const res = await api.post<ApiEnvelope<AuthPayload>>('/auth/google/mobile', { idToken });
  return res.data.data;
}
