# GCP RHEL License Explorer Web Tool

A modern web application that transforms the CLI-based GCP RHEL License Explorer into an intuitive web interface for managing Google Cloud VM instances and handling RHEL license conversions between PAYG (Pay-As-You-Go) and BYOS (Bring Your Own Subscription).

## 🚀 Features

- **Real-time Instance Management**: View and manage GCP VM instances with live updates via WebSockets
- **RHEL License Detection**: Automatically detect and categorize RHEL license types (PAYG, BYOS, Marketplace)
- **License Conversion**: Convert between PAYG and BYOS licenses with guided workflows
- **Caching & Performance**: Intelligent caching with TTL for optimal API performance
- **Modern UI**: React-based responsive interface with Tailwind CSS
- **Docker Support**: Containerized deployment with multi-stage builds

## 🏗 Architecture

### Backend (Node.js/Express)
- **GCP API Integration**: Google Cloud Compute Engine and Resource Manager APIs
- **State Management**: Local JSON file caching with TTL
- **WebSocket Support**: Real-time updates using Socket.IO
- **Authentication**: Google Cloud authentication middleware
- **Error Handling**: Comprehensive error handling and logging

### Frontend (React)
- **Modern React**: Functional components with hooks
- **Real-time Updates**: WebSocket integration for live data
- **Responsive Design**: Tailwind CSS for modern UI
- **State Management**: Custom hooks for GCP data management

## 📦 Quick Start

### Prerequisites
- Node.js 18+ 
- GCP Project with Compute Engine API enabled
- Service account credentials with appropriate permissions

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gcp-rhel-license-explorer-web
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your GCP project details
   ```

4. **Set up GCP credentials**
   ```bash
   mkdir credentials
   # Place your service account key file in credentials/service-account-key.json
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Build and run**
   ```bash
   docker-compose up --build
   ```

2. **Environment variables**
   ```bash
   export GCP_PROJECT_ID=your-project-id
   docker-compose up
   ```

### Using Docker directly

1. **Build the image**
   ```bash
   docker build -t gcp-license-explorer .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 \
     -v $(pwd)/credentials:/app/credentials:ro \
     -v $(pwd)/data:/app/data \
     -e GCP_PROJECT_ID=your-project-id \
     gcp-license-explorer
   ```

## 📋 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `GCP_PROJECT_ID` | Google Cloud Project ID | Required |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key | `./credentials/service-account-key.json` |
| `CACHE_TTL` | Cache time-to-live (ms) | `300000` (5 min) |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### GCP Permissions Required

The service account needs these IAM roles:
- `Compute Engine Viewer` - List and view instances
- `Compute Instance Admin (v1)` - Modify instance licenses
- `Compute Storage Admin` - Manage disk licenses

## 🔧 API Endpoints

### Health Check
- `GET /api/health` - Application health status

### Projects
- `GET /api/projects/:projectId` - Project information
- `GET /api/projects/:projectId/zones` - Available zones
- `GET /api/projects/:projectId/licenses` - Available RHEL licenses

### Instances
- `GET /api/projects/:projectId/instances` - List instances
- `GET /api/projects/:projectId/instances/:name` - Instance details
- `POST /api/projects/:projectId/instances/:name/license` - Update license
- `POST /api/projects/:projectId/instances/refresh` - Force refresh
- `DELETE /api/projects/:projectId/instances/cache` - Clear cache

## 🧪 Development

### Running Tests
```bash
npm test
npm run test:watch
```

### Code Style
```bash
npm run lint
npm run format
```

### Build for Production
```bash
npm run build
```

## 📊 WebSocket Events

### Client → Server
- `join-project` - Join project room for updates
- `refresh-instances` - Trigger instance refresh
- `license-update-started` - Notify license update start

### Server → Client
- `instances-updated` - Instance data updated
- `license-update-progress` - License update status
- `project-update` - General project updates

## 🔍 Monitoring & Logging

- **Health Checks**: Built-in health endpoints for monitoring
- **Structured Logging**: Winston-based logging with rotation
- **Error Tracking**: Comprehensive error handling and reporting
- **Performance Metrics**: Cache statistics and API timing

## 🤝 Context7 Integration

This project leverages Context7 MCP for enhanced AI assistance:
- Real-time access to Google Cloud API documentation
- Enhanced troubleshooting capabilities
- Up-to-date code examples and patterns

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Related Projects

- [Original CLI Tool](https://github.com/MCloudinC/GCP-RHEL-License-Explorer)
- [Google Cloud Compute API](https://cloud.google.com/compute/docs/api)

## 🆘 Support

For issues and questions:
1. Check the [GitHub Issues](../../issues)
2. Review the [API Documentation](#-api-endpoints)
3. Consult the [Original CLI Tool](https://github.com/MCloudinC/GCP-RHEL-License-Explorer) documentation

---

**Note**: This web tool maintains full compatibility with the functionality of the original CLI-based GCP RHEL License Explorer while providing an enhanced user experience through modern web technologies.
