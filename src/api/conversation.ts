import { api } from './client';
import { ApiEnvelope } from '../types/api';

export type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type ConversationDetail = {
  id: string;
  topic: string;
  status: 'active' | 'completed' | 'archived';
  messages: ConversationMessage[];
};

export type ConversationListResponse = {
  items: ConversationDetail[];
  total: number;
  page: number;
  limit: number;
};

export async function startConversation(payload: {
  profileId: string;
  topic: string;
  contentSource?: string;
}) {
  const res = await api.post<ApiEnvelope<ConversationDetail>>('/conversations/start', payload);
  return res.data.data;
}

export async function sendMessage(
  conversationId: string,
  payload: {
    message: string;
    targetLanguage: string;
    appState?: 'active' | 'background' | 'inactive';
  },
) {
  const res = await api.post<ApiEnvelope<ConversationDetail>>(
    `/conversations/${conversationId}/messages`,
    payload,
  );
  return res.data.data;
}

export async function getConversations(params?: { page?: number; limit?: number; status?: string }) {
  const res = await api.get<ApiEnvelope<ConversationListResponse>>('/conversations', { params });
  return res.data.data;
}
