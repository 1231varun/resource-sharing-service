# Resource Sharing Service

A scalable resource sharing system with multi-level access control built with Node.js, Fastify, TypeScript, and PostgreSQL.

## 🎯 Overview

This service demonstrates enterprise-level API development with:
- **Multi-level Access Control**: Direct user sharing, group-based access, and global resources
- **High Performance**: Optimized PostgreSQL queries with smart deduplication
- **Production Ready**: TypeScript, comprehensive error handling, and API documentation
- **Developer Experience**: Hot reload, testing, linting, and interactive API docs

## 📋 Table of Contents

- [⚡ Quick Start](#-quick-start) - Get running in 2 minutes
- [🛠️ Developer Automation](#️-developer-automation) - Powerful automation scripts  
- [🚀 Setup Guide](#-setup-guide) - Automated vs manual setup
- [🚨 Quick Troubleshooting](#-quick-troubleshooting) - Automated fixes for common issues
- [📚 API Documentation & Testing](#-api-documentation--testing) - Interactive docs & testing
- [🔧 Development Workflow](#-development-workflow) - Daily development scenarios
- [🔐 Environment Configuration](#-environment-configuration) - Environment setup
- [🔧 Troubleshooting](#-troubleshooting) - Detailed troubleshooting guide

## ⚡ Quick Start

**🎯 New to the project? Get running in 2 minutes:**
```bash
# Install PostgreSQL, clone, setup everything, and start developing
brew install postgresql@15 && brew services start postgresql@15
git clone <your-repo-url> && cd resource-sharing-service
npm run full:setup && npm run dev

# 🎉 That's it! API docs at http://localhost:3000/docs
```

**🔧 Daily Development Commands:**
```bash
npm run dev          # Start development server
npm run dev:db       # Start server + database GUI
npm run verify       # Check everything is working
npm run shutdown     # End of day cleanup
```

## 🛠️ Developer Automation

**This project includes powerful automation scripts:**

**🚀 Setup & Installation:**
- `npm run full:setup` - **Complete project setup in one command**
- `npm run setup` - Environment + database setup
- `npm run setup:fresh` - Reset everything and verify

**💻 Development Workflow:**
- `npm run dev:fresh` - **Fresh start with clean database** (auto-starts DB + resets + seeds)
- `npm run dev:db` - Start server + database studio together
- `npm run verify` - Check if everything is working

**🔄 Service Management:**
- `npm run restart` - Quick restart with current setup
- `npm run restart:fresh` - Complete fresh restart
- `npm run stop:server` - Stop just the API server
- `npm run stop:db` - Stop PostgreSQL service

**🧹 Cleanup & Reset:**
- `npm run shutdown` - Graceful end-of-day shutdown
- `npm run shutdown:nuclear` - ⚠️ **NUCLEAR**: Delete everything and start over

**👀 Verification & Testing:**
- `npm run health` - Quick server health check
- `npm run api:test` - Test API functionality
- `npm run docs:open` - Open API docs in browser

> **💡 Pro Tip**: These scripts handle all the complexity for you - PostgreSQL management, database setup, port conflicts, environment configuration, and more!

## 🏗️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Fastify (high-performance web framework)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 15+ with Prisma ORM
- **Validation**: Zod for runtime type checking
- **Documentation**: OpenAPI/Swagger with interactive UI
- **Testing**: Jest with coverage reporting
- **Code Quality**: ESLint + Prettier + Husky

## 🚀 Setup Guide

### 🎯 Choose Your Setup Path

**🚀 RECOMMENDED: Automated Setup (New!)**
```bash
# 1. Prerequisites: Node.js 18+, Homebrew, Git
# 2. Install PostgreSQL
brew install postgresql@15 && brew services start postgresql@15

# 3. Clone and auto-setup everything
git clone <your-repo-url>
cd resource-sharing-service
npm run full:setup  # 🎉 One command does everything!

# 4. Start developing
npm run dev
```

**⚙️ Manual Setup (For Learning/Customization)**
Click to expand the manual setup steps below if you prefer to understand each step.

<details>
<summary><strong>📖 Manual Setup Steps (Click to Expand)</strong></summary>

### Step 1: Prerequisites

**Required Software:**
- Node.js 18 or higher
- Homebrew (for macOS)
- Git

**Check your versions:**
```bash
node --version  # Should be v18+
npm --version   # Should be v8+
brew --version  # Should be installed
```

### Step 2: Install PostgreSQL

**Install PostgreSQL via Homebrew:**
```bash
# Install PostgreSQL 15
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15
```

**Add PostgreSQL to your PATH:**
```bash
# Add to your shell profile (.zshrc, .bashrc, etc.)
export PATH="/opt/homebrew/Cellar/postgresql@15/15.13/bin:$PATH"

# Reload your shell or run:
source ~/.zshrc  # or ~/.bashrc
```

### Step 3: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd resource-sharing-service

# Install dependencies
npm install
```

### Step 4: Database Setup

**Create the database:**
```bash
# Create database (use full path if createdb not in PATH)
createdb resource_sharing_db

# Alternative if createdb not found:
/opt/homebrew/Cellar/postgresql@15/15.13/bin/createdb resource_sharing_db
```

**Set up environment variables:**
```bash
# Create .env file
echo 'DATABASE_URL="postgresql://$(whoami)@localhost:5432/resource_sharing_db"' > .env
echo 'PORT=3000' >> .env
echo 'NODE_ENV=development' >> .env
```

**Run database migrations:**
```bash
# Generate Prisma client and create tables
npx prisma migrate dev --name init

# Seed database with sample data
npx prisma db seed
```

> **Note**: The system uses UUID v4 format for all IDs to ensure compatibility with API validation. If you encounter ID format validation errors, run `npx prisma migrate reset --force` to reset the database with proper UUID generation.

You should see output like:
```
Starting database seeding...
Created 4 users
Created 3 groups
Added users to groups
Created 5 resources
Created resource shares
Database seeding completed successfully!

Sample data summary:
- Users: 4
- Groups: 3
- Resources: 5 (1 global, 4 specific)
- User group memberships: 5
- Resource shares: 5
```

### Step 5: Start the Development Server

```bash
# Start development server with hot reload
npm run dev
```

The server will start on `http://localhost:3000`. You should see:
```
Server listening at http://0.0.0.0:3000
Environment: development
```

### Step 6: Verify Installation

**Test the health endpoint:**
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-07-04T15:12:39.780Z",
  "uptime": 14.005212875,
  "version": "1.0.0",
  "environment": "development"
}
```

### Step 7: Connect Database GUI Tool (Optional)

**Connect with your preferred database viewer:**

You can use any PostgreSQL-compatible database GUI tool to visualize and manage your data:

**Connection Settings:**
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `resource_sharing_db`
- **Username**: Your macOS username (run `whoami` to find it)
- **Password**: Leave empty (no password required)

**Popular Database GUI Tools:**
- **[Beekeeper Studio](https://www.beekeeperstudio.io/)** - Free, modern, cross-platform
- **[TablePlus](https://tableplus.com/)** - Native macOS/Windows app
- **[pgAdmin](https://www.pgadmin.org/)** - Full-featured PostgreSQL administration
- **[DBeaver](https://dbeaver.io/)** - Free, universal database tool
- **Prisma Studio** - Built-in tool (run `npm run db:studio`)

**Quick Setup Example (Beekeeper Studio):**
1. Download and install [Beekeeper Studio](https://www.beekeeperstudio.io/)
2. Create new connection → PostgreSQL
3. Enter connection details above
4. Test connection and connect
5. Explore your `users`, `groups`, `resources`, and `resource_shares` tables

**Alternative: Use Built-in Prisma Studio:**
```bash
npm run db:studio
```
Opens at `http://localhost:5555` with a web-based database browser.

</details>

---

## ✅ Verify Your Setup

**Test everything is working:**
```bash
npm run verify      # Comprehensive system check
npm run health      # Quick server health check  
npm run api:test    # Test API functionality
```

**Expected results:**
- ✅ Server responding at http://localhost:3000
- ✅ Database connected with seeded data
- ✅ API returning resource statistics
- ✅ All systems operational!

## 🚨 Quick Troubleshooting

**Something not working? Try these automated fixes:**

```bash
# ❌ Server won't start (port conflict)
npm run stop:server && npm run dev

# ❌ Database connection issues
npm run restart                      # Handles DB service start + restart

# ❌ Strange behavior / want fresh start
npm run restart:fresh

# ❌ Everything is broken / nuclear option
npm run shutdown:nuclear && npm run full:setup

# ✅ Check what's working
npm run verify
```

**Need to reset?**
- `npm run restart` - Quick restart (keeps data)
- `npm run restart:fresh` - Fresh restart (resets everything)
- `npm run shutdown:nuclear` - **⚠️ DESTRUCTIVE** (deletes everything)

> **💡 Pro Tip**: Start with `npm run verify` to see what's broken, then use the appropriate restart level.

## 📚 API Documentation & Testing

### Interactive Swagger Documentation

Visit **`http://localhost:3000/docs`** in your browser for interactive API testing.

The Swagger UI provides:
- ✅ Complete API specification
- ✅ Interactive endpoint testing
- ✅ Request/response examples
- ✅ Schema documentation

### Core API Endpoints

**Resource Statistics:**
```bash
curl http://localhost:3000/resources/stats
```

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "resources": [
      {
        "id": "d022372b-f6d9-4f31-8940-dc92f3094efd",
        "name": "Company Handbook",
        "description": "Employee handbook and policies",
        "isGlobal": true,
        "userCount": 4,
        "directShares": 0,
        "groupShares": 0,
        "createdAt": "2025-07-04T15:28:03.613Z"
      }
    ],
    "summary": {
      "totalResources": 5,
      "globalResources": 1,
      "totalUniqueUsers": 4,
      "avgUsersPerResource": 2.2
    }
  }
}
```

**Test access control endpoints:**
```bash
# Get users with access to a resource (using real UUID from stats)
curl "http://localhost:3000/resource/d022372b-f6d9-4f31-8940-dc92f3094efd/access-list"

# Check if user has access to resource
curl "http://localhost:3000/user/794ac097-d3b8-4ab8-bceb-70b4ce719e42/access-check/cbe40884-0f07-4593-8759-dcd4817f9dc7"
```

### Postman Collection

Generate a complete Postman collection:
```bash
npm run postman:generate
```

This creates:
- `postman/Resource-Sharing-API.postman_collection.json` - Complete API collection
- `postman/resource-sharing-dev.postman_environment.json` - Environment variables

**Import into Postman:**
1. Open Postman
2. Click "Import"
3. Select both generated files
4. Start testing the API with pre-configured requests

## 🗄️ Database Schema & Sample Data

### Schema Overview

The system uses an optimized hybrid design:

**Tables:**
- `users` - User accounts with email/name
- `groups` - Groups for organizational access
- `user_groups` - Many-to-many user-group relationships
- `resources` - Resources with global/specific access flags
- `resource_shares` - Polymorphic sharing table (user or group targets)

### Sample Data Scenarios

After seeding, you'll have these test scenarios:

**Users:**
- John Doe (Developer)
- Jane Smith (Developer) 
- Bob Johnson (Manager)
- Alice Brown (Administrator + Manager)

**Resources & Access:**
- **Company Handbook** (Global) → All 4 users
- **Development Tools** (Group) → Developers only (John, Jane)
- **Financial Reports** (Group) → Managers only (Bob, Alice)
- **Admin Panel** (Group) → Administrators only (Alice)
- **Project Documentation** (Direct) → John and Jane directly

## 🔧 Development Workflow

### ⚡ Common Scenarios

**🎯 First Time Setup:**
```bash
git clone <repo> && cd resource-sharing-service
npm run full:setup  # Installs deps + creates .env + sets up DB + verifies
npm run dev         # Start development server
```

**🔄 Daily Development:**
```bash
npm run dev         # Normal development start
npm run dev:db      # Start with database studio open
npm run dev:fresh   # Fresh start with clean database
```

**🔧 Troubleshooting:**
```bash
npm run verify      # Check if everything is working
npm run health      # Quick server health check
npm run setup:fresh # Reset everything and verify
```

**🧪 Testing & Quality:**
```bash
npm run test        # Run all tests
npm run lint:fix    # Fix code style issues
npm run api:test    # Quick API functionality test
```

**📚 Documentation:**
```bash
npm run docs:open   # Open Swagger docs in browser
npm run postman:generate # Generate Postman collection
```

**🧹 Cleanup & Shutdown:**
```bash
npm run shutdown     # Graceful shutdown (end of day)
npm run restart      # Quick restart with current setup
npm run restart:fresh # Start completely fresh
npm run shutdown:nuclear # ⚠️  NUCLEAR: Delete everything and start over
```

**🔄 Service Management:**
```bash
npm run stop:server  # Stop just the API server
npm run stop:db      # Stop PostgreSQL service
npm run start:db     # Start PostgreSQL service
```

### Available Scripts

```bash
# 🚀 Quick Setup & Start
npm run full:setup   # Complete setup from scratch (install + env + db + verify)
npm run setup        # Set up environment and database
npm run setup:fresh  # Reset everything and verify
npm run verify       # Check if everything is working
npm run health       # Quick server health check

# 💻 Development
npm run dev          # Start with hot reload
npm run dev:fresh    # Reset database and start dev server
npm run dev:db       # Start dev server + database studio
npm run build        # Build for production
npm run start        # Start production server

# 🗄️ Database Management
npm run setup:env    # Create .env file with defaults
npm run setup:db     # Initialize database with migrations + seed
npm run db:init      # Run initial migration
npm run db:reset     # Reset database with proper UUID format
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Create and run migrations
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Populate with sample data
npm run db:verify    # Verify database connection

# 🧪 Testing & Quality
npm run test         # Run Jest tests
npm run test:watch   # Watch mode testing
npm run test:coverage # Coverage reports
npm run lint         # ESLint checking
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier formatting

# 📚 Documentation & API Testing
npm run docs:open    # Open API docs in browser
npm run docs:serve   # Start server with docs message
npm run api:test     # Quick API functionality test
npm run postman:generate  # Generate Postman collection
npm run docs:generate     # Generate all documentation

# 🧹 Maintenance & Cleanup
npm run clean        # Clean build artifacts and cache
npm run shutdown     # Graceful shutdown (stop services + clean cache)
npm run shutdown:nuclear # ⚠️  DESTRUCTIVE: Complete reset (stops services + deletes DB + cleans everything)

# 🔄 Service Management
npm run stop:server  # Stop development server on port 3000
npm run stop:db      # Stop PostgreSQL service
npm run start:db     # Start PostgreSQL service
npm run restart      # Shutdown + setup + start dev
npm run restart:fresh # Nuclear cleanup + full setup + start dev

# 🗄️ Database Cleanup
npm run clean:database # Stop DB + restart + drop database
npm run clean:full   # Remove .env, migrations, node cache
```

### Project Structure

```
resource-sharing-service/
├── src/
│   ├── domains/              # Domain-driven design
│   │   ├── users/           # User management service
│   │   ├── groups/          # Group management service
│   │   ├── resources/       # Resource management service
│   │   └── sharing/         # Core access control logic
│   ├── infrastructure/      # External dependencies
│   │   └── database/        # Database connection & config
│   ├── routes/              # API route definitions
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Helper functions & errors
│   ├── app.ts              # Fastify application setup
│   └── server.ts           # Server startup & configuration
├── prisma/
│   ├── schema.prisma       # Database schema definition
│   └── migrations/         # Database migrations
├── docs/                   # Generated documentation
├── postman/               # Generated Postman collections
├── scripts/               # Build & utility scripts
└── src/database/          # Database seeding scripts
```

## 🔐 Environment Configuration

### Required Environment Variables

Create `.env` file with:

```env
# Database Connection
DATABASE_URL="postgresql://username@localhost:5432/resource_sharing_db"

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional Security Settings
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX=100
```

### Database URL Formats

**Local Development:**
```
postgresql://username@localhost:5432/resource_sharing_db
```

**With Password:**
```
postgresql://username:password@localhost:5432/resource_sharing_db
```

**Production (with connection pooling):**
```
postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=20
```

## 🧪 Testing Strategy

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage reports
npm run test:coverage
```

### Test Coverage

Tests cover:
- ✅ **Access Control Logic** - Multi-level permission checking
- ✅ **API Endpoints** - Request/response validation
- ✅ **Database Queries** - Optimization and correctness
- ✅ **Error Handling** - Graceful failure scenarios
- ✅ **Type Safety** - TypeScript strict mode compliance

### Testing Tools

- **Jest** - Test runner and assertions
- **Supertest** - HTTP endpoint testing
- **Test Database** - Isolated test environment
- **Coverage Reports** - Istanbul/NYC integration

## 🚀 Production Deployment

### Build Process

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm run start
```

### Production Environment

**Environment Variables:**
```env
NODE_ENV=production
DATABASE_URL="postgresql://prod-user:pass@prod-host:5432/prod-db"
PORT=3000
```

**Performance Optimizations:**
- Database connection pooling
- Query optimization with indexes
- Rate limiting protection
- CORS security headers
- Request validation middleware

### Docker Support (Future Enhancement)

```dockerfile
# Dockerfile structure for containerization
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Troubleshooting

### Cleanup & Reset Strategies

**When to use different cleanup levels:**

**🟢 Light Cleanup (`npm run shutdown`):**
- End of workday
- Switching to different project
- Free up system resources
- **What it does**: Stops services + cleans build cache

**🟡 Restart (`npm run restart`):**
- API not responding correctly
- Want fresh server instance
- **What it does**: Shutdown + setup + start dev server

**🟠 Fresh Restart (`npm run restart:fresh`):**
- Database issues
- Want completely clean environment
- Testing clean installation
- **What it does**: Nuclear cleanup + full setup + start

**🔴 Nuclear Option (`npm run shutdown:nuclear`):**
- ⚠️  **DESTRUCTIVE** - Use with caution!
- Project completely broken
- Want to start from absolute scratch
- **What it does**: Deletes database + .env + migrations + cache

### Common Issues

**PostgreSQL Connection Errors:**
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Restart if needed
brew services restart postgresql@15

# Check database exists
psql -l | grep resource_sharing_db
```

> **💡 Note**: All database-related scripts (`dev:fresh`, `restart`, `restart:fresh`) automatically start PostgreSQL if it's not running. No need to manually start the database service before using these commands.

**Port Already in Use:**
```bash
# Easy way: Use the provided script
npm run stop:server

# Manual way: Find and kill process
lsof -ti:3000 && kill -9 $(lsof -ti:3000)
```

**Prisma Client Issues:**
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database if needed
npx prisma migrate reset
```

**ID Format Validation Errors:**
```bash
# If you get "must match format uuid" errors:
# The API expects UUID format but database has CUID format

# Solution 1: Reset database with proper UUID schema
npx prisma migrate reset --force

# Solution 2: Check current ID format in database
# UUIDs look like: 550e8400-e29b-41d4-a716-446655440000
# CUIDs look like: cmcoydt27000731srpa9v96ey

# Verify schema uses @default(uuid()) not @default(cuid())
```

**TypeScript Compilation Errors:**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Fix linting issues
npm run lint:fix
```

### Performance Monitoring

**Database Query Analysis:**
```bash
# Open Prisma Studio for visual database inspection
npm run db:studio
```

**Verify Database Contents:**
```bash
# Check if seeded data exists using any of these methods:

# Option 1: Use Prisma Studio (web interface)
npm run db:studio

# Option 2: Use your GUI tool (Beekeeper Studio, TablePlus, etc.)
# Connect with settings from Step 7 above

# Option 3: Command line (if psql is in PATH)
psql -d resource_sharing_db -c "SELECT COUNT(*) as user_count FROM users;"
psql -d resource_sharing_db -c "SELECT COUNT(*) as resource_count FROM resources;"
```

**Expected Seeded Data Counts:**
- Users: 4 (John Doe, Jane Smith, Bob Johnson, Alice Brown)
- Groups: 3 (Developers, Managers, Administrators)
- Resources: 5 (Company Handbook, Development Tools, Financial Reports, Admin Panel, Project Documentation)
- User-Group memberships: 5
- Resource shares: 5

**API Performance Testing:**
```bash
# Basic load testing with curl
for i in {1..100}; do curl -s http://localhost:3000/health > /dev/null; done
```

## 🔮 Future Enhancements

### High Priority Features

**Authentication & Security:**
- JWT-based authentication
- Role-based access control (RBAC)
- API key management
- Rate limiting per user

**Audit & Compliance:**
- Access audit logging
- Permission change tracking
- Compliance reporting
- Data retention policies

**Performance & Scalability:**
- Redis caching layer
- Database read replicas
- Connection pooling optimization
- API response caching

### Medium Priority Features

**Advanced Access Control:**
- Resource hierarchies (parent-child)
- Time-based access (expiring shares)
- Permission levels (read/write/admin)
- Conditional access rules

**User Experience:**
- Bulk operations API
- Resource search and filtering
- Access request workflows
- Notification system

### Infrastructure Improvements

**DevOps & Monitoring:**
- Docker containerization
- Kubernetes deployment
- Prometheus metrics
- Grafana dashboards
- ELK stack logging

**CI/CD Pipeline:**
- GitHub Actions workflow
- Automated testing
- Security scanning
- Performance benchmarking

## 📊 System Architecture

### Access Control Logic

The system implements a **hybrid approach** optimizing for both flexibility and performance:

1. **Global Resources** - Immediate access for all users (optimized query)
2. **Direct Shares** - User-specific resource access
3. **Group Shares** - Role-based access through group membership
4. **Smart Deduplication** - Prevents double-counting overlapping permissions

### Database Design Principles

- **Polymorphic Relationships** - Single table for user/group shares
- **Optimized Indexes** - Fast access control queries
- **Normalized Structure** - Prevents data redundancy
- **Scalable Design** - Handles millions of users/resources

## 📄 API Reference

### Complete Endpoint List

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |
| `GET` | `/docs` | Interactive API documentation |
| `GET` | `/docs/json` | OpenAPI specification |
| `GET` | `/resource/{id}/access-list` | Users with access to resource |
| `GET` | `/user/{id}/access-check/{resourceId}` | Check user access to resource |
| `GET` | `/resources/stats` | Resource statistics with user counts |

### Response Format

All endpoints return standardized responses:

```json
{
  "success": true,
  "data": { ... },
  "requestId": "req-123"
}
```

**Error responses:**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource with ID 'xyz' not found"
  },
  "requestId": "req-123"
}
```

## 📋 Development Checklist

### Before Committing

- [ ] All tests passing (`npm run test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] API documentation updated
- [ ] Database migrations tested

### Before Deploying

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Health check passing
- [ ] Performance testing completed
- [ ] Security scan passed
- [ ] Monitoring configured

## 📞 Support & Contributing

### Getting Help

1. **Check the documentation** - Most questions are answered here
2. **Search existing issues** - Common problems may already be solved
3. **Open an issue** - For bugs or feature requests
4. **Join discussions** - For general questions and ideas

### Contributing Guidelines

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all checks pass
5. Submit a pull request with clear description

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using modern Node.js practices**

*This project demonstrates enterprise-level API development with TypeScript, PostgreSQL, and comprehensive testing within a 5-hour development constraint.*