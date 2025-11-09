/**
 * Simplified officeLLM Usage with Zod Type Safety
 *
 * This example demonstrates the new simplified architecture where:
 * - Manager has workers as tools in functionDefinitions format
 * - Workers have their own tools in functionDefinitions format
 * - No complex parameter passing - just function calls
 */

import { z } from 'zod';
import { OfficeLLM } from '../src';

// Define worker schemas using Zod
const MathWorkerSchema = z.object({
  task: z.string().describe('The mathematical task to solve'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

const ResearchWorkerSchema = z.object({
  query: z.string().describe('The research query to investigate'),
  depth: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed'),
});

const WriterWorkerSchema = z.object({
  topic: z.string().describe('The topic to write about'),
  style: z.enum(['formal', 'casual', 'technical']).default('formal'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
});

// Worker configurations
const mathWorker = {
  name: 'Math Solver',
  description: 'Specialized in mathematical calculations and equation solving',
  provider: {
    type: 'anthropic' as const,
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.1, // Low temperature for precise calculations
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

const researchWorker = {
  name: 'Research Assistant',
  description: 'Expert in information gathering and source analysis',
  provider: {
    type: 'gemini' as const,
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-pro',
    temperature: 0.3,
  },
  systemPrompt: 'You are a research expert. Gather and synthesize information from multiple sources.',
  tools: [
    {
      name: 'web_search',
      description: 'Search the web for information',
      parameters: z.object({
        query: z.string().describe('The search query'),
        limit: z.number().min(1).max(20).default(10).describe('Maximum results to return'),
      }),
    },
    {
      name: 'analyze_sources',
      description: 'Analyze credibility and relevance of sources',
      parameters: z.object({
        sources: z.array(z.string()).describe('URLs or source identifiers to analyze'),
      }),
    },
  ],
};

const writerWorker = {
  name: 'Content Writer',
  description: 'Professional writer specializing in technical and creative content',
  provider: {
    type: 'openrouter' as const,
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: 'anthropic/claude-3-haiku',
    temperature: 0.7,
  },
  systemPrompt: 'You are a professional writer. Create engaging and well-structured content.',
  tools: [
    {
      name: 'write_article',
      description: 'Write an article on a given topic',
      parameters: z.object({
        topic: z.string().describe('The topic to write about'),
        outline: z.array(z.string()).optional().describe('Article outline points'),
      }),
    },
    {
      name: 'edit_content',
      description: 'Edit and improve existing content',
      parameters: z.object({
        content: z.string().describe('The content to edit'),
        improvements: z.array(z.string()).describe('Specific improvements to make'),
      }),
    },
  ],
};

// Manager configuration
const manager = {
  name: 'Project Manager',
  description: 'Coordinates and delegates tasks to specialized AI worker agents',
  provider: {
    type: 'openai' as const,
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    temperature: 0.7,
  },
  systemPrompt: `You are a project manager coordinating a team of specialized AI agents.
When given a task, analyze it and delegate to the appropriate worker agent.
Always provide clear instructions and coordinate between workers when needed.

Available workers:
- math_solver: For mathematical problems and calculations
- research_assistant: For information gathering and analysis
- content_writer: For writing and content creation`,

  tools: [
    {
      name: 'math_solver',
      description: 'Delegate mathematical tasks to the math expert',
      parameters: MathWorkerSchema,
    },
    {
      name: 'research_assistant',
      description: 'Delegate research tasks to the research specialist',
      parameters: ResearchWorkerSchema,
    },
    {
      name: 'content_writer',
      description: 'Delegate writing tasks to the content writer',
      parameters: WriterWorkerSchema,
    },
  ],
};

/**
 * Example 1: Basic Task Delegation
 */
async function basicTaskDelegation() {
  console.log('🚀 Basic Task Delegation Example');

  // Initialize office with manager and workers
  const office = new OfficeLLM({
    manager,
    workers: [mathWorker, researchWorker, writerWorker],
  });

  // Submit a complex task that requires multiple workers
  const task = {
    title: 'Research Report on AI Trends',
    description: `
    Create a research report on current AI trends that includes:
    1. Statistical analysis of AI adoption rates
    2. Research on emerging technologies
    3. A well-written summary article

    Coordinate between math, research, and writing experts as needed.
    `,
    priority: 'high' as const,
  };

  console.log('📝 Submitting complex task...');
  const result = await office.executeTask(task);

  console.log('✅ Task completed:', result);
}

/**
 * Example 2: Direct Worker Call
 */
async function directWorkerCall() {
  console.log('\n🔧 Direct Worker Call Example');

  const office = new OfficeLLM({
    manager,
    workers: [mathWorker, researchWorker, writerWorker],
  });

  // Call a specific worker directly
  const mathResult = await office.callWorker('math_solver', {
    task: 'Calculate the compound interest for $1000 at 5% annual rate for 3 years',
    priority: 'medium',
  });

  console.log('🧮 Math result:', mathResult);

  const researchResult = await office.callWorker('research_assistant', {
    query: 'Latest developments in quantum computing',
    depth: 'detailed',
  });

  console.log('🔍 Research result:', researchResult);
}

/**
 * Example 3: Custom Worker with Domain Tools
 */
async function customWorkerWithDomainTools() {
  console.log('\n🏗️ Custom Worker with Domain Tools Example');

  // Define a custom worker for code analysis
  const codeWorker = {
    name: 'Code Analyst',
    provider: {
      type: 'openai' as const,
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4',
      temperature: 0.7,
    },
    systemPrompt: 'You are an expert code analyzer. Review, analyze, and improve code quality.',
    tools: [
      {
        name: 'analyze_complexity',
        description: 'Analyze code complexity metrics',
        parameters: z.object({
          code: z.string().describe('The code to analyze'),
          language: z.string().describe('Programming language'),
        }),
      },
      {
        name: 'suggest_improvements',
        description: 'Suggest code improvements',
        parameters: z.object({
          code: z.string().describe('The code to improve'),
          focus_areas: z.array(z.string()).optional().describe('Areas to focus on'),
        }),
      },
    ],
  };

  const office = new OfficeLLM({
    manager: {
      ...manager,
      tools: [
        ...manager.tools,
        {
          name: 'code_analyst',
          description: 'Delegate code analysis tasks to the code expert',
          parameters: z.object({
            task: z.string().describe('The code analysis task'),
            code_context: z.string().optional().describe('Additional code context'),
          }),
        },
      ],
    },
    workers: [mathWorker, researchWorker, writerWorker, codeWorker],
  });

  // Submit a coding task
  const codingTask = {
    title: 'Code Review Request',
    description: 'Analyze this JavaScript function for complexity and suggest improvements.',
    code: `
function processData(data) {
  let result = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].active) {
      let processed = data[i].value * 2;
      if (processed > 100) {
        processed = processed / 2;
      }
      result.push(processed);
    }
  }
  return result;
}`,
  };

  const result = await office.callWorker('code_analyst', {
    task: 'Analyze complexity and suggest improvements',
    code_context: codingTask.code,
  });

  console.log('💻 Code analysis result:', result);
}

/**
 * Example 4: Multi-step Workflow
 */
async function multiStepWorkflow() {
  console.log('\n🔄 Multi-step Workflow Example');

  const office = new OfficeLLM({
    manager,
    workers: [mathWorker, researchWorker, writerWorker],
  });

  // Define a workflow that chains multiple workers
  const workflow = [
    {
      step: 'research',
      worker: 'research_assistant',
      params: {
        query: 'Impact of AI on job markets in 2024',
        depth: 'comprehensive',
      },
    },
    {
      step: 'analysis',
      worker: 'math_solver',
      params: {
        task: 'Analyze the research data and calculate growth rates and projections',
        priority: 'high',
      },
    },
    {
      step: 'writing',
      worker: 'content_writer',
      params: {
        topic: 'AI Job Market Impact Report',
        style: 'formal',
        length: 'long',
      },
    },
  ];

  console.log('🔄 Executing workflow...');

  const results: any[] = [];

  for (const step of workflow) {
    console.log(`📍 Executing step: ${step.step}`);
    const result = await office.callWorker(step.worker, step.params);
    results.push({
      step: step.step,
      result,
    });
  }

  console.log('✅ Workflow completed:', results);
}

// Export examples for testing
export {
  basicTaskDelegation,
  directWorkerCall,
  customWorkerWithDomainTools,
  multiStepWorkflow,
  manager,
  mathWorker,
  researchWorker,
  writerWorker,
};

// Uncomment to run examples
// basicTaskDelegation().catch(console.error);
