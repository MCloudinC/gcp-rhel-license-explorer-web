const fs = require('fs').promises;
const path = require('path');
const logger = require('../middleware/logger');

class StateManager {
  constructor(projectId) {
    this.projectId = projectId;
    this.stateDir = path.join(__dirname, '../../data/state');
    this.stateFile = path.join(this.stateDir, `${projectId}.json`);
    this.cacheTTL = parseInt(process.env.CACHE_TTL) || 300000; // 5 minutes default
  }

  /**
   * Ensure state directory exists
   */
  async ensureStateDir() {
    try {
      await fs.mkdir(this.stateDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        logger.error('Error creating state directory:', error);
        throw error;
      }
    }
  }

  /**
   * Load state from file
   */
  async loadState() {
    try {
      const data = await fs.readFile(this.stateFile, 'utf-8');
      const state = JSON.parse(data);
      
      logger.info(`Loaded state for project ${this.projectId} from cache`);
      return state;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info(`No cached state found for project ${this.projectId}`);
        return null;
      }
      logger.error(`Error loading state for project ${this.projectId}:`, error);
      throw error;
    }
  }

  /**
   * Save state to file
   */
  async saveState(data) {
    try {
      await this.ensureStateDir();
      
      const state = {
        projectId: this.projectId,
        lastUpdated: new Date().toISOString(),
        data: data,
        metadata: {
          version: '1.0.0',
          instanceCount: Array.isArray(data) ? data.length : 0
        }
      };

      await fs.writeFile(this.stateFile, JSON.stringify(state, null, 2));
      logger.info(`Saved state for project ${this.projectId} to cache`);
      return state;
    } catch (error) {
      logger.error(`Error saving state for project ${this.projectId}:`, error);
      throw error;
    }
  }

  /**
   * Check if cached state has expired
   */
  isExpired(state) {
    if (!state || !state.lastUpdated) {
      return true;
    }

    const lastUpdated = new Date(state.lastUpdated);
    const now = new Date();
    const age = now.getTime() - lastUpdated.getTime();

    return age > this.cacheTTL;
  }

  /**
   * Get fresh data from GCP and update cache
   */
  async syncWithGCP(gcpService, zone = null) {
    try {
      logger.info(`Syncing data with GCP for project ${this.projectId}`);
      
      const freshData = await gcpService.listInstances(this.projectId, zone);
      await this.saveState(freshData);
      
      logger.info(`Successfully synced ${freshData.length} instances for project ${this.projectId}`);
      return freshData;
    } catch (error) {
      logger.error(`Error syncing with GCP for project ${this.projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get cached data or fetch fresh if expired
   */
  async getData(gcpService, zone = null, forceRefresh = false) {
    try {
      if (!forceRefresh) {
        const cachedState = await this.loadState();
        
        if (cachedState && !this.isExpired(cachedState)) {
          logger.info(`Using cached data for project ${this.projectId}`);
          return {
            data: cachedState.data,
            cached: true,
            lastUpdated: cachedState.lastUpdated
          };
        }
      }

      // Cache expired or force refresh requested
      const freshData = await this.syncWithGCP(gcpService, zone);
      return {
        data: freshData,
        cached: false,
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Error getting data for project ${this.projectId}:`, error);
      
      // Try to return cached data as fallback
      const cachedState = await this.loadState();
      if (cachedState) {
        logger.warn(`Returning stale cached data for project ${this.projectId}`);
        return {
          data: cachedState.data,
          cached: true,
          stale: true,
          lastUpdated: cachedState.lastUpdated,
          error: error.message
        };
      }
      
      throw error;
    }
  }

  /**
   * Clear cached state for project
   */
  async clearCache() {
    try {
      await fs.unlink(this.stateFile);
      logger.info(`Cleared cache for project ${this.projectId}`);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info(`No cache to clear for project ${this.projectId}`);
        return true;
      }
      logger.error(`Error clearing cache for project ${this.projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get cache stats
   */
  async getCacheStats() {
    try {
      const cachedState = await this.loadState();
      if (!cachedState) {
        return { exists: false };
      }

      const stats = await fs.stat(this.stateFile);
      const age = Date.now() - new Date(cachedState.lastUpdated).getTime();
      
      return {
        exists: true,
        lastUpdated: cachedState.lastUpdated,
        age: age,
        expired: this.isExpired(cachedState),
        size: stats.size,
        instanceCount: cachedState.metadata?.instanceCount || 0
      };
    } catch (error) {
      logger.error(`Error getting cache stats for project ${this.projectId}:`, error);
      return { exists: false, error: error.message };
    }
  }
}

module.exports = StateManager;