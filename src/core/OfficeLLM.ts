import { createProvider, IProvider, ProviderMessage } from '../providers';
import { OfficeLLMConfig, ManagerConfig, WorkerConfig, Task, TaskResult } from '../types';

/**
 * Simplified OfficeLLM with provider-based architecture
 */
export class OfficeLLM {
  private manager: ManagerAgent;
  private workers: Map<string, WorkerAgent> = new Map();

  constructor(config: OfficeLLMConfig) {
    this.manager = new ManagerAgent(config.manager);

    // Register workers
    for (const workerConfig of config.workers) {
      const worker = new WorkerAgent(workerConfig);
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
}

/**
 * Manager agent that coordinates workers
 */
class ManagerAgent {
  public config: ManagerConfig;
  private provider: IProvider;

  constructor(config: ManagerConfig) {
    this.config = config;
    this.provider = createProvider(config.provider);
  }

  async executeTask(task: Task, workers: Map<string, WorkerAgent>): Promise<TaskResult> {
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
    const workerTools = Array.from(workers.entries()).map(([name, worker]) => ({
      name,
      description: worker.config.description || `${name} agent`,
      parameters: worker.getToolSchema(),
    }));

    try {
      const response = await this.provider.chat(messages, workerTools);

      // If the manager called a worker tool, execute it
      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolCall = response.toolCalls[0];
        const worker = workers.get(toolCall.function.name);

        if (worker) {
          const workerParams = JSON.parse(toolCall.function.arguments);
          const workerResult = await worker.execute(workerParams);

          // Continue conversation with worker result
          messages.push({
            role: 'assistant',
            content: response.content,
            toolCalls: response.toolCalls,
          });

          messages.push({
            role: 'tool',
            content: workerResult.content,
            toolCallId: toolCall.id,
          });

          // Get final response from manager
          const finalResponse = await this.provider.chat(messages, workerTools);

          return {
            success: true,
            content: finalResponse.content,
            toolCalls: response.toolCalls,
            usage: finalResponse.usage,
          };
        }
      }

      return {
        success: true,
        content: response.content,
        toolCalls: response.toolCalls,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Worker agent that executes specific tasks
 */
class WorkerAgent {
  public config: WorkerConfig;
  private provider: IProvider;

  constructor(config: WorkerConfig) {
    this.config = config;
    this.provider = createProvider(config.provider);
  }

  /**
   * Execute worker with given parameters
   */
  async execute(params: Record<string, any>): Promise<TaskResult> {
    const messages: ProviderMessage[] = [
      {
        role: 'system',
        content: this.config.systemPrompt,
      },
      {
        role: 'user',
        content: Object.entries(params)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n'),
      },
    ];

    try {
      const response = await this.provider.chat(messages, this.config.tools);

      return {
        success: true,
        content: response.content,
        toolCalls: response.toolCalls,
        usage: response.usage,
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get the tool schema for this worker (used by manager)
   */
  getToolSchema() {
    // Create a simple schema from worker parameters
    // In a real implementation, this would be more sophisticated
    return {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'The task to perform',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Task priority level',
        },
      },
      required: ['task'],
    };
  }
}
