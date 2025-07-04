# Resource Sharing Service - Documentation

This directory contains comprehensive documentation for the Resource Sharing Service, a scalable access control system designed for efficient resource management and sharing.

## 📖 Documentation Structure

### Core Documentation
- **[System Architecture](./architecture.md)** - High-level system design and components
- **[Database Design](./database-design.md)** - Schema decisions and optimization strategies  
- **[API Specification](./api-specification.md)** - Complete endpoint documentation
- **[Design Decisions](./design-decisions.md)** - Key architectural choices and rationale

### Technical Documentation  
- **[Performance Considerations](./performance.md)** - Scaling strategies and optimizations
- **[Development Guide](./development.md)** - Setup, testing, and contribution guidelines
- **[Deployment Guide](./deployment.md)** - Production deployment considerations

## 🎯 Quick Start

1. Review the [System Architecture](./architecture.md) for overall system understanding
2. Understand the [Database Design](./database-design.md) for data modeling approach
3. Check [API Specification](./api-specification.md) for endpoint details
4. See [Development Guide](./development.md) for local setup

## 🔧 Key Features

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

---

*Last updated: December 2024* 