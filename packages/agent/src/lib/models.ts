import OpenAI from 'openai';

/**
 * From agent perspective, a user is a party in a conversation.
 * It can be a human or a bot.
 */
export interface User {
  id: string;
  name: string;
  isBot: boolean;
}

export interface ConversationMessage {
  user?: User;
  timestamp: Date;
  messageParam: OpenAI.ChatCompletionMessageParam;
}

export interface AgentConfig {
  OPENAI_API_KEY: string;
  model: string;
  limit: number;
  addDateToSystemPrompt: boolean;
}
