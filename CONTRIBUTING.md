# Contributing to Shajgoj E-commerce Platform

Thank you for your interest in contributing to Shajgoj! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Keep discussions on topic

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check if the feature has been suggested
2. Create a new issue describing:
   - The problem it solves
   - Proposed solution
   - Alternative solutions considered
   - Any additional context

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages
6. Push to your fork
7. Submit a pull request

## Development Setup

See [QUICKSTART.md](QUICKSTART.md) for setup instructions.

## Coding Standards

### Backend (Node.js)

- Use ES6+ features
- Follow standard JavaScript style
- Use async/await for asynchronous operations
- Add error handling for all database operations
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

Example:
```javascript
/**
 * Create a new order
 * @param {Object} orderData - Order data including items and shipping
 * @returns {Promise<Object>} Created order
 */
async create(orderData) {
  // Implementation
}
```

### Frontend (Next.js/TypeScript)

- Use TypeScript for type safety
- Follow React best practices
- Use functional components and hooks
- Keep components small and focused
- Use Tailwind CSS for styling
- Add proper types for props and state

Example:
```typescript
interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: number) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // Implementation
}
```

### Database

- Use parameterized queries (never string concatenation)
- Add proper indexes for frequently queried fields
- Use transactions for multi-step operations
- Handle constraint violations gracefully

## Testing

### Backend Testing

```bash
cd backend
# Add your tests in __tests__ directory
npm test
```

### Frontend Testing

```bash
cd frontend
# Add your tests
npm test
```

## Commit Messages

Follow the conventional commits format:

- `feat: add new feature`
- `fix: fix bug in component`
- `docs: update documentation`
- `style: format code`
- `refactor: refactor function`
- `test: add tests`
- `chore: update dependencies`

Example:
```
feat: add product search functionality

- Add search input to navbar
- Implement search API endpoint
- Update product listing to show search results
```

## Project Structure

```
shajgoj/
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   └── server.js    # Entry point
│   └── scripts/         # Database scripts
├── frontend/            # Next.js frontend
│   └── src/
│       ├── app/        # Next.js pages
│       ├── components/ # React components
│       ├── lib/        # Utilities
│       └── types/      # TypeScript types
└── docs/               # Documentation
```

## Database Changes

1. Create migration script in `backend/scripts/`
2. Update models if needed
3. Test migration on clean database
4. Document changes in API_DOCS.md

## Adding New Features

### Backend

1. Add model in `src/models/`
2. Create controller in `src/controllers/`
3. Add routes in `src/routes/`
4. Update API documentation

### Frontend

1. Create types in `src/types/`
2. Add API methods in `src/lib/api.ts`
3. Create components in `src/components/`
4. Add pages in `src/app/`

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. Push to repository
5. Create GitHub release

## Questions?

- Open an issue for questions
- Check existing issues and documentation
- Join our community discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
