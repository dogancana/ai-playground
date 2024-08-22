import { ConversationMessage } from '@/agent';

export interface AgentSession {
  _id: string;
  agent_id: string;

  conversation: ConversationMessage[];

  created_at: Date;
  updated_at: Date;
}
