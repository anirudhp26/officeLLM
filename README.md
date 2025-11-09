# officeLLM

A TypeScript library for building multi-model agentic architectures with managers and workers.

[![npm version](https://badge.fury.io/js/officellm.svg)](https://badge.fury.io/js/officellm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## Overview

officeLLM provides a simplified framework for building multi-agent AI systems with:

- **Manager Agents** that coordinate and delegate tasks to specialized workers
- **Worker Agents** that execute domain-specific tasks using their own tools
- **Provider System** supporting OpenAI, Anthropic, Gemini, and OpenRouter
- **Type-Safe Configuration** with full TypeScript support and Zod validation
- **Simplified API** for easy integration and rapid development
- **Extensible Tool System** for custom functionality

## Features

- 🏢 **Simplified Multi-Agent Architecture**: Manager coordinates specialized worker agents
- 🛠️ **Extensible Tool System**: Easy-to-implement tools with type-safe parameters
- 🔌 **Provider System**: Support for OpenAI, Anthropic, Gemini, and OpenRouter
- 🎯 **Intelligent Task Delegation**: Manager analyzes tasks and delegates to appropriate workers
- 📊 **Performance Tracking**: Built-in metrics and usage monitoring
- 🔧 **TypeScript First**: Full type safety with Zod validation and excellent DX
- 📚 **Production Ready**: Comprehensive error handling and logging
- ⚡ **Easy Integration**: Simple constructor-based setup

## Installation

```bash
npm install officellm
```

## Quick Start

```typescript
import { OfficeLLM } from 'officellm';
import { z } from 'zod';

// Define worker configurations
const mathWorker = {
  name: 'Math Solver',
  description: 'Specialized in mathematical calculations and equation solving',
  provider: {
    type: 'openai' as const,
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4',
    temperature: 0.1,
  },
  systemPrompt: 'You are a mathematical expert. Solve problems step by step and provide clear explanations.',
  tools: [
    {
      name: 'calculate',
      description: 'Perform mathematical calculations',
      parameters: z.object({
        expression: z.string().describe('The mathematical expression to evaluate'),
      }),
    },
    {
      name: 'analyze_equation',
      description: 'Analyze and solve equations',
      parameters: z.object({
        equation: z.string().describe('The equation to analyze'),
        variables: z.array(z.string()).optional().describe('Variables in the equation'),
      }),
    },
  ],
};

// Manager configuration
const manager = {
  name: 'Project Manager',
  description: 'Coordinates and delegates tasks to specialized AI worker agents',
  provider: {
    type: 'anthropic' as const,
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-3-sonnet-20240229',
    temperature: 0.7,
  },
  systemPrompt: `You are a project manager coordinating a team of specialized AI agents.
When given a task, analyze it and delegate to the appropriate worker agent.
Always provide clear instructions and coordinate between workers when needed.`,
  tools: [
    {
      name: 'math_solver',
      description: 'Delegate mathematical tasks to the math expert',
      parameters: z.object({
        task: z.string().describe('The mathematical task to solve'),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
      }),
    },
  ],
};

// Initialize office
const office = new OfficeLLM({
  manager,
  workers: [mathWorker],
});

// Execute a task
const result = await office.executeTask({
  title: 'Calculate compound interest',
  description: 'Calculate the compound interest on $1000 at 5% annual rate for 3 years.',
  priority: 'high',
});

console.log('Result:', result.content);
```

## Architecture

### Core Components

#### OfficeLLM
The main orchestrator that manages the relationship between managers and workers:
- Initializes with manager and worker configurations
- Provides methods to execute tasks and call workers directly
- Handles task delegation through the manager agent

#### Manager
Manager agents coordinate task execution:
- Accept tasks from users through the `executeTask()` method
- Analyze task requirements and delegate to appropriate workers
- Can call worker tools using function calling format
- Handle conversation flow between user, manager, and workers

#### Worker
Worker agents execute specialized tasks:
- Have domain-specific configurations and tools
- Use different LLM providers and models
- Execute tasks with their own tool sets
- Return structured results with success/error status

#### Provider System
Extensible provider architecture supporting multiple LLM services:
- **OpenAI**: GPT-3.5, GPT-4, and other OpenAI models
- **Anthropic**: Claude models via API
- **Google Gemini**: Gemini Pro and other Google models
- **OpenRouter**: Access to various providers through OpenRouter

#### Tools
Tools extend agent capabilities with type-safe parameters:
- Implement the `Tool` interface with Zod schemas
- Provide structured parameter validation
- Handle execution with error management
- Support availability checking and metadata

### Task Flow

1. **Task Submission**: User submits a task to OfficeLLM via `executeTask()`
2. **Manager Analysis**: Manager analyzes the task and determines which worker to delegate to
3. **Worker Execution**: Manager calls the appropriate worker using function calling
4. **Tool Usage**: Worker may use tools to complete the task
5. **Result Return**: Final results are returned to the user

### Direct Worker Calls

For simple use cases, workers can be called directly:

```typescript
// Call a worker directly without going through the manager
const result = await office.callWorker('math_solver', {
  task: 'Calculate 15% of 200',
  priority: 'medium'
});
```

## Advanced Usage

### Building Custom Tools

```typescript
import { BaseTool, ToolResult } from 'officellm';

class WeatherTool extends BaseTool {
  constructor() {
    super(
      'weather_tool',
      'Get current weather information',
      '1.0.0',
      {
        author: 'Your Name',
        tags: ['weather', 'api']
      }
    );
  }

  async execute(params: Record<string, any>): Promise<ToolResult> {
    const { location } = params;

    try {
      // Your weather API logic here
      const weather = await fetchWeatherData(location);

      return this.createSuccessResult(weather);
    } catch (error) {
      return this.createErrorResult(`Weather lookup failed: ${error.message}`);
    }
  }

  getParameterSchema(): Record<string, any> {
    return {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name or coordinates'
        }
      },
      required: ['location']
    };
  }
}
```

### Multi-Worker Coordination

```typescript
import { OfficeLLM } from 'officellm';
import { z } from 'zod';

// Define multiple specialized workers
const mathWorker = {
  name: 'Math Solver',
  description: 'Handles mathematical calculations and analysis',
  provider: {
    type: 'openai' as const,
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4',
    temperature: 0.1,
  },
  systemPrompt: 'You are a mathematical expert...',
  tools: [
    {
      name: 'calculate',
      description: 'Perform mathematical calculations',
      parameters: z.object({
        expression: z.string().describe('Math expression to evaluate'),
      }),
    },
  ],
};

const researchWorker = {
  name: 'Research Assistant',
  description: 'Handles information gathering and analysis',
  provider: {
    type: 'anthropic' as const,
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-3-sonnet-20240229',
    temperature: 0.3,
  },
  systemPrompt: 'You are a research expert...',
  tools: [
    {
      name: 'web_search',
      description: 'Search the web for information',
      parameters: z.object({
        query: z.string().describe('Search query'),
        limit: z.number().min(1).max(20).default(10),
      }),
    },
  ],
};

// Manager that can coordinate between workers
const manager = {
  name: 'Project Manager',
  description: 'Coordinates complex multi-step tasks',
  provider: {
    type: 'openai' as const,
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4',
    temperature: 0.7,
  },
  systemPrompt: 'You coordinate specialized AI agents to complete complex tasks...',
  tools: [
    {
      name: 'math_solver',
      description: 'Delegate to math expert',
      parameters: z.object({
        task: z.string().describe('Math task to solve'),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
      }),
    },
    {
      name: 'research_assistant',
      description: 'Delegate to research expert',
      parameters: z.object({
        query: z.string().describe('Research query'),
        depth: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed'),
      }),
    },
  ],
};

const office = new OfficeLLM({
  manager,
  workers: [mathWorker, researchWorker],
});

// Execute complex task requiring multiple workers
const result = await office.executeTask({
  title: 'Data Analysis Report',
  description: 'Analyze sales data and research market trends',
  priority: 'high',
});
```

## API Reference

### OfficeLLM

#### Constructor
```typescript
new OfficeLLM(config: OfficeLLMConfig)
```
Creates a new OfficeLLM instance with manager and workers.

#### `executeTask(task: Task): Promise<TaskResult>`
Executes a task through the manager, which delegates to appropriate workers.

#### `callWorker(workerName: string, params: Record<string, any>): Promise<TaskResult>`
Calls a specific worker directly with parameters.

#### `getWorkers(): string[]`
Returns a list of available worker names.

#### `getManager(): { name: string; description: string }`
Returns manager information.

### Configuration Types

#### `OfficeLLMConfig`
```typescript
interface OfficeLLMConfig {
  manager: ManagerConfig;
  workers: WorkerConfig[];
}
```

#### `ManagerConfig`
```typescript
interface ManagerConfig {
  name: string;
  description: string;
  provider: ProviderConfig;
  systemPrompt: string;
  tools: ToolDefinition[];
}
```

#### `WorkerConfig`
```typescript
interface WorkerConfig {
  name: string;
  description?: string;
  provider: ProviderConfig;
  systemPrompt: string;
  tools: ToolDefinition[];
}
```

#### `Task`
```typescript
interface Task {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  [key: string]: any; // Additional parameters
}
```

#### `TaskResult`
```typescript
interface TaskResult {
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
```

## Configuration

### Provider Configuration

#### OpenAI Provider
```typescript
const openaiConfig = {
  type: 'openai' as const,
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4', // or 'gpt-3.5-turbo'
  temperature: 0.7,
  maxTokens: 1000,
  // Optional parameters
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};
```

#### Anthropic Provider
```typescript
const anthropicConfig = {
  type: 'anthropic' as const,
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-3-sonnet-20240229', // or 'claude-3-haiku-20240307'
  temperature: 0.7,
  maxTokens: 1000,
  // Optional parameters
  topP: 1,
};
```

#### Google Gemini Provider
```typescript
const geminiConfig = {
  type: 'gemini' as const,
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-pro', // or 'gemini-pro-vision'
  temperature: 0.7,
  maxTokens: 1000,
};
```

#### OpenRouter Provider
```typescript
const openRouterConfig = {
  type: 'openrouter' as const,
  apiKey: process.env.OPENROUTER_API_KEY!,
  model: 'anthropic/claude-3-haiku', // or any supported model
  temperature: 0.7,
  maxTokens: 1000,
};
```

### Environment Variables

Set your API keys as environment variables:

```bash
# Required API keys (set at least one)
export OPENAI_API_KEY="your-openai-api-key"
export ANTHROPIC_API_KEY="your-anthropic-api-key"
export GEMINI_API_KEY="your-gemini-api-key"
export OPENROUTER_API_KEY="your-openrouter-api-key"
```

## Error Handling

officeLLM provides comprehensive error handling:

```typescript
try {
  const result = await office.executeTask({
    title: 'Complex Task',
    description: 'A task that might fail',
    priority: 'high',
  });

  if (result.success) {
    console.log('Task completed:', result.content);
  } else {
    console.error('Task failed:', result.error);
  }
} catch (error) {
  console.error('Execution error:', error);
}

// Handle worker-specific errors
try {
  const result = await office.callWorker('math_solver', {
    task: 'invalid task',
    priority: 'high',
  });

  if (!result.success) {
    console.error('Worker error:', result.error);
  }
} catch (error) {
  if (error.message.includes('Worker') && error.message.includes('not found')) {
    console.error('Worker not found:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Best Practices

1. **Expertise Definition**: Be specific about worker skills and confidence levels
2. **Tool Design**: Keep tools focused on single responsibilities
3. **Error Handling**: Always implement proper error handling in custom tools
4. **Resource Management**: Monitor worker capacity and system load
5. **Task Granularity**: Break complex tasks into manageable subtasks

## Examples

Check the `examples/` directory for complete implementations:

- `basic-usage.ts`: Basic setup and task submission
- `simplified-usage.ts`: Advanced usage with multiple workers and complex tasks
- Custom tool development patterns
- Multi-worker coordination examples
- Error handling and direct worker calls

### Running Examples

```bash
# Install dependencies
npm install

# Set your API keys
export OPENAI_API_KEY="your-api-key"
export ANTHROPIC_API_KEY="your-api-key"

# Run an example
npx ts-node examples/simplified-usage.ts
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Roadmap

- [ ] Integration with popular LLM providers
- [ ] Web dashboard for monitoring
- [ ] Advanced routing algorithms
- [ ] Persistent task storage
- [ ] Plugin system for custom components
- [ ] Performance optimization features

## Support

- 📖 [Documentation](https://officellm.dev)
- 🐛 [Issue Tracker](https://github.com/anirudhp26/officellm/issues)
- 💬 [Discussions](https://github.com/anirudhp26/officellm/discussions)

---

Built with ❤️ for the AI agent community
