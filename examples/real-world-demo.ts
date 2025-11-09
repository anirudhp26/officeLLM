import { OfficeLLM } from '../src/core/OfficeLLM';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const calculateSchema = z.object({
  expression: z.string().describe('The mathematical expression to evaluate'),
});

const analyze_equationSchema = z.object({
  equation: z.string().describe('The equation to analyze'),
  variables: z.array(z.string()).optional().describe('Variables in the equation'),
});

// Define a specialized worker agent
const mathWorker = {
  name: 'math_solver',
  description: 'Delegate mathematical tasks to the math expert',
  provider: {
    type: 'gemini' as const,
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash',
    temperature: 0.1, // Low temperature for precise calculations
  },
  systemPrompt: `You are a mathematical expert. Solve problems step by step and provide clear explanations.
  Always show your work and double-check calculations.`,
  tools: [
    {
      name: 'calculate',
      description: 'Perform mathematical calculations',
      parameters: calculateSchema,
    },
    {
      name: 'analyze_equation',
      description: 'Analyze and solve equations',
      parameters: analyze_equationSchema,
    },
  ],
  toolImplementations: {
    calculate: async (args: z.infer<typeof calculateSchema>) => await calculate(args),
    analyze_equation: async (args: z.infer<typeof analyze_equationSchema>) => analyze_equation(args),
  },
};

// Implementations
async function calculate(params: z.infer<typeof calculateSchema>) {
  const result = eval(params.expression);
  return `Result: ${result}`;
}

async function analyze_equation(params: z.infer<typeof analyze_equationSchema>) {
  const result = eval(params.equation);
  return `Result: ${result}`;
}

// Define the manager agent
const manager = {
  name: 'project_manager',
  description: 'Coordinates and delegates tasks to specialized AI worker agents',
  provider: {
    type: 'gemini' as const,
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash',
    temperature: 0.7,
  },
  systemPrompt: `You are a project manager coordinating a team of specialized AI agents.

Available workers:
- math_solver: For mathematical problems and calculations

When given a task, analyze it and delegate to the appropriate worker agent.
Always provide clear instructions and coordinate between workers when needed.`,
};

// Initialize the office with manager and workers
const office = new OfficeLLM({
  manager,
  workers: [mathWorker],
});

// Execute a task
async function runTask() {
  const result = await office.executeTask({
    title: 'Calculate compound interest',
    description: 'What is the compound interest on $1000 at 5% annual interest for 3 years?',
    priority: 'high',
  });

  console.log('Task Result:', result.content);
  console.log('Success:', result.success);
  console.log('Usage:', result.usage);
}

runTask().catch(console.error);