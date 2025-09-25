const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV || 'development'
  };

  res.json(healthStatus);
});

/**
 * GET /api/health/ready
 * Readiness check endpoint
 */
router.get('/ready', (req, res) => {
  // Add more sophisticated readiness checks here
  // e.g., database connections, external service availability
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/health/live
 * Liveness check endpoint
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;