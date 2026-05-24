const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://language-learning-backend-xtrb.onrender.com/v1';

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const googleAndroidRedirectScheme = googleAndroidClientId
  ? `com.googleusercontent.apps.${googleAndroidClientId.replace('.apps.googleusercontent.com', '')}`
  : '';

export const config = {
  apiBaseUrl,
  googleWebClientId,
  googleAndroidClientId,
  googleAndroidRedirectScheme,
};

export function isGoogleOAuthConfigured() {
  return Boolean(config.googleWebClientId && config.googleAndroidClientId);
}
