const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { createServer } = require('http');
require('dotenv').config();

const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const authenticateGCP = require('./middleware/authenticateGCP');
const { setupWebSocket } = require('./websocket/socketHandlers');

// Import routes
const instanceRoutes = require('./routes/instances');
const projectRoutes = require('./routes/projects');
const healthRoutes = require('./routes/health');

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing and compression
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { 
  stream: { write: message => logger.info(message.trim()) }
}));

// Serve static files
app.use(express.static('public'));

// Health check route (no auth required)
app.use('/api/health', healthRoutes);

// GCP Authentication middleware for protected routes
app.use('/api', authenticateGCP);

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/instances', instanceRoutes);

// Setup WebSocket
setupWebSocket(server);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

server.listen(PORT, () => {
  logger.info(`GCP RHEL License Explorer server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;