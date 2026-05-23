export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export type Profile = {
  id: string;
  targetLanguage: string;
  interests: string[];
  interestWeights: number[];
  isActive: boolean;
  checkFrequencyHours: number;
};

export type Conversation = {
  id: string;
  topic: string;
  status: 'active' | 'completed' | 'archived';
  messageCount: number;
  startedAt: string;
};

export type ConversationList = {
  items: Conversation[];
  total: number;
  page: number;
  limit: number;
};
