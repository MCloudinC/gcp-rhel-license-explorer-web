const express = require('express');
const router = express.Router({ mergeParams: true });
const Joi = require('joi');

const gcpService = require('../services/gcpService');
const StateManager = require('../services/stateManager');
const logger = require('../middleware/logger');

// Validation schemas
const listInstancesSchema = Joi.object({
  zone: Joi.string().optional(),
  refresh: Joi.boolean().optional()
});

const updateLicenseSchema = Joi.object({
  licenseType: Joi.string().valid('PAYG', 'BYOS').required(),
  rhelVersion: Joi.string().valid('rhel-7', 'rhel-8', 'rhel-9').required()
});

/**
 * GET /api/projects/:projectId/instances
 * List all instances in a project
 */
router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { error, value } = listInstancesSchema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.details.map(d => d.message)
      });
    }

    const { zone, refresh } = value;
    const stateManager = new StateManager(projectId);
    
    // Get data (cached or fresh)
    const result = await stateManager.getData(gcpService, zone, refresh);
    
    res.json({
      instances: result.data,
      metadata: {
        projectId,
        zone: zone || 'all',
        cached: result.cached,
        stale: result.stale || false,
        lastUpdated: result.lastUpdated,
        count: result.data.length
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:projectId/instances/:instanceName
 * Get details for a specific instance
 */
router.get('/:instanceName', async (req, res, next) => {
  try {
    const { projectId, instanceName } = req.params;
    const { zone } = req.query;

    if (!zone) {
      return res.status(400).json({
        error: 'Zone parameter is required for instance details'
      });
    }

    const stateManager = new StateManager(projectId);
    const result = await stateManager.getData(gcpService, zone);
    
    const instance = result.data.find(inst => inst.name === instanceName);
    
    if (!instance) {
      return res.status(404).json({
        error: `Instance ${instanceName} not found in zone ${zone}`
      });
    }

    res.json({
      instance,
      metadata: {
        projectId,
        zone,
        cached: result.cached,
        lastUpdated: result.lastUpdated
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects/:projectId/instances/:instanceName/license
 * Update license for a specific instance
 */
router.post('/:instanceName/license', async (req, res, next) => {
  try {
    const { projectId, instanceName } = req.params;
    const { zone } = req.query;

    if (!zone) {
      return res.status(400).json({
        error: 'Zone parameter is required for license updates'
      });
    }

    const { error, value } = updateLicenseSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Invalid request body',
        details: error.details.map(d => d.message)
      });
    }

    const { licenseType, rhelVersion } = value;
    
    // Get appropriate license URL
    const licenseUrls = gcpService.getLicenseUrls();
    const licenseUrl = licenseUrls[licenseType][rhelVersion];
    
    if (!licenseUrl) {
      return res.status(400).json({
        error: `No license URL found for ${licenseType} ${rhelVersion}`
      });
    }

    logger.info(`Updating license for ${instanceName} to ${licenseType} ${rhelVersion}`);

    // Update instance license
    await gcpService.updateInstanceLicense(projectId, zone, instanceName, {
      licenses: [licenseUrl]
    });

    // Clear cache to force refresh on next request
    const stateManager = new StateManager(projectId);
    await stateManager.clearCache();

    res.json({
      success: true,
      message: `License updated successfully for instance ${instanceName}`,
      licenseType,
      rhelVersion,
      licenseUrl
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:projectId/instances/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const stateManager = new StateManager(projectId);
    
    const stats = await stateManager.getCacheStats();
    
    res.json({
      projectId,
      cache: stats
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/projects/:projectId/instances/cache
 * Clear cache for project
 */
router.delete('/cache', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const stateManager = new StateManager(projectId);
    
    await stateManager.clearCache();
    
    res.json({
      success: true,
      message: `Cache cleared for project ${projectId}`
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/projects/:projectId/instances/refresh
 * Force refresh all instances from GCP
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { zone } = req.query;
    
    const stateManager = new StateManager(projectId);
    const freshData = await stateManager.syncWithGCP(gcpService, zone);
    
    res.json({
      success: true,
      message: 'Instances refreshed successfully',
      instances: freshData,
      metadata: {
        projectId,
        zone: zone || 'all',
        count: freshData.length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;