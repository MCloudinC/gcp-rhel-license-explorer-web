const express = require('express');
const router = express.Router();
const gcpService = require('../services/gcpService');

/**
 * GET /api/projects/:projectId
 * Get project information
 */
router.get('/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    // For now, return basic project info
    // In the future, this could include quotas, billing info, etc.
    res.json({
      projectId,
      authenticated: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:projectId/zones
 * List available zones for the project
 */
router.get('/:projectId/zones', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    const zones = await gcpService.listZones(projectId);
    
    res.json({
      projectId,
      zones,
      count: zones.length
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:projectId/licenses
 * Get available RHEL license configurations
 */
router.get('/:projectId/licenses', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    const licenseUrls = gcpService.getLicenseUrls();
    
    res.json({
      projectId,
      licenses: licenseUrls,
      supportedTypes: ['PAYG', 'BYOS'],
      supportedVersions: ['rhel-7', 'rhel-8', 'rhel-9']
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;