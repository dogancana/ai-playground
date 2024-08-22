import {
  Collection,
  Filter,
  IndexDescription,
  MongoClient,
  ObjectId,
  OptionalUnlessRequiredId,
  UpdateFilter,
  Document,
} from 'mongodb';

// Base class for a MongoDB collection
export class BaseCollection<T extends Document> {
  protected collection: Collection<T>;

  constructor(
    protected client: MongoClient,
    protected dbName: string,
    protected collectionName: string,
    protected indexes: IndexDescription[] = []
  ) {
    const db = client.db(dbName);
    this.collection = db.collection<T>(collectionName);
  }

  // Create a new item
  async create(item: OptionalUnlessRequiredId<T>): Promise<T> {
    const result = await this.collection.insertOne(item);
    return { ...item, _id: result.insertedId } as T;
  }

  // Read/find items
  async find(filter: Filter<T> = {}) {
    return this.collection.find(filter).toArray();
  }

  async findOne(filter: Filter<T>) {
    return this.collection.findOne(filter);
  }

  // Read/find one item by id
  async findById(id: string) {
    return this.collection.findOne({ _id: new ObjectId(id) } as Filter<T>);
  }

  // Update an item by id
  async update(id: string, update: UpdateFilter<T>) {
    await this.collection.updateOne(
      { _id: new ObjectId(id) } as Filter<T>,
      update
    );
  }

  // Delete an item by id
  async delete(id: string): Promise<void> {
    await this.collection.deleteOne({ _id: new ObjectId(id) } as Filter<T>);
  }

  async ensureIndexes(): Promise<void> {
    this.collection.createIndexes(this.indexes);
  }
}
