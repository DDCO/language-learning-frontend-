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
  payload: { message: string; targetLanguage: string },
) {
  const res = await api.post<ApiEnvelope<ConversationDetail>>(
    `/conversations/${conversationId}/messages`,
    payload,
  );
  return res.data.data;
}
