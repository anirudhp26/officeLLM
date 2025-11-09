import { BaseProvider, IProvider, BaseProviderConfig, ProviderType } from './BaseProvider';
import { OpenAIProvider, OpenAIConfig } from './OpenAIProvider';
import { AnthropicProvider, AnthropicConfig } from './AnthropicProvider';
import { GeminiProvider, GeminiConfig } from './GeminiProvider';
import { OpenRouterProvider, OpenRouterConfig } from './OpenRouterProvider';

/**
 * Union type of all provider configurations
 */
export type ProviderConfig =
  | OpenAIConfig
  | AnthropicConfig
  | GeminiConfig
  | OpenRouterConfig;

/**
 * Provider factory for creating and managing providers
 */
export class ProviderFactory {
  private static providers = new Map<ProviderType, new (config: any) => IProvider>();

  // Register built-in providers
  static {
    this.register('openai', OpenAIProvider);
    this.register('anthropic', AnthropicProvider);
    this.register('gemini', GeminiProvider);
    this.register('openrouter', OpenRouterProvider);
  }

  /**
   * Register a new provider type
   */
  static register<T extends BaseProviderConfig>(
    type: ProviderType,
    ProviderClass: new (config: T) => IProvider
  ): void {
    this.providers.set(type, ProviderClass as any);
  }

  /**
   * Create a provider instance from configuration
   */
  static create(config: ProviderConfig): IProvider {
    const ProviderClass = this.providers.get(config.type);

    if (!ProviderClass) {
      throw new Error(`Provider type '${config.type}' is not registered. Available types: ${Array.from(this.providers.keys()).join(', ')}`);
    }

    return new ProviderClass(config);
  }

  /**
   * Get all registered provider types
   */
  static getRegisteredTypes(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider type is registered
   */
  static isRegistered(type: ProviderType): boolean {
    return this.providers.has(type);
  }

  /**
   * Get supported models for a provider type
   */
  static getSupportedModels(type: ProviderType): string[] {
    const ProviderClass = this.providers.get(type);
    if (!ProviderClass) {
      return [];
    }

    // Create a temporary instance to get supported models
    // This is a bit hacky but works for our use case
    const tempConfig = {
      type,
      apiKey: 'dummy',
      model: 'dummy',
    } as BaseProviderConfig;

    try {
      const instance = new ProviderClass(tempConfig);
      return instance.getSupportedModels();
    } catch {
      return [];
    }
  }
}

/**
 * Helper function to create a provider
 */
export function createProvider(config: ProviderConfig): IProvider {
  return ProviderFactory.create(config);
}

/**
 * Helper function to register a custom provider
 */
export function registerProvider<T extends BaseProviderConfig>(
  type: ProviderType,
  ProviderClass: new (config: T) => IProvider
): void {
  ProviderFactory.register(type, ProviderClass);
}
