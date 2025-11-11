/**
 * Core type definitions for the officeLLM multi-agent architecture
 */

import { ProviderConfig, ToolDefinition } from '../providers';

/**
 * Represents a unique identifier for agents, tasks, and messages
 */
export type ID = string;

/**
 * Represents the status of a task execution
 */
export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';


/**
 * Represents a message exchanged between agents
 */
export interface Message {
  id: ID;
  from: ID;
  to: ID;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Represents the result of a tool execution
 */
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Represents the configuration for an LLM model
 */
export interface LLMConfig {
  provider: string;
  model: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  customParams?: Record<string, any>;
}

/**
 * Represents the expertise areas of a worker
 */
export interface Expertise {
  domain: string;
  skills: string[];
  confidence: number; // 0-1 scale
}

// Old Task interface removed - using simplified Task interface below

/**
 * Represents the context passed between agents
 */
export interface AgentContext {
  taskId: ID;
  messages: Message[];
  sharedMemory: Map<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Represents the decision made by a manager about task routing
 */
export interface RoutingDecision {
  workerId: ID;
  reasoning: string;
  confidence: number;
  alternativeWorkers?: ID[];
  estimatedDuration?: number;
}

/**
 * Represents performance metrics for agents
 */
export interface PerformanceMetrics {
  tasksCompleted: number;
  averageExecutionTime: number;
  successRate: number;
  errorRate: number;
  lastActivity: Date;
  expertiseMatches: number;
}

/**
 * Manager configuration
 */
export interface ManagerConfig {
  name: string;
  description: string;
  provider: ProviderConfig;
  systemPrompt: string;
  maxIterations?: number;
  contextWindow?: number;
  /**
   * @deprecated - tools are no longer supported (workers are served as tools to the manager)
   */
  // tools?: ToolDefinition[];
}

export interface ToolImplementation {
  (args: any): Promise<string>;
}

/**
 * Worker configuration
 */
export interface WorkerConfig {
  name: string;
  description?: string;
  provider: ProviderConfig;
  systemPrompt: string;
  tools?: ToolDefinition[];
  /**
   * Tool implementations - USER MUST PROVIDE
   * 
   * Map of tool names to their implementations. Each tool defined in `tools`
   * The parameters of each tool must be a ZodSchema.
   * MUST have a corresponding implementation here.
   * 
   * @example
   * ```typescript
   * toolImplementations: {
   *   web_search: async (args) => {
   *     const results = await searchAPI(args.query);
   *     return formatResults(results);
   *   },
   *   calculate: async (args) => {
   *     const result = math.evaluate(args.expression);
   *     return `Result: ${result}`;
   *   }
   * }
   * ```
   */
  toolImplementations?: Record<string, ToolImplementation>;
  maxIterations?: number;
  contextWindow?: number;
}

/**
 * OfficeLLM configuration
 */
export interface OfficeLLMConfig {
  manager: ManagerConfig;
  workers: WorkerConfig[];
}

/**
 * Task priority levels
 */
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * Task definition for simplified execution
 */
export interface Task {
  title: string;
  description: string;
  priority?: TaskPriority;
  [key: string]: any; // Allow additional task-specific parameters
}

/**
 * Task execution result
 */
export interface TaskResult {
  success: boolean;
  content: string;
  toolCalls?: any[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}
