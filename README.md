# Todo App with Atlas UI

![CI Status](https://github.com/dil-asomlai/ai-assisted-coding-training/actions/workflows/ci.yml/badge.svg)

A React-based Todo application built with TypeScript, Material UI, and Atlas UI components. This project demonstrates modern React development practices with proper state management, component architecture, and comprehensive testing.

## Features

- ✅ Create, read, update, and delete todo items
- ✅ Mark todos as completed
- ✅ Session persistence - todos survive page refreshes
- ✅ Responsive design with Material UI
- ✅ TypeScript for type safety
- ✅ React Context for state management
- ✅ Comprehensive test coverage
- ✅ Prettier and ESLint for code quality
- ✅ Husky pre-commit hooks
- ✅ GitHub Actions CI/CD workflow

## Quick Start

```bash
# Clone the repository
git clone https://github.com/dil-asomlai/ai-assisted-coding-training.git

# Navigate to project directory
cd ai-assisted-coding-training

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the app.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production-ready app
- `npm run lint` - Run ESLint to fix code issues
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests
- `npm run preview` - Preview production build locally

## Project Structure

The project follows a feature-based organization:

```
src/
├── __tests__/                   # Test files
├── assets/                      # Media assets
├── components/                  # React components
├── contexts/                    # React contexts
├── providers/                   # React providers
├── types/                       # TypeScript type definitions
└── ...
```

## AI Development Support

This project is set up to work seamlessly with various AI coding assistants:

- For comprehensive project documentation, see [AI.md](./AI.md)
- For GitHub Copilot, see [.github/copilot/suggestions.json](./.github/copilot/suggestions.json)
- For Cursor AI, see [.cursor](./.cursor)
- For Claude Code, see [CLAUDE.md](./CLAUDE.md)

These files contain helpful information for AI tools to understand the project's structure, patterns, and practices.

## Session Persistence

The application automatically persists your todo items in browser `sessionStorage`, which means:

- ✅ **Todos survive page refreshes** - Your work won't be lost if you accidentally refresh the page
- ✅ **Session-scoped** - Todos are cleared when you close all browser tabs (by design)
- ✅ **Client-side only** - No server storage or data transmission
- ✅ **Graceful error handling** - Corrupt data is automatically cleared and you'll see a warning toast if storage quota is exceeded

### Technical Details

- Data is stored as JSON in `sessionStorage` under the key `"todos"`
- Date objects are properly serialized and deserialized
- Invalid data structures are detected and cleared automatically
- Storage quota errors show a non-blocking warning toast
- The app continues to work in-memory even if storage fails

### Limitations

- **No cross-device sync** - Todos are local to the current browser session
- **No encryption** - Data is stored as plain text in browser storage
- **Session only** - Closing all browser tabs clears the data (this is intentional)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
