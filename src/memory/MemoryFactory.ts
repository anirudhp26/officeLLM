import { BaseMemory, IMemory, BaseMemoryConfig, MemoryType } from './BaseMemory';
import { InMemoryStorage, InMemoryConfig } from './InMemoryStorage';
import { RedisMemory, RedisConfig } from './RedisMemory';

/**
 * Union type of all memory configurations
 */
export type MemoryConfig =
  | InMemoryConfig
  | RedisConfig;

/**
 * Memory factory for creating and managing memory providers
 */
export class MemoryFactory {
  private static memories = new Map<MemoryType, new (config: any) => IMemory>();

  // Register built-in memory providers
  static {
    this.register('in-memory', InMemoryStorage);
    this.register('redis', RedisMemory);
  }

  /**
   * Register a new memory type
   */
  static register<T extends BaseMemoryConfig>(
    type: MemoryType,
    MemoryClass: new (config: T) => IMemory
  ): void {
    this.memories.set(type, MemoryClass as any);
  }

  /**
   * Create a memory instance from configuration
   */
  static create(config: MemoryConfig): IMemory {
    const MemoryClass = this.memories.get(config.type);

    if (!MemoryClass) {
      throw new Error(
        `Memory type '${config.type}' is not registered. Available types: ${Array.from(this.memories.keys()).join(', ')}`
      );
    }

    return new MemoryClass(config);
  }

  /**
   * Get all registered memory types
   */
  static getRegisteredTypes(): MemoryType[] {
    return Array.from(this.memories.keys());
  }

  /**
   * Check if a memory type is registered
   */
  static isRegistered(type: MemoryType): boolean {
    return this.memories.has(type);
  }
}

/**
 * Helper function to create a memory provider
 */
export function createMemory(config: MemoryConfig): IMemory {
  return MemoryFactory.create(config);
}

/**
 * Helper function to register a custom memory provider
 */
export function registerMemory<T extends BaseMemoryConfig>(
  type: MemoryType,
  MemoryClass: new (config: T) => IMemory
): void {
  MemoryFactory.register(type, MemoryClass);
}

