const { InstancesClient, ZonesClient, MachineTypesClient } = require('@google-cloud/compute');
const logger = require('../middleware/logger');

class GCPService {
  constructor() {
    this.instancesClients = new Map();
    this.zonesClients = new Map();
    this.machineTypesClients = new Map();
  }

  /**
   * Get or create an Instances client for a specific project
   */
  getInstancesClient(projectId) {
    if (!this.instancesClients.has(projectId)) {
      const client = new InstancesClient();
      this.instancesClients.set(projectId, client);
    }
    return this.instancesClients.get(projectId);
  }

  /**
   * Get or create a Zones client for a specific project
   */
  getZonesClient(projectId) {
    if (!this.zonesClients.has(projectId)) {
      const client = new ZonesClient();
      this.zonesClients.set(projectId, client);
    }
    return this.zonesClients.get(projectId);
  }

  /**
   * List all VM instances in a project, optionally filtered by zone
   */
  async listInstances(projectId, zone = null) {
    try {
      const instancesClient = this.getInstancesClient(projectId);
      
      let instances = [];
      
      if (zone) {
        // List instances in specific zone
        const request = {
          project: projectId,
          zone: zone,
        };
        const [response] = await instancesClient.list(request);
        instances = response || [];
      } else {
        // List instances across all zones - we need to get zones first, then iterate
        const zonesClient = this.getZonesClient(projectId);
        const [zones] = await zonesClient.list({ project: projectId });
        
        // Get instances from each zone
        for (const zone of zones) {
          try {
            const zoneRequest = {
              project: projectId,
              zone: zone.name,
            };
            const [zoneInstances] = await instancesClient.list(zoneRequest);
            if (zoneInstances && zoneInstances.length > 0) {
              instances.push(...zoneInstances);
            }
          } catch (error) {
            // Skip zones with no instances or access issues
            logger.warn(`Could not list instances in zone ${zone.name}:`, error.message);
          }
        }
      }

      // Process instances to extract relevant information
      const processedInstances = instances.map((instance) => {
        const licenseInfo = this.detectLicenseType(instance);
        
        return {
          id: instance.id,
          name: instance.name,
          zone: this.extractZoneFromUrl(instance.zone),
          machineType: this.extractMachineType(instance.machineType),
          status: instance.status,
          licenseInfo,
          creationTimestamp: instance.creationTimestamp,
          disks: instance.disks?.map(disk => ({
            deviceName: disk.deviceName,
            source: disk.source,
            licenses: disk.licenses || []
          })) || [],
          networkInterfaces: instance.networkInterfaces?.map(ni => ({
            name: ni.name,
            network: ni.network,
            subnetwork: ni.subnetwork
          })) || []
        };
      });

      return processedInstances;
    } catch (error) {
      logger.error(`Error listing instances for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Extract zone name from zone URL
   */
  extractZoneFromUrl(zoneUrl) {
    if (!zoneUrl) return 'unknown';
    const parts = zoneUrl.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Detect RHEL license type based on instance data
   */
  detectLicenseType(instance) {
    const licenses = [];
    
    // Check disk licenses
    if (instance.disks) {
      instance.disks.forEach(disk => {
        if (disk.licenses) {
          licenses.push(...disk.licenses);
        }
      });
    }

    const licenseTypes = licenses.map(license => {
      const licenseUrl = license.toLowerCase();
      if (licenseUrl.includes('rhel-byos')) return 'BYOS';
      if (licenseUrl.includes('rhel-payg') || licenseUrl.includes('rhel-sap-payg')) return 'PAYG';
      if (licenseUrl.includes('marketplace')) return 'Marketplace';
      if (licenseUrl.includes('rhel')) return 'RHEL';
      return 'Custom';
    });

    return {
      licenses,
      types: [...new Set(licenseTypes)],
      isPAYG: licenseTypes.some(t => t === 'PAYG'),
      isBYOS: licenseTypes.some(t => t === 'BYOS'),
      isMarketplace: licenseTypes.some(t => t === 'Marketplace'),
      isRHEL: licenseTypes.some(t => t === 'RHEL' || t === 'PAYG' || t === 'BYOS')
    };
  }

  /**
   * Update instance license configuration
   */
  async updateInstanceLicense(projectId, zone, instanceName, licenseConfig) {
    try {
      // This is a complex operation that requires stopping the instance,
      // updating disk licenses, and restarting. For now, we'll return a placeholder
      // indicating the feature is not yet implemented with the new API
      logger.info(`License update requested for instance ${instanceName} (feature in development)`);
      
      throw new Error('License update feature is currently being updated for the new GCP API. Please check back later.');

    } catch (error) {
      logger.error(`Error updating license for instance ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Extract machine type from full machine type URL
   */
  extractMachineType(machineTypeUrl) {
    if (!machineTypeUrl) return 'unknown';
    const parts = machineTypeUrl.split('/');
    return parts[parts.length - 1];
  }

  /**
   * List available zones for a project
   */
  async listZones(projectId) {
    try {
      const zonesClient = this.getZonesClient(projectId);
      const request = {
        project: projectId,
      };
      const [zones] = await zonesClient.list(request);
      
      return zones.map(zone => ({
        name: zone.name,
        region: zone.region?.split('/').pop(),
        status: zone.status,
        description: zone.description
      }));
    } catch (error) {
      logger.error(`Error listing zones for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get license URLs for RHEL conversion
   */
  getLicenseUrls() {
    return {
      PAYG: {
        'rhel-7': 'projects/rhel-cloud/global/licenses/rhel-7-server-payg',
        'rhel-8': 'projects/rhel-cloud/global/licenses/rhel-8-server-payg',
        'rhel-9': 'projects/rhel-cloud/global/licenses/rhel-9-server-payg'
      },
      BYOS: {
        'rhel-7': 'projects/rhel-cloud/global/licenses/rhel-7-server-byos',
        'rhel-8': 'projects/rhel-cloud/global/licenses/rhel-8-server-byos',
        'rhel-9': 'projects/rhel-cloud/global/licenses/rhel-9-server-byos'
      }
    };
  }
}

module.exports = new GCPService();