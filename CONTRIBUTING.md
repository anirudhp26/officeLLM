# Contributing to officeLLM

Welcome! 🎉 We're excited that you're interested in contributing to officeLLM. This document provides guidelines and information to help you get started.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Code Style & Standards](#code-style--standards)
- [Pull Request Process](#pull-request-process)
- [Adding New Features](#adding-new-features)
- [Testing](#testing)
- [Documentation](#documentation)
- [Commit Messages](#commit-messages)
- [Release Process](#release-process)
- [Code of Conduct](#code-of-conduct)
- [Getting Help](#getting-help)

## Ways to Contribute

We welcome all types of contributions:

- 🐛 **Bug Reports**: Found a bug? [Open an issue](https://github.com/anirudhp26/officellm/issues)
- 💡 **Feature Requests**: Have an idea? [Start a discussion](https://github.com/anirudhp26/officellm/discussions)
- 🛠️ **Code Contributions**: Help improve the codebase
- 📖 **Documentation**: Improve docs, tutorials, or examples
- 🧪 **Testing**: Add tests or improve test coverage
- 🎨 **UI/UX**: Improve user interfaces and experiences

## Development Setup

### Prerequisites

- **Node.js** 18+ and **npm**
- **Git** for version control
- A code editor (we recommend VS Code with TypeScript support)

### Quick Start

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/officellm.git
   cd officellm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up development environment**
   ```bash
   # Build the project
   npm run build

   # Run tests
   npm test

   # Start development (if applicable)
   npm run dev
   ```

4. **Verify everything works**
   ```bash
   # Run linting
   npm run lint

   # Run type checking
   npm run type-check
   ```

## Code Style & Standards

### Technologies Used

- **TypeScript** for type safety and better developer experience
- **ESLint** for code linting and consistency
- **Prettier** for automatic code formatting
- **Jest** for testing

### Code Standards

- **TypeScript First**: All new code must be written in TypeScript
- **Strong Typing**: Use strict TypeScript types, avoid `any`
- **Functional Style**: Prefer pure functions and immutability
- **Error Handling**: Comprehensive error handling with descriptive messages
- **Documentation**: JSDoc comments for all public APIs

### Code Quality Tools

```bash
# Lint and fix code
npm run lint
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check

# Run all quality checks
npm run quality
```

### File Structure

```
src/
├── core/           # Core business logic (OfficeLLM class)
├── providers/      # LLM provider implementations
├── tools/          # Tool implementations
└── types/          # TypeScript type definitions
```

## Pull Request Process

### 1. Choose or Create an Issue

- Check existing [issues](https://github.com/anirudhp26/officellm/issues) for work to be done
- Create a new issue if your work doesn't have one
- Comment on the issue to indicate you're working on it

### 2. Create a Branch

```bash
# For features
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b fix/issue-number-description

# For documentation
git checkout -b docs/update-contributing-guide
```

### 3. Make Changes

- Write clear, focused commits
- Follow the [commit message format](#commit-messages)
- Add or update tests for your changes
- Update documentation as needed
- Ensure all tests pass: `npm test`

### 4. Test Your Changes

```bash
# Run the full test suite
npm test

# Run linting and type checking
npm run lint
npm run type-check

# Build the project
npm run build
```

### 5. Submit Pull Request

- **Title**: Use a clear, descriptive title
- **Description**: Explain what changes you made and why
- **Reference Issues**: Link to related issues with `#123`
- **Screenshots**: Include screenshots for UI changes
- **Testing**: Describe how you tested your changes

### 6. Address Review Feedback

- Be responsive to reviewer comments
- Make requested changes in new commits
- Re-request review when ready

## Adding New Features

### Providers

When adding a new LLM provider:

```typescript
// 1. Create provider class extending BaseProvider
export class NewProvider extends BaseProvider {
  // Implement required methods
}

// 2. Add to ProviderFactory
ProviderFactory.register('new-provider', NewProvider);

// 3. Export from index
export { NewProvider, NewProviderConfig } from './NewProvider';
```

**Requirements:**
- Extend `BaseProvider` class
- Implement all required methods
- Add comprehensive error handling
- Include JSDoc documentation
- Add unit tests
- Update documentation

### Tools

When adding a new tool:

```typescript
// 1. Create tool class extending BaseTool
export class NewTool extends BaseTool {
  async execute(params: ToolParams): Promise<ToolResult> {
    // Implementation
  }

  getParameterSchema(): z.ZodSchema {
    // Return Zod schema
  }
}

// 2. Export from tools index
export { NewTool } from './NewTool';
```

**Requirements:**
- Extend `BaseTool` class
- Implement `execute()` and `getParameterSchema()` methods
- Use Zod for parameter validation
- Add comprehensive error handling
- Include usage examples

### Workers

When adding new worker configurations:

- Define clear expertise areas in system prompts
- Choose appropriate LLM models for the task type
- Set reasonable token limits and costs
- Document use cases and limitations
- Add example configurations

## Testing

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/           # End-to-end tests
```

### Writing Tests

```typescript
// Example unit test
describe('NewProvider', () => {
  it('should initialize correctly', () => {
    const provider = new NewProvider({ apiKey: 'test' });
    expect(provider).toBeInstanceOf(NewProvider);
  });

  it('should handle API errors gracefully', async () => {
    // Test error scenarios
  });
});
```

### Testing Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- NewProvider.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Requirements:**
- Write tests for all new functionality
- Aim for 80%+ code coverage
- Test error conditions and edge cases
- Use descriptive test names
- Keep tests fast and reliable

## Documentation

### Documentation Structure

```
docs/
├── introduction.mdx    # Getting started
├── core-concepts/     # Architecture and concepts
├── api/              # API reference
├── contributing/     # Contributing guides
└── examples/         # Code examples
```

### Documentation Standards

- Use **MDX** for documentation files
- Include code examples with syntax highlighting
- Add diagrams using Mermaid when helpful
- Keep examples runnable and up-to-date
- Document breaking changes clearly

### Updating Documentation

```bash
# Preview documentation locally
npm run docs:dev

# Build documentation
npm run docs:build
```

## Commit Messages

We use [Conventional Commits](https://conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Scopes

- `core`: Core business logic
- `providers`: Provider implementations
- `tools`: Tool implementations
- `types`: Type definitions
- `docs`: Documentation
- `tests`: Testing infrastructure

### Examples

```
feat(providers): add Anthropic Claude provider support
fix(core): resolve memory leak in task processing
docs(api): update provider configuration examples
test(tools): add integration tests for WebSearchTool
refactor(types): simplify TaskResult interface
```

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Workflow

1. **Automated Releases**: Releases are triggered automatically via GitHub Actions
2. **Version Bumping**: Version is determined by commit messages
3. **Changelog**: Generated automatically from conventional commits
4. **Publishing**: Published to npm registry automatically

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please:

- Be respectful and constructive in all interactions
- Use inclusive language
- Focus on the merit of ideas, not individuals
- Report any unacceptable behavior to maintainers
- Follow our community guidelines

## Getting Help

### Resources

- 📖 **[Documentation](https://officellm.dev)**: Comprehensive guides and API reference
- 💬 **[Discussions](https://github.com/anirudhp26/officellm/discussions)**: Ask questions and share ideas
- 🐛 **[Issues](https://github.com/anirudhp26/officellm/issues)**: Bug reports and feature requests
- 📧 **Discord/Slack**: Join our community chat (coming soon)

### Asking for Help

When asking for help:

1. **Check existing resources** first (docs, issues, discussions)
2. **Be specific** about your problem or question
3. **Include context** (code snippets, error messages, environment)
4. **Search before asking** to avoid duplicates

### Support Channels

- **General Questions**: Use [Discussions](https://github.com/anirudhp26/officellm/discussions)
- **Bug Reports**: Create [Issues](https://github.com/anirudhp26/officellm/issues)
- **Security Issues**: Email maintainers directly
- **Commercial Support**: Contact the maintainers

---

Thank you for contributing to officeLLM! Your efforts help make this project better for everyone. 🚀

*For questions about this contributing guide, please start a [discussion](https://github.com/anirudhp26/officellm/discussions).*"
