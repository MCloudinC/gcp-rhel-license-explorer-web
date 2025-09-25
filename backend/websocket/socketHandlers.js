const { Server } = require('socket.io');
const logger = require('../middleware/logger');
const gcpService = require('../services/gcpService');
const StateManager = require('../services/stateManager');

/**
 * Setup WebSocket server with Socket.IO
 */
const setupWebSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    // Join project-specific room
    socket.on('join-project', (projectId) => {
      socket.join(`project-${projectId}`);
      logger.info(`Client ${socket.id} joined project room: ${projectId}`);
      
      socket.emit('joined-project', { 
        projectId, 
        message: `Connected to project ${projectId}` 
      });
    });

    // Leave project room
    socket.on('leave-project', (projectId) => {
      socket.leave(`project-${projectId}`);
      logger.info(`Client ${socket.id} left project room: ${projectId}`);
    });

    // Refresh instances for a project
    socket.on('refresh-instances', async (data) => {
      try {
        const { projectId, zone } = data;
        logger.info(`Refreshing instances for project ${projectId}, zone: ${zone || 'all'}`);

        const stateManager = new StateManager(projectId);
        const instances = await stateManager.syncWithGCP(gcpService, zone);

        // Emit to all clients in the project room
        io.to(`project-${projectId}`).emit('instances-updated', {
          projectId,
          zone: zone || 'all',
          instances,
          timestamp: new Date().toISOString(),
          count: instances.length
        });

        logger.info(`Broadcasted ${instances.length} instances to project ${projectId} room`);

      } catch (error) {
        logger.error('Error refreshing instances via WebSocket:', error);
        
        socket.emit('error', {
          message: 'Failed to refresh instances',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle license update notifications
    socket.on('license-update-started', (data) => {
      const { projectId, instanceName, licenseType } = data;
      
      io.to(`project-${projectId}`).emit('license-update-progress', {
        projectId,
        instanceName,
        status: 'started',
        licenseType,
        timestamp: new Date().toISOString()
      });

      logger.info(`License update started for ${instanceName} in project ${projectId}`);
    });

    socket.on('license-update-completed', (data) => {
      const { projectId, instanceName, licenseType, success } = data;
      
      io.to(`project-${projectId}`).emit('license-update-progress', {
        projectId,
        instanceName,
        status: success ? 'completed' : 'failed',
        licenseType,
        timestamp: new Date().toISOString()
      });

      logger.info(`License update ${success ? 'completed' : 'failed'} for ${instanceName} in project ${projectId}`);
    });

    // Subscribe to instance status changes
    socket.on('subscribe-instance-status', (data) => {
      const { projectId, instanceName } = data;
      const roomName = `instance-${projectId}-${instanceName}`;
      
      socket.join(roomName);
      logger.info(`Client ${socket.id} subscribed to instance status: ${instanceName}`);
    });

    // Unsubscribe from instance status changes
    socket.on('unsubscribe-instance-status', (data) => {
      const { projectId, instanceName } = data;
      const roomName = `instance-${projectId}-${instanceName}`;
      
      socket.leave(roomName);
      logger.info(`Client ${socket.id} unsubscribed from instance status: ${instanceName}`);
    });

    // Handle client disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      logger.error(`WebSocket error for client ${socket.id}:`, error);
    });
  });

  // Utility function to broadcast instance status changes
  const broadcastInstanceStatusChange = (projectId, instanceName, status) => {
    const roomName = `instance-${projectId}-${instanceName}`;
    io.to(roomName).emit('instance-status-changed', {
      projectId,
      instanceName,
      status,
      timestamp: new Date().toISOString()
    });
  };

  // Utility function to broadcast project-wide updates
  const broadcastProjectUpdate = (projectId, updateType, data) => {
    io.to(`project-${projectId}`).emit('project-update', {
      projectId,
      updateType,
      data,
      timestamp: new Date().toISOString()
    });
  };

  logger.info('WebSocket server initialized');

  return {
    io,
    broadcastInstanceStatusChange,
    broadcastProjectUpdate
  };
};

module.exports = { setupWebSocket };