# officeLLM

A TypeScript library for building multi-model agentic architectures with managers and workers.

[![npm version](https://badge.fury.io/js/officellm.svg)](https://badge.fury.io/js/officellm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## Overview

officeLLM provides a simplified framework for building multi-agent AI systems with:

- **Manager Agents** that coordinate and delegate tasks using different LLM providers
- **Worker Agents** that execute specialized tasks with their own tools
- **Extensible Provider System** supporting OpenAI, Anthropic, Gemini, and OpenRouter
- **Zod Type Safety** for all tool parameters and configurations
- **FunctionDefinitions Format** for seamless AI package integration

## Features

- 🏢 **Multi-Agent Architecture**: Managers orchestrate teams of specialized workers
- 🛠️ **Extensible Tool System**: Easy-to-implement tools for custom functionality
- 🎯 **Intelligent Routing**: Automatic task assignment based on expertise matching
- 🔄 **Multiple Routing Strategies**: Best-match, round-robin, least-loaded, and random
- 📊 **Performance Tracking**: Built-in metrics and monitoring
- 🔧 **TypeScript First**: Full type safety and excellent developer experience
- 📚 **Production Ready**: Comprehensive error handling and logging

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
  description: 'Specialized in mathematical calculations',
  provider: {
    type: 'openai' as const,
    apiKey: process.env.OPENAI_API_KEY!,
    model: 'gpt-4',
    temperature: 0.1,
  },
  systemPrompt: 'You are a mathematical expert. Solve problems step by step.',
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

// Manager configuration
const manager = {
  name: 'Project Manager',
  description: 'Coordinates AI worker agents',
  provider: {
    type: 'anthropic' as const,
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-3-sonnet-20240229',
    temperature: 0.7,
  },
  systemPrompt: 'You coordinate specialized AI agents to complete tasks.',
  tools: [
    {
      name: 'math_solver',
      description: 'Delegate math tasks to the math expert',
      parameters: z.object({
        task: z.string().describe('Math task to solve'),
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
  description: 'What is the compound interest on $1000 at 5% for 3 years?',
  priority: 'high',
});

console.log('Result:', result.content);
```

## Architecture

### Core Components

#### Manager
Managers are the coordinators that:
- Accept tasks from users
- Analyze task requirements
- Route tasks to appropriate workers based on expertise
- Monitor task progress and handle failures
- Support multiple routing strategies

#### Worker
Workers are specialized agents that:
- Have specific roles (analyst, researcher, coder, etc.)
- Possess domain expertise with confidence scores
- Can use different LLM models
- Execute tasks using available tools
- Report performance metrics

#### Tools
Tools extend agent capabilities:
- Implement the `Tool` interface
- Provide structured parameter schemas
- Handle execution with error management
- Support availability checking

### Task Flow

1. **Task Submission**: User submits a task to a manager
2. **Analysis**: Manager analyzes task requirements
3. **Routing**: Manager selects the best worker based on routing strategy
4. **Execution**: Worker breaks down task and uses tools to complete it
5. **Completion**: Results are returned to the user

## Advanced Usage

### Custom Routing Strategy

```typescript
import { Manager, RoutingStrategy } from 'officellm';

// Create a manager with custom routing
const manager = office.addManager({
  name: 'Senior Manager',
  routingStrategy: RoutingStrategy.BEST_MATCH,
  maxConcurrentTasks: 5
});
```

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

### Worker Expertise Configuration

```typescript
const researcher = office.addWorker({
  name: 'Research Specialist',
  role: 'researcher',
  expertise: [
    {
      domain: 'academic_research',
      skills: ['literature_review', 'data_analysis', 'hypothesis_testing'],
      confidence: 0.9
    },
    {
      domain: 'web_research',
      skills: ['information_gathering', 'source_evaluation'],
      confidence: 0.85
    }
  ],
  llmConfig: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.3
  }
});
```

## API Reference

### OfficeLLM

#### `OfficeLLM.createDefault(config?)`
Creates a default officeLLM setup with one manager.

#### `addManager(config)`
Adds a new manager to the system.

#### `addWorker(config, managerId?)`
Adds a worker to the system, optionally assigning to a specific manager.

#### `addToolToWorker(workerId, tool)`
Adds a tool to a specific worker.

#### `submitTask(task, managerId?)`
Submits a task for execution.

#### `getTaskStatus(taskId)`
Gets the current status of a task.

#### `cancelTask(taskId)`
Cancels a running task.

#### `getStats()`
Returns system statistics.

### Manager

#### Routing Strategies
- `BEST_MATCH`: Routes to worker with highest expertise match
- `LEAST_LOADED`: Routes to worker with fewest active tasks
- `ROUND_ROBIN`: Cycles through workers evenly
- `RANDOM`: Random worker selection

### Worker Roles
- `analyst`: Data analysis and interpretation
- `researcher`: Information gathering and synthesis
- `writer`: Content creation and editing
- `coder`: Programming and technical implementation
- `reviewer`: Quality assurance and validation
- `specialist`: Domain-specific expertise

## Configuration

### LLM Configuration

```typescript
interface LLMConfig {
  provider: string;        // 'openai', 'anthropic', 'google', etc.
  model: string;          // Model identifier
  apiKey?: string;        // API key (can be set via env)
  temperature?: number;   // Creativity/randomness (0-1)
  maxTokens?: number;     // Maximum response length
  // ... additional provider-specific options
}
```

### Worker Configuration

```typescript
interface WorkerConfig {
  name: string;
  role: WorkerRole;
  expertise: Expertise[];
  llmConfig: LLMConfig;
  description?: string;
  maxConcurrentTasks?: number;
  capabilities?: string[];
}
```

## Error Handling

officeLLM provides comprehensive error handling:

```typescript
try {
  const task = await office.submitTask(complexTask);
  // Task submitted successfully
} catch (error) {
  if (error.message.includes('No manager available')) {
    // Handle no manager scenario
  } else if (error.message.includes('No suitable worker')) {
    // Handle routing failure
  }
}
```

## Performance Monitoring

Track system performance with built-in metrics:

```typescript
const stats = office.getStats();
console.log(`Active tasks: ${stats.activeTasks}`);
console.log(`Completed tasks: ${stats.completedTasks}`);
console.log(`Success rate: ${(stats.completedTasks / stats.totalTasks * 100).toFixed(1)}%`);
```

## Best Practices

1. **Expertise Definition**: Be specific about worker skills and confidence levels
2. **Tool Design**: Keep tools focused on single responsibilities
3. **Error Handling**: Always implement proper error handling in custom tools
4. **Resource Management**: Monitor worker capacity and system load
5. **Task Granularity**: Break complex tasks into manageable subtasks

## Examples

Check the `examples/` directory for complete implementations:

- Basic setup and task submission
- Custom tool development
- Multi-worker collaboration
- Performance monitoring
- Error handling patterns

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
