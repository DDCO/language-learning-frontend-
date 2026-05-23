import axios from 'axios';
import { config } from '../config';

export const API_BASE_URL = config.apiBaseUrl;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export function setAuthToken(token: string | null) {
  if (!token) {
    delete api.defaults.headers.common.Authorization;
    return;
  }
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}
