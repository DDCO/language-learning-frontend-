import { api } from './client';

export async function registerDeviceToken(token: string, platform: 'android' | 'ios') {
  await api.post('/notifications/register-device', { token, platform });
}
