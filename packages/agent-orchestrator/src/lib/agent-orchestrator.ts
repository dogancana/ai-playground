import {
  AgentDefinitionsCollection,
  AgentSessionsCollection,
} from './collections';

export class AgentOrchestrator {
  private prepared = false;

  constructor(
    private definitions: AgentDefinitionsCollection,
    private sessions: AgentSessionsCollection
  ) {}

  async prepare() {
    await this.definitions.ensureIndexes();
    await this.sessions.ensureIndexes();
    this.prepared = true;
  }

  async getAgentSession(agentName: string, sessionId: string) {
    if (!this.prepared) throw new Error('Agent orchestrator not prepared');

    const agent = await this.definitions.findOne({ name: agentName });
    if (!agent) throw new Error('Agent not found');

    const session = await this.sessions.findOne({
      agent_id: agent._id,
      session_id: sessionId,
    });
    if (!session) throw new Error('Session not found');

    return { agent, session };
  }
}
