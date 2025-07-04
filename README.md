# Resource Sharing Service

A scalable resource sharing system with multi-level access control built with Node.js, Fastify, TypeScript, and PostgreSQL.

## 🎯 Features

- **Multi-level Access Control**: Individual users, groups, and global sharing
- **High Performance**: Optimized queries with deduplication logic  
- **Scalable Design**: Built for growth in users, groups, and resources
- **Type Safety**: Full TypeScript implementation with strict validation
- **Production Ready**: Comprehensive tooling and best practices

## 🏗️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Fastify (high-performance web framework)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod for runtime type checking
- **Testing**: Jest for unit testing
- **Code Quality**: ESLint + Prettier + Husky

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd resource-sharing-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your database configuration
   ```

4. **Set up the database**
   ```bash
   # Create database
   createdb resource_sharing_db
   
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

### Health Check

Visit `http://localhost:3000/health` to verify the server is running.

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-19T10:30:00.000Z",
  "uptime": 123.456,
  "version": "1.0.0",
  "environment": "development"
}
```

## 📚 API Documentation

- **Base URL**: `http://localhost:3000/api/v1`
- **Content Type**: `application/json`

### Core Endpoints

- `GET /resource/:id/access-list` - Get users with access to a resource
- `GET /user/:id/resources` - Get resources accessible to a user
- `GET /resources/with-user-count` - Resource usage statistics
- `GET /users/with-resource-count` - User access statistics

See [API Specification](./docs/api-specification.md) for complete documentation.

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with test data

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
```

### Project Structure

```
src/
├── config/           # Environment configuration
├── domains/          # Domain-specific logic
│   ├── users/        # User management
│   ├── groups/       # Group management
│   ├── resources/    # Resource management
│   └── sharing/      # Access control logic
├── infrastructure/   # External integrations
├── types/           # TypeScript definitions
├── utils/           # Helper functions
├── app.ts          # Fastify application setup
└── server.ts       # Server startup
```

## 🗄️ Database Schema

The system uses a hybrid approach for optimal performance:

- **Resources**: Can be marked as global (accessible to all users)
- **Resource Shares**: Polymorphic table handling user and group shares
- **Deduplication**: Smart queries prevent double-counting overlapping permissions

See [Database Design](./docs/database-design.md) for detailed schema documentation.

## 🔐 Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/resource_sharing_db"

# Server
PORT=3000
NODE_ENV=development

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX=100
```

## 📖 Documentation

- [System Architecture](./docs/architecture.md)
- [Database Design](./docs/database-design.md)
- [API Specification](./docs/api-specification.md)
- [Design Decisions](./docs/design-decisions.md)

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

Tests cover:
- Access control logic
- API endpoint validation
- Database query optimization
- Error handling

## 🔄 Development Workflow

This project follows incremental development with milestone-based commits:

1. **Foundation & Health Check** - Basic server setup
2. **Database & Core Structure** - Schema and services
3. **API Implementation** - Complete endpoint functionality
4. **Testing & Documentation** - Comprehensive testing

## 🚀 Production Deployment

### Building for Production

```bash
npm run build
npm run start
```

### Environment Setup

- Set `NODE_ENV=production`
- Configure proper database URL
- Set up connection pooling
- Configure logging levels

### Performance Considerations

- Database indexes are optimized for frequent access checks
- Connection pooling configured for high concurrency
- Rate limiting prevents abuse
- Efficient deduplication for overlapping permissions

## 🔮 Future Improvements

Given more development time, these features would be prioritized:

### High Priority
- **Authentication & Authorization**: JWT-based auth system
- **Audit Logging**: Complete access audit trail
- **Caching Layer**: Redis for high-frequency access checks
- **API Versioning**: Support for backward compatibility

### Medium Priority
- **Resource Hierarchies**: Parent-child relationships
- **Permission Levels**: Read/write/admin granularity  
- **Time-based Access**: Expiring shares
- **Bulk Operations**: Batch share management

### Infrastructure
- **Docker Containerization**: Complete container setup
- **Monitoring**: Prometheus + Grafana dashboards
- **CI/CD Pipeline**: Automated testing and deployment
- **Load Testing**: Performance benchmarking

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

*Built with ❤️ using modern Node.js practices*