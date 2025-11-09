/**
 * Basic usage example for officeLLM
 *
 * This example demonstrates:
 * - Setting up an officeLLM instance
 * - Adding workers with different expertise
 * - Adding tools to workers
 * - Submitting and monitoring tasks
 */

import { OfficeLLM, CalculatorTool, WebSearchTool } from '../src';

/**
 * Example 1: Basic Setup and Task Submission
 */
async function basicExample() {
  console.log('🚀 Starting officeLLM Basic Example');

  // Create an officeLLM instance with default configuration
  const office = OfficeLLM.createDefault({
    name: 'My AI Office',
    enableMetrics: true
  });

  console.log(`📊 Office created: ${office.name}`);

  // Add a mathematics specialist worker
  const mathWorker = office.addWorker({
    name: 'Dr. Math',
    role: 'analyst',
    description: 'Specialized in mathematical calculations and analysis',
    expertise: [
      {
        domain: 'mathematics',
        skills: ['algebra', 'calculus', 'statistics', 'geometry'],
        confidence: 0.95
      },
      {
        domain: 'data_analysis',
        skills: ['statistical_modeling', 'data_visualization'],
        confidence: 0.88
      }
    ],
    llmConfig: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.1, // Low temperature for precise calculations
      maxTokens: 1000
    },
    maxConcurrentTasks: 3
  });

  console.log(`👷 Math worker added: ${mathWorker.name} (${mathWorker.role})`);

  // Add a research specialist worker
  const researchWorker = office.addWorker({
    name: 'Research Assistant',
    role: 'researcher',
    description: 'Expert in information gathering and synthesis',
    expertise: [
      {
        domain: 'research',
        skills: ['literature_review', 'data_collection', 'source_evaluation'],
        confidence: 0.92
      },
      {
        domain: 'web_search',
        skills: ['information_retrieval', 'content_analysis'],
        confidence: 0.85
      }
    ],
    llmConfig: {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      temperature: 0.3,
      maxTokens: 2000
    }
  });

  console.log(`🔍 Research worker added: ${researchWorker.name} (${researchWorker.role})`);

  // Add tools to workers
  const calculator = new CalculatorTool();
  const searchTool = new WebSearchTool();

  office.addToolToWorker(mathWorker.id, calculator);
  office.addToolToWorker(researchWorker.id, searchTool);

  console.log('🛠️ Tools added to workers');

  // Submit a mathematical task
  const mathTask = {
    title: 'Complex Calculation',
    description: 'Calculate the result of: (45 + 23) * 7 - 12 / 3 + sqrt(16)',
    priority: 'high' as const
  };

  console.log('📝 Submitting math task...');
  const submittedMathTask = await office.submitTask(mathTask);
  console.log(`✅ Math task submitted with ID: ${submittedMathTask.id}`);

  // Submit a research task
  const researchTask = {
    title: 'Market Research',
    description: 'Research the current trends in TypeScript frameworks for AI applications',
    priority: 'medium' as const
  };

  console.log('📝 Submitting research task...');
  const submittedResearchTask = await office.submitTask(researchTask);
  console.log(`✅ Research task submitted with ID: ${submittedResearchTask.id}`);

  // Monitor task progress
  console.log('\n📊 Monitoring task progress...');

  // Check status after a short delay (simulating async processing)
  setTimeout(async () => {
    const mathStatus = office.getTaskStatus(submittedMathTask.id);
    const researchStatus = office.getTaskStatus(submittedResearchTask.id);

    console.log(`📈 Math task status: ${mathStatus}`);
    console.log(`📈 Research task status: ${researchStatus}`);

    // Get system statistics
    const stats = office.getStats();
    console.log('\n📊 System Statistics:');
    console.log(`   Managers: ${stats.managers}`);
    console.log(`   Workers: ${stats.workers}`);
    console.log(`   Total Tasks: ${stats.totalTasks}`);
    console.log(`   Active Tasks: ${stats.activeTasks}`);
    console.log(`   Completed Tasks: ${stats.completedTasks}`);

  }, 1000);
}

/**
 * Example 2: Custom Tool Implementation
 */
class EmailTool {
  id: string = 'email_tool';
  name: string = 'email_sender';
  description: string = 'Send emails to specified recipients';
  version: string = '1.0.0';

  async execute(params: Record<string, any>) {
    const { to, subject, body } = params;

    // Mock email sending - replace with actual email service
    console.log(`📧 Sending email to ${to}:`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body: ${body}`);

    return {
      success: true,
      data: {
        messageId: `msg_${Date.now()}`,
        sentAt: new Date().toISOString(),
        recipient: to
      }
    };
  }

  getParameterSchema() {
    return {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Email recipient' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body content' }
      },
      required: ['to', 'subject', 'body']
    };
  }

  async isAvailable() {
    return true; // Assume email service is always available
  }

  getMetadata() {
    return {
      author: 'officeLLM',
      tags: ['communication', 'email'],
      permissions: ['email_send']
    };
  }
}

/**
 * Example 3: Advanced Worker Setup with Custom Tools
 */
async function advancedExample() {
  console.log('\n🚀 Starting Advanced Example');

  const office = OfficeLLM.createDefault();

  // Create a communication specialist
  const commWorker = office.addWorker({
    name: 'Communication Officer',
    role: 'specialist',
    expertise: [
      {
        domain: 'communication',
        skills: ['email_writing', 'message_drafting', 'client_interaction'],
        confidence: 0.9
      }
    ],
    llmConfig: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.7
    }
  });

  // Add custom email tool
  const emailTool = new EmailTool();
  office.addToolToWorker(commWorker.id, emailTool);

  // Submit a communication task
  const emailTask = {
    title: 'Send Client Update',
    description: 'Draft and send an email update to the client about project progress',
    priority: 'medium' as const
  };

  const submittedTask = await office.submitTask(emailTask);
  console.log(`📧 Email task submitted: ${submittedTask.id}`);
}

/**
 * Example 4: Error Handling and Monitoring
 */
async function errorHandlingExample() {
  console.log('\n🚀 Starting Error Handling Example');

  const office = OfficeLLM.createDefault();

  // Try to submit a task to non-existent manager
  try {
    await office.submitTask({
      title: 'Test Task',
      description: 'This should work',
      priority: 'low' as const
    }, 'non-existent-manager-id');
  } catch (error) {
    console.log(`⚠️ Expected error caught: ${error.message}`);
  }

  // Monitor system health
  const stats = office.getStats();
  console.log('🏥 System Health Check:');
  console.log(`   Status: ${stats.managers > 0 ? '✅ Operational' : '❌ No managers'}`);
  console.log(`   Workers: ${stats.workers}`);
  console.log(`   Active Tasks: ${stats.activeTasks}`);
}

// Run all examples
async function main() {
  try {
    await basicExample();
    await advancedExample();
    await errorHandlingExample();

    console.log('\n🎉 All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Uncomment to run examples
// main();

export {
  basicExample,
  advancedExample,
  errorHandlingExample,
  EmailTool
};
