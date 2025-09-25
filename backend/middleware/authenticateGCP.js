const { GoogleAuth } = require('google-auth-library');
const logger = require('./logger');

/**
 * Middleware to authenticate Google Cloud Platform requests
 * Validates credentials and sets up auth for GCP API calls
 */
const authenticateGCP = async (req, res, next) => {
  try {
    const auth = new GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/compute',
        'https://www.googleapis.com/auth/cloud-platform'
      ],
      projectId: process.env.GCP_PROJECT_ID
    });

    // Get the authenticated client
    const authClient = await auth.getClient();
    
    // Verify authentication by getting project info
    const projectId = await auth.getProjectId();
    
    if (!projectId) {
      throw new Error('Unable to determine GCP project ID');
    }

    // Attach auth objects to request for use in routes
    req.gcpAuth = auth;
    req.gcpClient = authClient;
    req.gcpProjectId = projectId;

    logger.info(`GCP authentication successful for project: ${projectId}`);
    next();

  } catch (error) {
    logger.error('GCP authentication failed:', error.message);
    
    let message = 'GCP authentication failed';
    let statusCode = 401;

    if (error.message.includes('Could not load the default credentials')) {
      message = 'GCP credentials not found. Please configure GOOGLE_APPLICATION_CREDENTIALS.';
      statusCode = 500;
    } else if (error.message.includes('permission')) {
      message = 'Insufficient permissions for GCP operations';
      statusCode = 403;
    }

    return res.status(statusCode).json({
      error: message,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = authenticateGCP;