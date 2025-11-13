import { OfficeLLM, z } from '../src';

/**
 * Demo: Using OfficeLLM with Memory System
 * 
 * This example demonstrates how to use the memory system to store
 * and retrieve conversation history for both managers and workers.
 */

async function demonstrateInMemoryStorage() {
  console.log('\n=== IN-MEMORY STORAGE DEMO ===\n');

  const office = new OfficeLLM({
    // Configure in-memory storage
    memory: {
      instanceId: '123',
      type: 'in-memory',
      maxConversations: 100, // Optional: limit stored conversations
    },
    
    manager: {
      name: 'Project Manager',
      description: 'Coordinates tasks between different workers',
      provider: {
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4',
      },
      systemPrompt: 'You are a project manager coordinating different specialist agents.',
      maxIterations: 10,
    },
    
    workers: [
      {
        name: 'calculator',
        description: 'Performs mathematical calculations',
        provider: {
          type: 'openai',
          apiKey: process.env.OPENAI_API_KEY || '',
          model: 'gpt-3.5-turbo',
        },
        systemPrompt: 'You are a calculator. Use the calculate tool to perform operations.',
        tools: [
          {
            name: 'calculate',
            description: 'Evaluate a mathematical expression',
            parameters: z.object({
              expression: z.string().describe('The mathematical expression to evaluate'),
            }),
          },
        ],
        toolImplementations: {
          calculate: async (args) => {
            try {
              // Simple eval for demo - in production use a safer math parser
              const result = eval(args.expression);
              return `Result: ${result}`;
            } catch (error) {
              return `Error: Invalid expression`;
            }
          },
        },
        maxIterations: 5,
      },
    ],
  });

  // Execute a task
  const result = await office.executeTask({
    title: 'Calculate compound interest',
    description: 'Calculate the compound interest on $1000 at 5% annual rate for 3 years',
    priority: 'high',
  });

  console.log('Task Result:', result.content);
  console.log('Success:', result.success);
  console.log('Token Usage:', result.usage);

  // Access memory to query stored conversations
  const memory = office.getMemory();
  
  if (memory) {
    // Get all conversations
    const allConversations = await memory.queryConversations();
    console.log(`\nTotal conversations stored: ${allConversations.length}`);
    
    // Get manager conversations only
    const managerConvs = await memory.queryConversations({ 
      agentType: 'manager' 
    });
    console.log(`Manager conversations: ${managerConvs.length}`);
    
    // Get worker conversations only
    const workerConvs = await memory.queryConversations({ 
      agentType: 'worker',
      agentName: 'calculator',
    });
    console.log(`Calculator worker conversations: ${workerConvs.length}`);
    
    // Get memory statistics
    const stats = await memory.getStats();
    console.log('\nMemory Statistics:', {
      totalConversations: stats.totalConversations,
      totalMessages: stats.totalMessages,
      oldestConversation: stats.oldestConversation?.toISOString(),
      newestConversation: stats.newestConversation?.toISOString(),
    });
    
    // Retrieve a specific conversation
    if (allConversations.length > 0) {
      const firstConv = allConversations[0];
      console.log(`\nFirst Conversation (${firstConv.agentName}):`);
      console.log(`  - Messages: ${firstConv.messages.length}`);
      console.log(`  - Created: ${firstConv.createdAt.toISOString()}`);
      console.log(`  - Updated: ${firstConv.updatedAt.toISOString()}`);
    }
  }

  // Cleanup
  await office.close();
  console.log('\nMemory connection closed.');
}

async function demonstrateRedisStorage() {
  console.log('\n=== REDIS STORAGE DEMO ===\n');
  
  // Note: This requires Redis to be running
  // Install redis client: npm install redis
  // Start Redis: docker run -p 6379:6379 redis
  
  try {
    const office = new OfficeLLM({
      // Configure Redis storage
      memory: {
        instanceId: '123',
        type: 'redis',
        host: 'localhost',
        port: 6379,
        password: undefined, // Optional
        db: 0, // Optional database number
        keyPrefix: 'officellm:demo:', // Optional key prefix
        ttl: 86400, // Optional: 24 hours TTL
      },
      
      manager: {
        name: 'Research Manager',
        description: 'Coordinates research tasks',
        provider: {
          type: 'openai',
          apiKey: process.env.OPENAI_API_KEY || '',
          model: 'gpt-4',
        },
        systemPrompt: 'You are a research manager.',
        maxIterations: 10,
      },
      
      workers: [
        {
          name: 'researcher',
          description: 'Conducts research and analysis',
          provider: {
            type: 'openai',
            apiKey: process.env.OPENAI_API_KEY || '',
            model: 'gpt-3.5-turbo',
          },
          systemPrompt: 'You are a researcher.',
          maxIterations: 5,
        },
      ],
    });

    const result = await office.executeTask({
      title: 'Research AI trends',
      description: 'Provide a brief overview of current AI trends',
      priority: 'medium',
    });

    console.log('Task Result:', result.content);
    
    // Query conversations from Redis
    const memory = office.getMemory();
    if (memory) {
      const conversations = await memory.queryConversations();
      console.log(`\nConversations in Redis: ${conversations.length}`);
      
      const stats = await memory.getStats();
      console.log('Redis Memory Statistics:', stats);
    }

    // Cleanup
    await office.close();
    console.log('\nRedis connection closed.');
    
  } catch (error) {
    console.error('Redis Demo Error:', error);
    console.log('\nNote: Make sure Redis is running and the redis package is installed.');
    console.log('  Install: npm install redis');
    console.log('  Start Redis: docker run -p 6379:6379 redis');
  }
}

async function demonstrateCustomMemoryProvider() {
  console.log('\n=== CUSTOM MEMORY PROVIDER DEMO ===\n');
  
  // You can create custom memory providers by extending BaseMemory
  // and registering them with the MemoryFactory
  
  // Example:
  // import { BaseMemory, registerMemory } from 'officellm';
  // 
  // class PostgresMemory extends BaseMemory {
  //   // Implement all required methods
  //   async storeConversation(conversation) { ... }
  //   async getConversation(id) { ... }
  //   // ... etc
  // }
  // 
  // // Register the custom provider
  // registerMemory('postgres', PostgresMemory);
  // 
  // // Use it in configuration
  // const office = new OfficeLLM({
  //   memory: {
  //     type: 'postgres',
  //     connectionString: 'postgresql://...',
  //     // ... other config
  //   },
  //   // ... rest of config
  // });
  
  console.log('See comments in the code for how to create custom memory providers.');
}

// Run demonstrations
async function main() {
  console.log('OfficeLLM Memory System Demo');
  console.log('============================');
  
  // Run in-memory demo (always works)
  await demonstrateInMemoryStorage();
  
  // Uncomment to run Redis demo (requires Redis)
  // await demonstrateRedisStorage();
  
  // Show custom provider info
  await demonstrateCustomMemoryProvider();
}

// Only run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { demonstrateInMemoryStorage, demonstrateRedisStorage, demonstrateCustomMemoryProvider };

