import { ProviderMessage } from '../providers';

/**
 * Supported memory types
 */
export type MemoryType = 'in-memory' | 'redis' | string;

/**
 * Base configuration for all memory providers
 */
export interface BaseMemoryConfig {
  type: MemoryType;
}

/**
 * Stored conversation with metadata
 */
export interface StoredConversation {
  id: string;
  agentType: 'manager' | 'worker';
  agentName: string;
  messages: ProviderMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Options for querying conversations
 */
export interface QueryOptions {
  agentType?: 'manager' | 'worker';
  agentName?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Base interface for memory providers
 */
export interface IMemory {
  /**
   * Store a conversation
   */
  storeConversation(conversation: StoredConversation): Promise<void>;

  /**
   * Retrieve a conversation by ID
   */
  getConversation(id: string): Promise<StoredConversation | null>;

  /**
   * Update an existing conversation
   */
  updateConversation(id: string, messages: ProviderMessage[]): Promise<void>;

  /**
   * Delete a conversation
   */
  deleteConversation(id: string): Promise<void>;

  /**
   * Query conversations with filters
   */
  queryConversations(options?: QueryOptions): Promise<StoredConversation[]>;

  /**
   * Clear all conversations (useful for testing)
   */
  clear(): Promise<void>;

  /**
   * Get memory statistics
   */
  getStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    oldestConversation?: Date;
    newestConversation?: Date;
  }>;

  /**
   * Close/cleanup memory connection
   */
  close(): Promise<void>;
}

/**
 * Abstract base class for memory providers
 */
export abstract class BaseMemory implements IMemory {
  protected config: BaseMemoryConfig;

  constructor(config: BaseMemoryConfig) {
    this.config = config;
  }

  abstract storeConversation(conversation: StoredConversation): Promise<void>;
  abstract getConversation(id: string): Promise<StoredConversation | null>;
  abstract updateConversation(id: string, messages: ProviderMessage[]): Promise<void>;
  abstract deleteConversation(id: string): Promise<void>;
  abstract queryConversations(options?: QueryOptions): Promise<StoredConversation[]>;
  abstract clear(): Promise<void>;
  abstract getStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    oldestConversation?: Date;
    newestConversation?: Date;
  }>;
  abstract close(): Promise<void>;

  /**
   * Get the memory type
   */
  getType(): MemoryType {
    return this.config.type;
  }
}

