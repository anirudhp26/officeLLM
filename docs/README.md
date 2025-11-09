# officeLLM Documentation

This directory contains the Mintlify documentation for officeLLM, a TypeScript library for building multi-agent AI systems.

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
cd docs
npm install
```

### Local Development

```bash
npm run dev
```

This will start a local development server at `http://localhost:3000`.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Documentation Structure

```
docs/
├── mint.json          # Mintlify configuration
├── introduction.mdx   # Main introduction
├── quick-start.mdx    # Quick start guide
├── installation.mdx   # Installation instructions
├── core-concepts/     # Architecture and concepts
│   ├── architecture.mdx
│   └── providers.mdx
├── api/               # API reference
│   └── officeLLM.mdx
├── examples/          # Usage examples
│   └── basic-usage.mdx
├── logo/              # Logo assets
├── favicon.svg        # Favicon
└── package.json       # Documentation dependencies
```

## Theme

This documentation uses a minimalistic black and white theme:

- **Primary Color**: Black (`#000000`)
- **Background**: White for light mode, Black for dark mode
- **Theme**: Dark mode by default
- **Typography**: Clean, minimal styling

## Deployment

The documentation can be deployed to:

- **Mintlify Cloud**: Automatic deployment via GitHub integration
- **Vercel**: Static site deployment
- **Netlify**: Static site deployment
- **GitHub Pages**: Manual deployment

### Mintlify Cloud Deployment

1. Connect your GitHub repository to Mintlify
2. Push changes to trigger automatic deployment
3. Access your docs at `https://your-project.mintlify.app`

## Contributing to Documentation

### Writing Guidelines

- Use clear, concise language
- Include code examples for all features
- Use proper heading hierarchy
- Include TypeScript type definitions
- Test all code examples

### Adding New Pages

1. Create a new `.mdx` file in the appropriate directory
2. Add the page to `mint.json` navigation
3. Include proper frontmatter (title, description)
4. Use Mintlify components for better UX

### Mintlify Components

```jsx
// Parameter fields
<ParamField body="parameterName" required>
  Description of the parameter
</ParamField>

// Info/Warning/Note callouts
<Info>Important information</Info>
<Warning>Warning message</Warning>
<Note>Note message</Note>

// Code blocks
```typescript
// Code example
```

// Cards
<CardGroup>
  <Card title="Title" icon="icon" href="/link">
    Description
  </Card>
</CardGroup>
```

## Support

For questions about the documentation:

- 📖 Check the [officeLLM repository](https://github.com/anirudhp26/officellm)
- 🐛 [Open documentation issues](https://github.com/anirudhp26/officellm/issues)
- 💬 [Discussions](https://github.com/anirudhp26/officellm/discussions)
