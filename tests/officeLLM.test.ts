import { OfficeLLM } from '../src';
import { Task } from '../src/types';
import { CalculatorTool } from '../src/tools';

describe('OfficeLLM', () => {
  let officeLLM: OfficeLLM;

  beforeEach(() => {
    officeLLM = OfficeLLM.createDefault();
  });

  describe('Basic functionality', () => {
    it('should create a default setup', () => {
      expect(officeLLM).toBeDefined();
      expect(officeLLM.name).toBe('officeLLM');
    });

    it('should have managers', () => {
      const managers = officeLLM.getManagers();
      expect(managers.length).toBeGreaterThan(0);
    });

    it('should add workers', () => {
      const worker = officeLLM.addWorker({
        name: 'Test Worker',
        role: 'analyst',
        expertise: [{
          domain: 'mathematics',
          skills: ['calculation', 'algebra'],
          confidence: 0.9,
        }],
        llmConfig: {
          provider: 'openai',
          model: 'gpt-4',
        },
      });

      expect(worker).toBeDefined();
      expect(worker.name).toBe('Test Worker');
      expect(worker.role).toBe('analyst');
    });

    it('should add tools to workers', () => {
      const worker = officeLLM.addWorker({
        name: 'Calculator Worker',
        role: 'analyst',
        expertise: [{
          domain: 'mathematics',
          skills: ['calculation'],
          confidence: 0.9,
        }],
        llmConfig: {
          provider: 'openai',
          model: 'gpt-4',
        },
      });

      const calculatorTool = new CalculatorTool();
      const success = officeLLM.addToolToWorker(worker.id, calculatorTool);

      expect(success).toBe(true);
      expect(worker.getTools()).toContain(calculatorTool);
    });
  });

  describe('Task management', () => {
    it('should submit and track tasks', async () => {
      const task: Task = {
        id: '',
        title: 'Test Task',
        description: 'A simple test task',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const submittedTask = await officeLLM.submitTask(task);
      expect(submittedTask.id).toBeDefined();
      expect(submittedTask.status).toBe('pending');

      const status = officeLLM.getTaskStatus(submittedTask.id);
      expect(status).toBeDefined();
    });

    it('should get system statistics', () => {
      const stats = officeLLM.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats.managers).toBe('number');
      expect(typeof stats.workers).toBe('number');
      expect(typeof stats.totalTasks).toBe('number');
    });
  });
});
