import { IndexDescription, MongoClient } from 'mongodb';
import { AgentSession } from '../domain';
import { BaseCollection } from './collection';

export class AgentSessionsCollection extends BaseCollection<AgentSession> {
  constructor(mongodbURI: string, dbName: string) {
    const client = new MongoClient(mongodbURI);
    const indexes: IndexDescription[] = [
      { key: { agent_id: 1, _id: 1 }, unique: true },
    ];

    super(client, dbName, 'agent_sessions', indexes);
  }
}
