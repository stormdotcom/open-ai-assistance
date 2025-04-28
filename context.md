# Project Context

## Overview
This is a Node.js application that appears to be an AI assistance service. The project uses:
- Express.js as the web framework
- PostgreSQL with Sequelize as the database ORM
- OpenAI integration
- File upload capabilities with Multer
- Environment variable management with dotenv

## Project Structure
```
src/
├── controllers/    # Request handlers
├── models/        # Database models
├── routes/        # API route definitions
├── services/      # Business logic
├── constant.js    # Constants and configuration
├── store.js       # Data storage logic
└── index.js       # Application entry point
```

## .cursor Rules
1. Only add/modify files as per instruction
2. Don't over do - keep changes minimal and focused
3. Developer Context:
   - 4 years of experience
   - Intermediate level developer
   - Familiar with Node.js, Express, and database operations

## Development Guidelines
- Follow existing code patterns and structure
- Maintain clean code practices
- Use appropriate error handling
- Keep documentation up to date
- Follow the established project architecture

## Key Dependencies
- express: ^5.1.0
- sequelize: ^6.37.7
- openai: ^4.96.0
- pg: ^8.15.6
- multer: ^1.4.5-lts.2
- dotenv: ^16.5.0 
