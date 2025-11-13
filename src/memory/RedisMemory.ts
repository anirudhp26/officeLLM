import { BaseMemory, BaseMemoryConfig, StoredConversation, QueryOptions, IMemory } from './BaseMemory';
import { ProviderMessage } from '../providers';
import { createClient } from 'redis';
import { logger } from '../utils/logger';

/**
 * Configuration for Redis memory
 */
export interface RedisConfig extends BaseMemoryConfig {
  type: 'redis';
  host: string;
  port: number;
  tls?: boolean;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number; // Time to live in seconds (optional)
}

/**
 * Redis storage implementation
 * Requires redis package to be installed: npm install redis
 */
export class RedisMemory extends BaseMemory {
  private client: any; // Redis client (any to avoid hard dependency)
  private keyPrefix: string;
  private ttl?: number;
  private isConnected: boolean = false;
  private tls?: boolean;
  private instanceId: string;

  constructor(config: RedisConfig) {
    super(config);
    this.keyPrefix = config.keyPrefix || 'officellm:conv:';
    this.ttl = config.ttl;
    this.tls = config.tls;
    this.instanceId = config.instanceId;
    this.initializeRedis(config);
  }

  getMemoryInstance(): IMemory {
    return this;
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(config: RedisConfig): Promise<void> {
    try {
      // Build the Redis URL with optional password
      // Format: redis[s]://[[username][:password]@][host][:port][/db-number]
      let url = this.tls ? 'rediss://' : 'redis://';
      if (config.password) {
        // Redis uses default username if not specified
        url += `default:${config.password}@`;
      }
      url += `${config.host}:${config.port}`;
      if (config.db !== undefined) {
        url += `/${config.db}`;
      }

      logger.debug('REDIS', `Connecting to Redis at ${config.host}:${config.port}`);
      
      this.client = createClient({
        url: url,
      });

      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error', err);
      });

      this.client.on('connect', () => {
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      throw new Error(
        `Failed to initialize Redis client.\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Ensure Redis is connected
   */
  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }
  }

  async storeConversation(conversation: StoredConversation): Promise<void> {
    this.ensureConnected();
    
    const key = this.getConversationKey();
    const value = JSON.stringify({
      ...conversation,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    });

    if (this.ttl) {
      await this.client.setEx(key, this.ttl, value);
    } else {
      await this.client.set(key, value);
    }

    // Add to index for querying
    await this.addToIndex(conversation);
  }

  async getConversation(): Promise<StoredConversation | null> {
    this.ensureConnected();
    
    const key = this.getConversationKey();
    const value = await this.client.get(key);

    if (!value) {
      return null;
    }

    const parsed = JSON.parse(value);
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
    };
  }

  /**
   * Get a conversation by a specific ID (used internally for querying)
   */
  private async getConversationById(id: string): Promise<StoredConversation | null> {
    this.ensureConnected();
    
    const key = `${this.keyPrefix}${id}`;
    const value = await this.client.get(key);

    if (!value) {
      return null;
    }

    const parsed = JSON.parse(value);
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
    };
  }

  async updateConversation(messages: ProviderMessage[]): Promise<void> {
    this.ensureConnected();
    
    const conversation = await this.getConversation();
    if (!conversation) {
      throw new Error(`Conversation with instanceId ${this.instanceId} not found`);
    }

    conversation.messages = messages;
    conversation.updatedAt = new Date();

    await this.storeConversation(conversation);
  }

  async deleteConversation(): Promise<void> {
    this.ensureConnected();
    
    const conversation = await this.getConversation();
    if (conversation) {
      await this.removeFromIndex(conversation);
    }

    const key = this.getConversationKey();
    await this.client.del(key);
  }

  async queryConversations(options?: QueryOptions): Promise<StoredConversation[]> {
    this.ensureConnected();
    
    // Get all conversation IDs from index
    let conversationIds: string[] = [];

    if (options?.agentType && options?.agentName) {
      const indexKey = this.getIndexKey(options.agentType, options.agentName);
      conversationIds = await this.client.sMembers(indexKey);
    } else if (options?.agentType) {
      const pattern = this.getIndexKey(options.agentType, '*');
      const keys = await this.client.keys(pattern);
      for (const key of keys) {
        const ids = await this.client.sMembers(key);
        conversationIds.push(...ids);
      }
    } else {
      // Get all conversations
      const pattern = this.keyPrefix + '*';
      const keys = await this.client.keys(pattern);
      conversationIds = keys.map((key: string) => 
        key.replace(this.keyPrefix, '')
      );
    }

    // Fetch all conversations
    const conversations: StoredConversation[] = [];
    for (const id of conversationIds) {
      const conv = await this.getConversationById(id);
      if (conv) {
        conversations.push(conv);
      }
    }

    // Apply date filters
    let results = conversations;
    if (options?.startDate) {
      results = results.filter(c => c.createdAt >= options.startDate!);
    }
    if (options?.endDate) {
      results = results.filter(c => c.createdAt <= options.endDate!);
    }

    // Sort by most recent first
    results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || results.length;

    return results.slice(offset, offset + limit);
  }

  async clear(): Promise<void> {
    this.ensureConnected();
    
    // Delete all conversation keys
    const pattern = this.keyPrefix + '*';
    const keys = await this.client.keys(pattern);
    
    if (keys.length > 0) {
      await this.client.del(keys);
    }

    // Delete all index keys
    const indexPattern = this.keyPrefix + 'index:*';
    const indexKeys = await this.client.keys(indexPattern);
    
    if (indexKeys.length > 0) {
      await this.client.del(indexKeys);
    }
  }

  async getStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    oldestConversation?: Date;
    newestConversation?: Date;
  }> {
    this.ensureConnected();
    
    const conversations = await this.queryConversations();
    
    const totalMessages = conversations.reduce(
      (sum, conv) => sum + conv.messages.length,
      0
    );

    let oldestConversation: Date | undefined;
    let newestConversation: Date | undefined;

    if (conversations.length > 0) {
      const sorted = conversations.sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      );
      oldestConversation = sorted[0].createdAt;
      newestConversation = sorted[sorted.length - 1].createdAt;
    }

    return {
      totalConversations: conversations.length,
      totalMessages,
      oldestConversation,
      newestConversation,
    };
  }

  async close(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  /**
   * Get Redis key for a conversation
   */
  private getConversationKey(): string {
    return `${this.keyPrefix}${this.instanceId}`;
  }

  /**
   * Get index key for agent type and name
   */
  private getIndexKey(agentType: string, agentName: string): string {
    return `${this.keyPrefix}index:${agentType}:${agentName}`;
  }

  /**
   * Add conversation to index for efficient querying
   */
  private async addToIndex(conversation: StoredConversation): Promise<void> {
    const indexKey = this.getIndexKey(conversation.agentType, conversation.agentName);
    await this.client.sAdd(indexKey, this.instanceId);
  }

  /**
   * Remove conversation from index
   */
  private async removeFromIndex(conversation: StoredConversation): Promise<void> {
    const indexKey = this.getIndexKey(conversation.agentType, conversation.agentName);
    await this.client.sRem(indexKey, this.instanceId);
  }
}

