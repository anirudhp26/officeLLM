import { v4 as uuidv4 } from 'uuid';
import { BaseTool } from './Tool';
import { ToolResult } from '../types';

/**
 * Tool for performing mathematical calculations
 */
export class CalculatorTool extends BaseTool {
  constructor() {
    super(
      uuidv4(),
      'calculator',
      'Perform mathematical calculations',
      '1.0.0',
      {
        author: 'officeLLM',
        tags: ['math', 'calculation', 'computation'],
      }
    );
  }

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const validation = this.validateParams(params);
    if (!validation.valid) {
      return this.createErrorResult(`Invalid parameters: ${validation.errors?.join(', ')}`);
    }

    const { expression } = params;

    try {
      // Use Function constructor for safe evaluation
      // In production, consider using a proper math expression parser
      const result = this.safeEvaluate(expression);

      return this.createSuccessResult(
        {
          expression,
          result,
        },
        {
          evaluatedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      return this.createErrorResult(
        `Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  getParameterSchema(): Record<string, any> {
    return {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate (e.g., "2 + 3 * 4")',
          minLength: 1,
        },
      },
      required: ['expression'],
    };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Safely evaluate mathematical expressions
   * This is a basic implementation - for production use a proper math parser
   */
  private safeEvaluate(expression: string): number {
    // Remove any potentially dangerous characters
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');

    // Use a whitelist of allowed operations
    const allowedPattern = /^[\d\s+\-*/().]+$/;

    if (!allowedPattern.test(sanitized)) {
      throw new Error('Invalid characters in expression');
    }

    try {
      // Use Function constructor as a safer alternative to eval
      const func = new Function('return ' + sanitized);
      const result = func();

      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Expression did not evaluate to a valid number');
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to evaluate expression: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
