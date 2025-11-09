import { ID, ToolResult } from '../types';

/**
 * Base interface for all tools that can be used by workers
 */
export interface Tool {
  id: ID;
  name: string;
  description: string;
  version: string;

  /**
   * Execute the tool with given parameters
   * @param params - Parameters for tool execution
   * @returns Promise resolving to tool result
   */
  execute(params: Record<string, any>): Promise<ToolResult>;

  /**
   * Get the schema for tool parameters
   * @returns JSON schema for tool parameters
   */
  getParameterSchema(): Record<string, any>;

  /**
   * Check if the tool is available for use
   * @returns Promise resolving to availability status
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get metadata about the tool
   * @returns Tool metadata
   */
  getMetadata(): ToolMetadata;
}

/**
 * Metadata for a tool
 */
export interface ToolMetadata {
  author: string;
  tags: string[];
  dependencies?: string[];
  permissions?: string[];
  rateLimit?: {
    requests: number;
    period: number; // in milliseconds
  };
  cost?: {
    currency: string;
    perExecution: number;
  };
}

/**
 * Base implementation of the Tool interface
 */
export abstract class BaseTool implements Tool {
  public readonly id: ID;
  public readonly name: string;
  public readonly description: string;
  public readonly version: string;

  protected metadata: ToolMetadata;

  constructor(
    id: ID,
    name: string,
    description: string,
    version: string = '1.0.0',
    metadata: Partial<ToolMetadata> = {}
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.version = version;
    this.metadata = {
      author: 'officeLLM',
      tags: [],
      ...metadata,
    };
  }

  abstract execute(params: Record<string, any>): Promise<ToolResult>;

  /**
   * Default parameter schema - should be overridden by subclasses
   */
  getParameterSchema(): Record<string, any> {
    return {
      type: 'object',
      properties: {},
      required: [],
    };
  }

  /**
   * Default availability check - can be overridden
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  getMetadata(): ToolMetadata {
    return { ...this.metadata };
  }

  /**
   * Helper method to create successful tool results
   */
  protected createSuccessResult(data: any, metadata?: Record<string, any>): ToolResult {
    return {
      success: true,
      data,
      metadata,
    };
  }

  /**
   * Helper method to create error tool results
   */
  protected createErrorResult(error: string, metadata?: Record<string, any>): ToolResult {
    return {
      success: false,
      error,
      metadata,
    };
  }

  /**
   * Validate parameters against schema
   */
  protected validateParams(params: Record<string, any>): { valid: boolean; errors?: string[] } {
    const schema = this.getParameterSchema();
    const errors: string[] = [];

    if (schema.required) {
      for (const required of schema.required) {
        if (!(required in params)) {
          errors.push(`Missing required parameter: ${required}`);
        }
      }
    }

    // Basic type checking for known properties
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in params) {
          const value = params[key];
          const expectedType = (propSchema as any).type;

          if (expectedType && typeof value !== expectedType) {
            errors.push(`Parameter ${key} should be of type ${expectedType}, got ${typeof value}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
