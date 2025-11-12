import z from 'zod';
import { createProvider, IProvider, ProviderMessage } from '../providers';
import { OfficeLLMConfig, ManagerConfig, WorkerConfig, Task, TaskResult, ToolImplementation } from '../types';
import { logger } from '../utils/logger';
import { createMemory, IMemory, StoredConversation } from '../memory';
import { randomUUID } from 'crypto';

/**
 * OfficeLLM - Multi-Agent AI Framework with Continuous Execution
 * 
 * This framework enables building complex AI systems where:
 * - A manager agent coordinates and delegates tasks to worker agents
 * - Worker agents have specialized tools and execute autonomously
 * - Execution continues until agents signal completion (by not calling more tools)
 * - Users provide tool implementations for maximum flexibility
 * 
 * @example
 * ```typescript
 * const office = new OfficeLLM({
 *   manager: { ... },
 *   workers: [
 *     {
 *       name: 'calculator',
 *       tools: [...],
 *       toolImplementations: {
 *         calculate: async (args) => { return result; }
 *       }
 *     }
 *   ]
 * });
 * 
 * const result = await office.executeTask({
 *   title: 'Task title',
 *   description: 'Task description'
 * });
 * ```
 */
export class OfficeLLM {
  private manager: ManagerAgent;
  private workers: Map<string, WorkerAgent> = new Map();
  private memory?: IMemory;

  constructor(config: OfficeLLMConfig) {
    // Initialize memory if provided
    if (config.memory) {
      this.memory = createMemory(config.memory);
      logger.info('OFFICELLM', `Memory initialized: ${config.memory.type}`);
    }

    this.manager = new ManagerAgent(config.manager, this.memory);

    // Register workers
    for (const workerConfig of config.workers) {
      const worker = new WorkerAgent(workerConfig, this.memory);
      this.workers.set(workerConfig.name, worker);
    }
  }

  /**
   * Execute a task through the manager
   */
  async executeTask(task: Task): Promise<TaskResult> {
    return this.manager.executeTask(task, this.workers);
  }

  /**
   * Call a specific worker directly
   */
  async callWorker(workerName: string, params: Record<string, any>): Promise<TaskResult> {
    const worker = this.workers.get(workerName);
    if (!worker) {
      throw new Error(`Worker '${workerName}' not found`);
    }

    return worker.execute(params);
  }

  /**
   * Get available workers
   */
  getWorkers(): string[] {
    return Array.from(this.workers.keys());
  }

  /**
   * Get manager info
   */
  getManager(): { name: string; description: string } {
    return {
      name: this.manager.config.name,
      description: this.manager.config.description,
    };
  }

  /**
   * Get memory instance
   */
  getMemory(): IMemory | undefined {
    return this.memory;
  }

  /**
   * Close memory connection and cleanup
   */
  async close(): Promise<void> {
    if (this.memory) {
      await this.memory.close();
      logger.info('OFFICELLM', 'Memory connection closed');
    }
  }
}

/**
 * Manager agent that coordinates workers
 */
class ManagerAgent {
  public config: ManagerConfig;
  private provider: IProvider;
  private maxIterations: number;
  private contextWindow: number;
  private memory?: IMemory;

  constructor(config: ManagerConfig, memory?: IMemory) {
    this.config = config;
    this.provider = createProvider(config.provider);
    this.maxIterations = config.maxIterations || 20;
    this.contextWindow = config.contextWindow || 10; // 10 messages
    this.memory = memory;
  }

  async executeTask(task: Task, workers: Map<string, WorkerAgent>): Promise<TaskResult> {
    // Generate a unique conversation ID for this task
    const conversationId = randomUUID();
    
    const messages: ProviderMessage[] = [
      {
        role: 'system',
        content: this.config.systemPrompt,
      },
      {
        role: 'user',
        content: `Task: ${task.title}\n\nDescription: ${task.description}\n\nPriority: ${task.priority || 'medium'}`,
      },
    ];

    // Create tool definitions for available workers
    const workerTools = Array.from(workers.entries())
      .filter(([name]) => !this.config.restrictedWorkers || !this.config.restrictedWorkers.includes(name)) // filter out restricted workers
      .map(([name, worker]) => ({
          name,
          description: worker.config.description || `${name} agent`,
          parameters: worker.getToolSchema(),
      }));

    let iteration = 0;
    let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    try {
      while (iteration < this.maxIterations) {
        iteration++;
        logger.info('MANAGER', `Iteration ${iteration}/${this.maxIterations}`);

      const response = await this.provider.chat(messages, workerTools);

        // Accumulate usage
        if (response.usage) {
          totalUsage.promptTokens += response.usage.promptTokens;
          totalUsage.completionTokens += response.usage.completionTokens;
          totalUsage.totalTokens += response.usage.totalTokens;
        }

        logger.debug('MANAGER', `Response: ${response.content}`);
        logger.info('MANAGER', `Tool calls requested: ${response.toolCalls?.length || 0}`);

        // If no tool calls, the manager has finished
        if (!response.toolCalls || response.toolCalls.length === 0) {
          logger.info('MANAGER', 'Task completed - no more tool calls needed');
          
          // Store conversation in memory if available
          if (this.memory) {
            await this.storeConversation(conversationId, messages);
          }
          
          return {
            success: true,
            content: response.content,
            usage: totalUsage,
          };
        }

        // Add assistant message to history
          messages.push({
            role: 'assistant',
            content: response.content,
            toolCalls: response.toolCalls,
          });

        // Execute all tool calls (workers)
        for (const toolCall of response.toolCalls) {
          const worker = workers.get(toolCall.function.name);
          
          if (worker && (!this.config.restrictedWorkers || !this.config.restrictedWorkers.includes(toolCall.function.name))) { // check if worker is not restricted
            logger.info('MANAGER', `Executing worker: ${toolCall.function.name}`);
            const workerParams = JSON.parse(toolCall.function.arguments);
            logger.debug('MANAGER', `Worker parameters: ${JSON.stringify(workerParams)}`);
            
            const workerResult = await worker.execute(workerParams);
            
            logger.debug('MANAGER', `Worker result: ${workerResult.content}`);
            
            // Accumulate worker usage
            if (workerResult.usage) {
              totalUsage.promptTokens += workerResult.usage.promptTokens;
              totalUsage.completionTokens += workerResult.usage.completionTokens;
              totalUsage.totalTokens += workerResult.usage.totalTokens;
            }

            // Add worker result as tool response
            messages.push({
              role: 'tool',
              content: workerResult.success 
                ? workerResult.content 
                : `Error: ${workerResult.error}`,
              toolCallId: toolCall.id,
            });
          } else {
            // Worker not found - add error message
            logger.error('MANAGER', `Worker not found or restricted: ${toolCall.function.name}`);
          messages.push({
            role: 'tool',
              content: `Error: Worker '${toolCall.function.name}' not found or restricted`,
            toolCallId: toolCall.id,
          });
          }
        }

        // Continue to next iteration - manager will decide what to do next
      }

      // Max iterations reached
      logger.warn('MANAGER', `Maximum iterations (${this.maxIterations}) reached`);
      
      // Store conversation in memory if available
      if (this.memory) {
        await this.storeConversation(conversationId, messages);
      }
      
      return {
        success: true,
        content: 'Task execution stopped: Maximum iterations reached. Partial results may be available.',
        usage: totalUsage,
      };

    } catch (error) {
      logger.error('MANAGER', 'Execution failed', error);
      
      // Store conversation in memory even on error if available
      if (this.memory) {
        await this.storeConversation(conversationId, messages);
      }
      
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        usage: totalUsage,
      };
    }
  }

  /**
   * Store conversation in memory
   */
  private async storeConversation(conversationId: string, messages: ProviderMessage[]): Promise<void> {
    if (!this.memory) return;

    try {
      const conversation: StoredConversation = {
        id: conversationId,
        agentType: 'manager',
        agentName: this.config.name,
        messages: messages,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          maxIterations: this.maxIterations,
          provider: this.config.provider.type,
          model: this.config.provider.model,
        },
      };

      await this.memory.storeConversation(conversation);
      logger.debug('MANAGER', `Conversation ${conversationId} stored in memory`);
    } catch (error) {
      logger.error('MANAGER', 'Failed to store conversation in memory', error);
    }
  }
}

/**
 * Worker agent that executes specific tasks
 */
class WorkerAgent {
  public config: WorkerConfig;
  private provider: IProvider;
  private toolImplementations: Record<string, ToolImplementation>;
  private messages: ProviderMessage[] = [];
  private maxIterations: number;
  private contextWindow: number;
  private memory?: IMemory;
  
  constructor(config: WorkerConfig, memory?: IMemory) {
    this.config = config;
    this.provider = createProvider(config.provider);
    this.toolImplementations = config.toolImplementations || {};
    this.maxIterations = config.maxIterations || 25;
    this.contextWindow = config.contextWindow || 10;
    this.memory = memory;
  }

  /**
   * Execute worker with given parameters
   */
  async execute(params: Record<string, any>): Promise<TaskResult> {
    // Generate a unique conversation ID for this worker execution
    const conversationId = randomUUID();
    
    this.messages.push(
      {
        role: 'system',
        content: this.config.systemPrompt,
      },
      {
        role: 'user',
        content: Object.entries(params)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join('\n'),
      }
    );

    let iteration = 0;
    let totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    try {
      while (iteration < this.maxIterations) {
        iteration++;
        logger.info(`WORKER:${this.config.name}`, `Iteration ${iteration}/${this.maxIterations}`);

      const response = await this.provider.chat(this.messages, this.config.tools);

        // Accumulate usage
        if (response.usage) {
          totalUsage.promptTokens += response.usage.promptTokens;
          totalUsage.completionTokens += response.usage.completionTokens;
          totalUsage.totalTokens += response.usage.totalTokens;
        }

        logger.debug(`WORKER:${this.config.name}`, `Response: ${response.content}`);
        logger.info(`WORKER:${this.config.name}`, `Tool calls requested: ${response.toolCalls?.length || 0}`);

        // If no tool calls, the worker has finished
        if (!response.toolCalls || response.toolCalls.length === 0) {
          logger.info(`WORKER:${this.config.name}`, 'Completed - no more tool calls needed');
          
          // Store conversation in memory if available
          if (this.memory) {
            await this.storeConversation(conversationId, this.messages);
          }
          
          return {
            success: true,
            content: response.content,
            usage: totalUsage,
          };
        }

        // Add assistant message to history
        this.messages.push({
          role: 'assistant',
          content: response.content,
          toolCalls: response.toolCalls,
        });

        // Execute all tool calls
        for (const toolCall of response.toolCalls) {
          logger.info(`WORKER:${this.config.name}`, `Executing tool: ${toolCall.function.name}`);
          
          const toolResult = await this.executeTool(
            toolCall.function.name,
            JSON.parse(toolCall.function.arguments)
          );
          
          logger.debug(`WORKER:${this.config.name}`, `Tool result: ${toolResult}`);

          // Add tool result as tool response
          this.messages.push({
            role: 'tool',
            content: toolResult,
            toolCallId: toolCall.id,
          });
        }

        // Continue to next iteration - worker will decide what to do next
      }
      
      // Max iterations reached
      logger.warn(`WORKER:${this.config.name}`, `Maximum iterations (${this.maxIterations}) reached`);
      
      // Store conversation in memory if available
      if (this.memory) {
        await this.storeConversation(conversationId, this.messages);
      }
      
      return {
        success: true,
        content: 'Worker execution stopped: Maximum iterations reached. Partial results may be available.',
        usage: totalUsage,
      };

    } catch (error) {
      logger.error(`WORKER:${this.config.name}`, 'Execution failed', error);
      
      // Store conversation in memory even on error if available
      if (this.memory) {
        await this.storeConversation(conversationId, this.messages);
      }
      
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        usage: totalUsage,
      };
    }
  }

  /**
   * Store conversation in memory
   */
  private async storeConversation(conversationId: string, messages: ProviderMessage[]): Promise<void> {
    if (!this.memory) return;

    try {
      const conversation: StoredConversation = {
        id: conversationId,
        agentType: 'worker',
        agentName: this.config.name,
        messages: messages,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          maxIterations: this.maxIterations,
          provider: this.config.provider.type,
          model: this.config.provider.model,
          tools: this.config.tools?.map(t => t.name),
        },
      };

      await this.memory.storeConversation(conversation);
      logger.debug(`WORKER:${this.config.name}`, `Conversation ${conversationId} stored in memory`);
    } catch (error) {
      logger.error(`WORKER:${this.config.name}`, 'Failed to store conversation in memory', error);
    }
  }

  /**
   * Execute a tool call (for workers that have access to tools)
   */
  private async executeTool(toolName: string, args: Record<string, any>): Promise<string> {
    // Check if user provided an implementation for this tool
    if (this.toolImplementations[toolName]) {
      try {
        return await this.toolImplementations[toolName](args);
      } catch (error) {
        return `Error executing tool "${toolName}": ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    // No implementation provided - return error message
    const errorMessage = `Tool "${toolName}" has no implementation provided. Please add the tool implementation to the worker configuration.`;
    logger.error(`WORKER:${this.config.name}`, errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * Get the tool schema for this worker (used by manager)
   */
  getToolSchema() {
    // Create a simple schema from worker parameters
    // In a real implementation, this would be more sophisticated
    return z.object({
      task: z.string().describe('The task to perform, in detail'),
      context: z.string().describe('The context of the task'),
      metadata: z.object({}).describe('The metadata of the task').required(),
      priority: z.enum(['low', 'medium', 'high']).describe('Task priority level').default('high'),
    });
  }
}
