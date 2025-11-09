import { BaseProvider, BaseProviderConfig, ProviderMessage, ToolDefinition, ProviderResponse } from './BaseProvider';

/**
 * OpenAI provider configuration
 */
export interface OpenAIConfig extends BaseProviderConfig {
  type: 'openai';
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider extends BaseProvider {
  constructor(config: OpenAIConfig) {
    super(config);
  }

  async chat(messages: ProviderMessage[], tools?: ToolDefinition[]): Promise<ProviderResponse> {
    // Mock implementation for now - replace with actual OpenAI integration
    const lastMessage = messages[messages.length - 1];

    // Simple mock: if the message mentions a tool name, "call" that tool
    let toolCalls: any[] | undefined;
    if (tools && tools.length > 0) {
      const mentionedTool = tools.find(tool =>
        lastMessage.content.toLowerCase().includes(tool.name.toLowerCase())
      );

      if (mentionedTool) {
        toolCalls = [{
          id: 'call_' + Date.now(),
          type: 'function',
          function: {
            name: mentionedTool.name,
            arguments: JSON.stringify({ task: 'sample task', priority: 'medium' }),
          },
        }];
      }
    }

    return {
      content: `Mock response from ${this.config.model}: ${lastMessage.content.substring(0, 100)}...`,
      toolCalls,
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
      finishReason: 'stop',
    };
  }

  getSupportedModels(): string[] {
    return [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ];
  }

  private async getOpenAIClient() {
    // Dynamic import to avoid requiring openai package unless needed
    const { OpenAI } = await import('openai');
    return new OpenAI({
      apiKey: this.config.apiKey,
    });
  }

  private zodToJsonSchema(schema: any): any {
    // If it's already a plain object (JSON schema), return as-is
    if (typeof schema === 'object' && schema.type) {
      return schema;
    }

    // Simple conversion for Zod schemas - in production, use zod-to-json-schema
    try {
      return {
        type: 'object',
        properties: {},
        required: [],
      };
    } catch (error) {
      // Fallback to basic schema
      return {
        type: 'object',
        properties: {},
      };
    }
  }
}
