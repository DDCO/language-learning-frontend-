const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://language-learning-backend-xtrb.onrender.com/v1';

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

export const config = {
  apiBaseUrl,
  googleWebClientId,
  googleAndroidClientId,
};

export function isGoogleOAuthConfigured() {
  return Boolean(config.googleWebClientId && config.googleAndroidClientId);
}
