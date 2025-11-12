// Main exports
export { OfficeLLM } from './core/OfficeLLM';

// Provider system
export {
  BaseProvider,
  IProvider,
  BaseProviderConfig,
  ProviderType,
  ProviderMessage,
  ToolCall,
  ToolDefinition,
  ProviderResponse,
} from './providers/BaseProvider';

export { OpenAIProvider, OpenAIConfig } from './providers/OpenAIProvider';
export { AnthropicProvider, AnthropicConfig } from './providers/AnthropicProvider';
export { GeminiProvider, GeminiConfig } from './providers/GeminiProvider';
export { OpenRouterProvider, OpenRouterConfig } from './providers/OpenRouterProvider';

export {
  ProviderFactory,
  createProvider,
  registerProvider,
  ProviderConfig,
} from './providers/ProviderFactory';

// Memory system
export {
  BaseMemory,
  IMemory,
  BaseMemoryConfig,
  MemoryType,
  StoredConversation,
  QueryOptions,
} from './memory/BaseMemory';

export { InMemoryStorage, InMemoryConfig } from './memory/InMemoryStorage';
export { RedisMemory, RedisConfig } from './memory/RedisMemory';

export {
  MemoryFactory,
  createMemory,
  registerMemory,
  MemoryConfig,
} from './memory/MemoryFactory';

// Types
export {
  OfficeLLMConfig,
  ManagerConfig,
  WorkerConfig,
  Task,
  TaskResult,
} from './types';

// Logger utility
export { logger, Logger, LogLevel } from './utils/logger';

// Re-export zod for convenience
export { z } from 'zod';
