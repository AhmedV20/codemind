# Contributing Guide

Thanks for your interest in **CodeMind**! 🚀 We'd love your help to make it even better.

## Ways to Contribute

- **Create an Issue** — Spot a bug? Have an idea for a new feature? Let us know!
- **Submit a Pull Request** — Found something to fix or improve? Jump in and submit a PR!
- **Spread the Word** — Share your experience with CodeMind on social media or with your tech community.
- **Use CodeMind** — The best feedback comes from real-world usage!

## Maintainers

CodeMind is maintained by [@AhmedV20](https://github.com/AhmedV20). While all contributions are welcome, please understand that not every suggestion may be accepted if they don't align with the project's goals or coding standards.

---

## Pull Requests

Before submitting a Pull Request, please ensure:

1. Your code passes the build: Run `npm run build`
2. Your code passes TypeScript check: Run `npx tsc --noEmit`
3. You have updated relevant documentation if you've added or changed functionality

---

## Local Development

### Setup

```bash
git clone https://github.com/AhmedV20/codemind.git
cd codemind
npm install
```

### Development Commands

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run lint     # Run ESLint
```

### Loading the Extension

1. Run `npm run build`
2. Open `chrome://extensions` or `edge://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder

---

## Coding Style

We use TypeScript with ESLint. Please make sure your code follows the style guide:

```bash
npm run lint
```

### Key Guidelines

- Use TypeScript strict mode
- Follow React best practices
- Use meaningful variable and function names
- Keep components focused and reusable
- Add comments for complex logic

---

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Description |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | Formatting, no code change |
| `refactor:` | Code restructuring |
| `test:` | Adding tests |
| `chore:` | Maintenance |

**Examples:**
```
feat: add OpenRouter as AI provider
fix: resolve rate limit modal not showing
docs: update README with new features
```

---

## Reporting Issues

When reporting issues:

- Search existing issues first
- Include browser version and OS
- Provide steps to reproduce
- Add screenshots if relevant
- Include console errors if any

---

## Project Structure

```
codemind/
├── public/              # Static assets & manifest
├── src/
│   ├── background/      # Service worker & API logic
│   ├── content/         # Content script components
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   └── utils/       # Utility functions
│   ├── popup/           # Extension popup
│   └── shared/          # Shared types & constants
└── dist/                # Build output
```

---

## Releasing

New versions are managed by the maintainer. If you think a release is needed, open an issue to discuss it.

---

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

Thank you for contributing to CodeMind! 🎉
