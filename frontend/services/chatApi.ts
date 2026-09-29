import { apiClient } from './apiClient';

export interface ChatReply {
  reply: string;
  groundingContext?: Record<string, unknown>;
}

export const chatApi = {
  sendMessage: async (message: string, history: Array<{ role: string; content: string }> = []): Promise<ChatReply> => {
    return apiClient.post<ChatReply>('/chat', { message, history });
  },
};
