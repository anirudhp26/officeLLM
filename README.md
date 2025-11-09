# OfficeLLM

A powerful TypeScript framework for building multi-agent AI systems with continuous execution. Coordinate specialized AI workers that autonomously use tools and collaborate to complete complex tasks.

## Features

- **Multi-Agent Architecture**: Manager coordinates specialized worker agents
- **Continuous Execution**: Agents autonomously work until task completion
- **User-Defined Tools**: Bring your own tool implementations
- **Multiple LLM Providers**: OpenAI, Anthropic, Google Gemini, OpenRouter
- **Type-Safe**: Full TypeScript support with Zod schemas
- **Flexible**: Easy to extend and customize

## Installation

```bash
npm install officellm
```

## How It Works

### Continuous Execution Model

OfficeLLM implements a continuous execution loop where:

1. **Manager Agent** analyzes tasks and calls worker agents
2. **Worker Agents** use their tools to complete subtasks
3. **Execution continues** until the manager determines completion
4. **Completion signal**: Manager responds without calling more workers

```
User Task → Manager → Worker (uses tools) → Manager → Worker → ... → Final Result
```

### Key Concepts

- **Manager**: Orchestrates the entire workflow, delegates to workers
- **Workers**: Specialized agents with specific tools and expertise
- **Tools**: Functions that workers can call (YOU provide implementations)
- **Completion**: Detected when agents stop calling tools

## Tool Implementations

**IMPORTANT**: You MUST provide tool implementations for your workers. The framework provides the skeleton, you provide the functionality.

### Example: Web Search Tool

```typescript
const researchWorker = {
  name: 'researcher',
  tools: [
    {
      name: 'web_search',
      description: 'Search the web for information',
      parameters: z.object({
        query: z.string(),
        limit: z.number().default(10),
      }),
    },
  ],
  toolImplementations: {
    web_search: async (args) => {
      // YOUR implementation - integrate with Google, Bing, etc.
      const results = await yourSearchAPI(args.query, args.limit);
      return formatResults(results);
    },
  },
};
```

### Example: Database Query Tool

```typescript
const dataWorker = {
  name: 'data_analyst',
  tools: [
    {
      name: 'query_database',
      description: 'Query the database',
      parameters: z.object({
        sql: z.string(),
      }),
    },
  ],
  toolImplementations: {
    query_database: async (args) => {
      // YOUR implementation
      const results = await database.query(args.sql);
      return JSON.stringify(results);
    },
  },
};
```

## Configuration

### Manager Configuration

```typescript
{
  name: 'Manager Name',
  description: 'What the manager does',
  provider: {
    type: 'gemini' | 'openai' | 'anthropic' | 'openrouter',
    apiKey: 'your-api-key',
    model: 'model-name',
    temperature: 0.7,
  },
  systemPrompt: 'Instructions for the manager...',
}
```

### Worker Configuration

```typescript
{
  name: 'Worker Name',
  description: 'What the worker does',
  provider: { /* LLM config */ },
  systemPrompt: 'Instructions for the worker...',
  tools: [
    {
      name: 'tool_name',
      description: 'What the tool does',
      parameters: zodSchema,
    },
  ],
  toolImplementations: {
    tool_name: async (args) => {
      // YOUR implementation
      return 'result';
    },
  },
}
```

## System Prompts Best Practices

### Manager Prompts

```typescript
systemPrompt: `You are a project manager.

Workflow:
1. Analyze the task
2. Call appropriate workers
3. Review worker results
4. Continue calling workers as needed
5. When complete, provide summary WITHOUT calling more workers

IMPORTANT: Signal completion by responding without tool calls`
```

### Worker Prompts

```typescript
systemPrompt: `You are a specialist.

Workflow:
1. Use your tools to complete the task
2. Call tools as needed (tools return complete results)
3. Review tool results - don't repeat the same call
4. When done, provide results WITHOUT calling more tools

IMPORTANT: Signal completion by responding without tool calls`
```

## Examples

See the `examples/` directory for complete examples:

- `real-world-demo.ts` - Real world example

## Safety Features

- **Iteration Limits**: Prevents infinite loops (Manager: 20, Workers: 15)
- **Error Handling**: Graceful error catching at all levels
- **Missing Tools**: Clear error messages when implementations are missing

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT

## Support

- [Documentation](https://officellm.mintlify.app)
- [Issues](https://github.com/yourusername/officellm/issues)
- [Discussions](https://github.com/yourusername/officellm/discussions)
