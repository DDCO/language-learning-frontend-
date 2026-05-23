import { api } from './client';
import { ApiEnvelope, Profile } from '../types/api';

export type CreateProfilePayload = {
  targetLanguage: string;
  interests: string[];
  checkFrequencyHours: number;
};

export async function getProfiles() {
  const res = await api.get<ApiEnvelope<Profile[]>>('/profiles');
  return res.data.data;
}

export async function createProfile(payload: CreateProfilePayload) {
  const res = await api.post<ApiEnvelope<Profile>>('/profiles', payload);
  return res.data.data;
}
