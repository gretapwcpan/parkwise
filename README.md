# ParkWise - Smart Parking Space Booking System

A real-time parking space booking application with intelligent search and navigation features.

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- pnpm (v8 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/gretapwcpan/parkwise.git
cd parkwise
```

2. Install pnpm if you don't have it:
```bash
npm install -g pnpm
```

3. Install dependencies:
```bash
pnpm install
```

4. Set up environment variables:
```bash
cp packages/backend/.env.example packages/backend/.env
# Edit packages/backend/.env with your configuration
```

### Running the Application

Start both backend and frontend:
```bash
pnpm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Building for Production

```bash
pnpm run build
```

## Project Structure

```
parkwise/
├── packages/
│   ├── backend/          # Express.js API server
│   ├── frontend/         # React application
│   ├── llm-service/      # Python LLM service (optional)
│   └── mcp-server/       # MCP tools server (optional)
└── docs/                 # Additional documentation
```

## Features

- 🗺️ Real-time parking space search
- 📍 Interactive map with OpenStreetMap
- 🎯 Smart location-based recommendations
- 🚗 Turn-by-turn navigation
- 🎤 Voice assistant integration
- 📱 Responsive design

## Testing

### Running Tests

#### Backend Tests
```bash
# Run from root directory
pnpm --filter backend test

# Or navigate to backend
cd packages/backend
pnpm test

# Run specific test file
pnpm test tests/simple.test.js

# Run with coverage
pnpm test -- --coverage

# Watch mode for development
pnpm test -- --watch
```

#### Frontend Tests
```bash
# Run from root directory
pnpm --filter frontend test

# Or navigate to frontend
cd packages/frontend
pnpm test

# Run tests once (CI mode)
CI=true pnpm test -- --watchAll=false

# Run with coverage
pnpm test -- --coverage --watchAll=false
```

#### Python LLM Service Tests
```bash
cd packages/llm-service

# Install test dependencies
pip install pytest pytest-asyncio pytest-cov

# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Run specific test file
pytest tests/unit/test_query_parser.py
```

### Test Structure

```
packages/
├── backend/
│   ├── jest.config.js           # Jest configuration
│   └── tests/
│       ├── setup.js             # Test setup and utilities
│       ├── simple.test.js       # Basic tests (working example)
│       └── unit/
│           └── services/        # Service unit tests
├── frontend/
│   ├── src/
│   │   ├── setupTests.js        # React test setup
│   │   └── components/
│   │       └── __tests__/       # Component tests
└── llm-service/
    ├── pytest.ini               # Pytest configuration
    └── tests/
        ├── conftest.py          # Shared fixtures
        └── unit/                # Unit tests
```

## Troubleshooting

### Port Already in Use

If you see an error about ports being in use, find and stop the existing process:

```bash
# Find process on port 3000 or 5000
lsof -i :3000
lsof -i :5000

# Stop the process
kill -9 <PID>
```

### Dependencies Issues

If you encounter module errors, clean and reinstall:

```bash
# Remove all node_modules
rm -rf node_modules packages/*/node_modules

# Clear cache and reinstall
pnpm store prune
pnpm install
```

### Package Manager Notes

This project uses **pnpm** for package management. Key commands:
- `pnpm install` - Install all dependencies
- `pnpm add <package>` - Add a new package
- `pnpm --filter <workspace> add <package>` - Add package to specific workspace
- `pnpm run <script>` - Run a script
- `pnpm -r test` - Run tests in all packages

## License

Apache-2.0

## Support

For issues or questions, please check our [GitHub Issues](https://github.com/gretapwcpan/parkwise/issues).
