import { api } from './client';
import { ApiEnvelope, Profile } from '../types/api';

export type CreateProfilePayload = {
  targetLanguage: string;
  interests: string[];
  checkFrequencyHours: number;
  topicSources?: {
    source: string;
    items: string[];
  }[];
};

export async function getProfiles() {
  const res = await api.get<ApiEnvelope<Profile[]>>('/profiles');
  return res.data.data;
}

export async function createProfile(payload: CreateProfilePayload) {
  const res = await api.post<ApiEnvelope<Profile>>('/profiles', payload);
  return res.data.data;
}

export async function updateProfileInterests(
  profileId: string,
  interests: string[],
  topicSources?: {
    source: string;
    items: string[];
  }[],
) {
  const res = await api.patch<ApiEnvelope<Profile>>(`/profiles/${profileId}/interests`, {
    interests,
    topicSources,
  });
  return res.data.data;
}

export async function updateProfileCheckFrequency(profileId: string, hours: number) {
  const res = await api.patch<ApiEnvelope<Profile>>(`/profiles/${profileId}/check-frequency`, { hours });
  return res.data.data;
}
