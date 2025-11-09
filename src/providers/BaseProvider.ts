import { z } from 'zod';

/**
 * Supported provider types
 */
export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'openrouter';

/**
 * Base configuration for all providers
 */
export interface BaseProviderConfig {
  type: ProviderType;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any; // Allow additional provider-specific config
}

/**
 * Message format for LLM providers
 */
export interface ProviderMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

/**
 * Tool call format
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Tool definition format (functionDefinitions)
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
}

/**
 * Response from LLM provider
 */
export interface ProviderResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

/**
 * Base provider interface
 */
export interface IProvider {
  readonly type: ProviderType;
  readonly config: BaseProviderConfig;

  /**
   * Send a chat completion request
   */
  chat(
    messages: ProviderMessage[],
    tools?: ToolDefinition[]
  ): Promise<ProviderResponse>;

  /**
   * Check if the provider is available (has valid API key, etc.)
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get the provider's supported models
   */
  getSupportedModels(): string[];
}

/**
 * Abstract base provider class
 */
export abstract class BaseProvider implements IProvider {
  public readonly type: ProviderType;
  public readonly config: BaseProviderConfig;

  protected constructor(config: BaseProviderConfig) {
    this.type = config.type;
    this.config = config;
  }

  abstract chat(
    messages: ProviderMessage[],
    tools?: ToolDefinition[]
  ): Promise<ProviderResponse>;

  async isAvailable(): Promise<boolean> {
    // Basic check - can be overridden by specific providers
    return Boolean(this.config.apiKey);
  }

  abstract getSupportedModels(): string[];
}
