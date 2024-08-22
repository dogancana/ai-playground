import { IndexDescription, MongoClient } from 'mongodb';
import { AgentDefinition } from '../domain';
import { BaseCollection } from './collection';

export class AgentDefinitionsCollection extends BaseCollection<AgentDefinition> {
  constructor(mongodbURI: string, dbName: string) {
    const client = new MongoClient(mongodbURI);
    const indexes: IndexDescription[] = [
      { key: { name: 1 }, unique: true },
      { key: { owner_id: 1 } },
    ];

    super(client, dbName, 'agent_definitions', indexes);
  }
}
