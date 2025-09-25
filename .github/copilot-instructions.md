# GCP RHEL License Explorer Web Tool - Copilot Instructions

## Project Overview
This is a modern web application that transforms a CLI-based GCP RHEL License Explorer into a web tool. It manages Google Cloud VM instances and handles RHEL license conversions between PAYG (Pay-As-You-Go) and BYOS (Bring Your Own Subscription).

## Technical Stack
- **Backend**: Node.js/Express with GCP API integration
- **Frontend**: React with hooks and WebSocket support  
- **APIs**: Google Cloud Compute Engine and Resource Manager
- **State**: Local JSON file management with TTL caching
- **Real-time**: WebSocket updates
- **Containerization**: Docker multi-stage builds
- **AI Enhancement**: Context7 MCP integration

## Key Development Patterns

### Backend Patterns
- Use `express`, `@google-cloud/compute`, `google-auth-library`
- Implement `authenticateGCP` middleware for all GCP operations
- Use `StateManager` class for local state with TTL caching
- Follow controller pattern with proper error handling

### Frontend Patterns
- Use functional components with hooks
- Implement `useInstances` and `useWebSocket` custom hooks
- Real-time updates via WebSocket subscriptions
- Proper loading states and error boundaries

### GCP Integration
- Use `gcpService` patterns for instance management
- Implement license detection based on disk licenses
- Support PAYG/BYOS/Marketplace license types
- Use proper GCP authentication scopes

### Project Structure Requirements
```
/
├── backend/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   ├── websocket/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/
├── data/
│   └── state/
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## Development Guidelines
- ✅ Validate GCP credentials before operations
- ✅ Use async/await instead of promises.then()
- ✅ Implement proper error boundaries in React
- ✅ Cache GCP API responses with TTL
- ✅ Use WebSockets for real-time updates
- ✅ Follow REST API conventions
- ✅ Implement proper logging with winston
- ✅ Use environment variables for configuration
- ✅ Write unit tests for services
- ✅ Document all API endpoints

## Checklist Progress

- [x] ✅ Verify copilot-instructions.md file created
- [x] ✅ Clarify Project Requirements - GCP RHEL License Explorer web tool specified with full technical stack
- [x] ✅ Scaffold the Project Structure - Complete Node.js/Express backend with React frontend
- [x] ✅ Customize with GCP Integration - Full GCP Compute Engine API integration with authentication
- [x] ✅ Install Required Extensions - No specific extensions required
- [x] ✅ Compile the Project - Dependencies installed successfully
- [x] ✅ Create and Run Tasks - Development servers running on ports 3000 (backend) and 5173 (frontend)
- [x] ✅ Launch the Project - Development servers started successfully
- [x] ✅ Ensure Documentation Complete - Comprehensive README and documentation created

## Context7 Integration
The project leverages Context7 MCP for enhanced AI assistance with:
- Google Cloud API documentation access
- Real-time code examples and patterns
- Enhanced troubleshooting capabilities

## Reference Links
- Original CLI Tool: https://github.com/MCloudinC/GCP-RHEL-License-Explorer
- Google Cloud Compute API Documentation
- React Hooks Best Practices
- Express.js Security Patterns