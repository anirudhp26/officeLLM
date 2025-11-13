import { BaseMemory, BaseMemoryConfig, StoredConversation, QueryOptions, IMemory } from './BaseMemory';
import { ProviderMessage } from '../providers';

/**
 * Configuration for in-memory storage
 */
export interface InMemoryConfig extends BaseMemoryConfig {
  type: 'in-memory';
  maxConversations?: number; // Optional limit on stored conversations
}

/**
 * In-memory storage implementation
 * Stores conversations in memory (lost on restart)
 */
export class InMemoryStorage extends BaseMemory {
  private conversations: Map<string, StoredConversation> = new Map();
  private maxConversations: number;
  private instanceId: string;

  constructor(config: InMemoryConfig) {
    super(config);
    this.maxConversations = config.maxConversations || 1000;
    this.instanceId = config.instanceId;
  }

  getMemoryInstance(): IMemory {
    return this;
  }

  async storeConversation(conversation: StoredConversation): Promise<void> {
    // If we've hit the limit, remove the oldest conversation
    if (this.conversations.size >= this.maxConversations) {
      const oldestId = this.findOldestConversation();
      if (oldestId) {
        this.conversations.delete(oldestId);
      }
    }

    this.conversations.set(this.instanceId, {
      ...conversation,
      createdAt: new Date(conversation.createdAt),
      updatedAt: new Date(conversation.updatedAt),
    });
  }

  async getConversation(): Promise<StoredConversation | null> {
    const conversation = this.conversations.get(this.instanceId);
    return conversation ? { ...conversation } : null;
  }

  async updateConversation(messages: ProviderMessage[]): Promise<void> {
    const conversation = this.conversations.get(this.instanceId);
    if (!conversation) {
      throw new Error(`Conversation with instanceId ${this.instanceId} not found`);
    }

    conversation.messages = messages;
    conversation.updatedAt = new Date();
  }

  async deleteConversation(): Promise<void> {
    this.conversations.delete(this.instanceId);
  }

  async queryConversations(options?: QueryOptions): Promise<StoredConversation[]> {
    let results = Array.from(this.conversations.values());

    // Apply filters
    if (options?.agentType) {
      results = results.filter(c => c.agentType === options.agentType);
    }

    if (options?.agentName) {
      results = results.filter(c => c.agentName === options.agentName);
    }

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

    return results.slice(offset, offset + limit).map(c => ({ ...c }));
  }

  async clear(): Promise<void> {
    this.conversations.clear();
  }

  async getStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    oldestConversation?: Date;
    newestConversation?: Date;
  }> {
    const conversations = Array.from(this.conversations.values());
    
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
      totalConversations: this.conversations.size,
      totalMessages,
      oldestConversation,
      newestConversation,
    };
  }

  async close(): Promise<void> {
    // Nothing to close for in-memory storage
  }

  /**
   * Find the oldest conversation to remove when hitting limits
   */
  private findOldestConversation(): string | null {
    let oldestId: string | null = null;
    let oldestTime = Infinity;

    for (const [id, conv] of this.conversations.entries()) {
      const time = conv.updatedAt.getTime();
      if (time < oldestTime) {
        oldestTime = time;
        oldestId = id;
      }
    }

    return oldestId;
  }
}

