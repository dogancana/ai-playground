export interface AgentDefinition {
  _id: string;
  name: string;
  owner_id: string;

  open_ai_key: string;
  system_prompt: string;
  enabled_tools: string[];
  completion_conversation_limit: number;

  created_at: Date;
  updated_at: Date;

  tavily_key?: string;
}
