import z from 'zod';
import { BaseProvider, BaseProviderConfig, ProviderMessage, ToolDefinition, ProviderResponse, ToolCall } from './BaseProvider';
import { GoogleGenerativeAI, GenerativeModel, SchemaType, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

/**
 * Gemini provider configuration
 */
export interface GeminiConfig extends BaseProviderConfig {
  type: 'gemini';
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  safetySettings?: Array<{
    category: HarmCategory;
    threshold: HarmBlockThreshold;
  }>;
}

/**
 * Gemini provider implementation
 */
export class GeminiProvider extends BaseProvider {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel | null = null;

  constructor(config: GeminiConfig) {
    super(config);
    this.client = new GoogleGenerativeAI(config.apiKey);
  }

  async chat(messages: ProviderMessage[], tools?: ToolDefinition[]): Promise<ProviderResponse> {
    try {
      // Get or create the model with tools if provided
      this.model = this.client.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          temperature: this.config.temperature ?? 0.7,
          maxOutputTokens: this.config.maxTokens ?? 2048,
          topP: this.config.topP ?? 0.8,
          topK: this.config.topK ?? 10,
        },
        tools: tools && tools.length > 0 ? [{
          functionDeclarations: tools.map(tool => this.convertToolToFunctionDeclaration(tool))
        }] : undefined,
      });

      // Convert messages to Gemini format
      const geminiMessages = this.convertMessagesToGemini(messages);

      // Start chat with history
      const chat = this.model.startChat({
        history: geminiMessages.slice(0, -1), // All but the last message go to history
      });

      // Send the last message
      const lastMessage = geminiMessages[geminiMessages.length - 1];
      const result = await chat.sendMessage(lastMessage.parts);

      const response = result.response;
      const text = response.text();

      // Extract tool calls if any
      let toolCalls: ToolCall[] | undefined;
      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        toolCalls = functionCalls.map(call => ({
          id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'function' as const,
          function: {
            name: call.name,
            arguments: JSON.stringify(call.args),
          },
        }));
      }

      // Extract usage information
      const usage = {
        promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
      };

      return {
        content: text,
        toolCalls,
        usage,
        finishReason: response.candidates?.[0]?.finishReason ?? 'stop',
      };
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Try to initialize the model to check if API key is valid
      const model = this.client.getGenerativeModel({ model: this.config.model });
      await model.generateContent('test');
      return true;
    } catch (error) {
      return false;
    }
  }

  getSupportedModels(): string[] {
    return [
      'gemini-2.5-pro',
      'gemini-2.5-flash'
    ];
  }

  /**
   * Convert officeLLM messages to Gemini format
   */
  private convertMessagesToGemini(messages: ProviderMessage[]) {
    type GeminiPart = { text: string } | { functionResponse: { name: string; response: any } } | { functionCall: { name: string; args: any } };
    const geminiMessages: Array<{ role: 'user' | 'model'; parts: GeminiPart[] }> = [];

    let i = 0;
    while (i < messages.length) {
      const message = messages[i];

      switch (message.role) {
        case 'system':
          // Gemini doesn't have system messages, so we'll add it to the first user message
          geminiMessages.push({
            role: 'user',
            parts: [{ text: `System: ${message.content}` }]
          });
          i++;
          break;

        case 'user':
          geminiMessages.push({
            role: 'user',
            parts: [{ text: message.content }]
          });
          i++;
          break;

        case 'assistant':
          const assistantParts: GeminiPart[] = [];

          // Add text content if present
          if (message.content) {
            assistantParts.push({ text: message.content });
          }

          // Handle tool calls in assistant messages
          if (message.toolCalls && message.toolCalls.length > 0) {
            for (const toolCall of message.toolCalls) {
              assistantParts.push({
                functionCall: {
                  name: toolCall.function.name,
                  args: JSON.parse(toolCall.function.arguments),
                }
              });
            }
          }

          // Only add if there are parts
          if (assistantParts.length > 0) {
            geminiMessages.push({
              role: 'model',
              parts: assistantParts
            });
          }
          i++;

          // Now look ahead for tool response messages and group them
          // Note: Gemini API doesn't allow functionResponse in user messages,
          // so we always send tool responses as plain text
          const toolResponseParts: GeminiPart[] = [];
          while (i < messages.length && messages[i].role === 'tool') {
            const toolMessage = messages[i];
            const toolCall = message.toolCalls?.find(tc => tc.id === toolMessage.toolCallId);
            const toolName = toolCall ? toolCall.function.name : 'unknown_tool';
            
            // Always use text format for tool responses to avoid Gemini API errors
            toolResponseParts.push({
              text: `Tool ${toolName} result:\n${toolMessage.content}`
            });
            i++;
          }

          // Add tool responses as a separate user message
          if (toolResponseParts.length > 0) {
            geminiMessages.push({
              role: 'user',
              parts: toolResponseParts
            });
          }
          break;

        case 'tool':
          // Tool messages are handled above when processing assistant messages
          i++;
          break;

        default:
          i++;
          continue;
      }
    }

    return geminiMessages;
  }

  /**
   * Recursively remove additionalProperties and other unsupported fields from JSON schema
   * Gemini API doesn't support these fields, so we need to clean them out
   */
  private cleanSchemaForGemini(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanSchemaForGemini(item));
    }

    // Create a new object without the unsupported fields
    const cleaned: any = {};

    for (const key in obj) {
      // Skip unsupported fields
      if (key === 'additionalProperties' || key === '$schema' || key === 'definitions') {
        continue;
      }

      const value = obj[key];

      // Recursively clean nested objects and arrays
      if (value && typeof value === 'object') {
        cleaned[key] = this.cleanSchemaForGemini(value);
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  /**
   * Convert ToolDefinition to Gemini FunctionDeclaration
   */
  private convertToolToFunctionDeclaration(tool: ToolDefinition) {
    const schema = z.toJSONSchema(tool.parameters) as any;
    
    // Clean the schema to remove all additionalProperties fields recursively
    const cleanedSchema = this.cleanSchemaForGemini(schema);
    
    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: cleanedSchema.properties || {},
        required: cleanedSchema.required || [],
      },
    };
  }
}
