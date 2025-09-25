const { Compute } = require('@google-cloud/compute');
const logger = require('../middleware/logger');

class GCPService {
  constructor() {
    this.computeClients = new Map();
  }

  /**
   * Get or create a Compute Engine client for a specific project
   */
  getComputeClient(projectId) {
    if (!this.computeClients.has(projectId)) {
      const compute = new Compute({ projectId });
      this.computeClients.set(projectId, compute);
    }
    return this.computeClients.get(projectId);
  }

  /**
   * List all VM instances in a project, optionally filtered by zone
   */
  async listInstances(projectId, zone = null) {
    try {
      const compute = this.getComputeClient(projectId);
      
      let instances;
      if (zone) {
        const [vms] = await compute.zone(zone).getVMs();
        instances = vms;
      } else {
        const [vms] = await compute.getVMs();
        instances = vms;
      }

      // Process instances to extract relevant information
      const processedInstances = await Promise.all(
        instances.map(async (instance) => {
          const metadata = await this.getInstanceMetadata(instance);
          const licenseInfo = this.detectLicenseType(metadata);
          
          return {
            id: instance.id,
            name: instance.name,
            zone: instance.zone?.name || instance.zone?.id,
            machineType: this.extractMachineType(metadata.machineType),
            status: metadata.status,
            licenseInfo,
            creationTimestamp: metadata.creationTimestamp,
            disks: metadata.disks?.map(disk => ({
              deviceName: disk.deviceName,
              source: disk.source,
              licenses: disk.licenses || []
            })) || [],
            networkInterfaces: metadata.networkInterfaces?.map(ni => ({
              name: ni.name,
              network: ni.network,
              subnetwork: ni.subnetwork
            })) || []
          };
        })
      );

      return processedInstances;
    } catch (error) {
      logger.error(`Error listing instances for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed metadata for a VM instance
   */
  async getInstanceMetadata(instance) {
    try {
      const [metadata] = await instance.getMetadata();
      return metadata;
    } catch (error) {
      logger.error(`Error getting metadata for instance ${instance.name}:`, error);
      throw error;
    }
  }

  /**
   * Detect RHEL license type based on instance metadata
   */
  detectLicenseType(instanceMetadata) {
    const licenses = [];
    
    // Check disk licenses
    if (instanceMetadata.disks) {
      instanceMetadata.disks.forEach(disk => {
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
      const compute = this.getComputeClient(projectId);
      const vm = compute.zone(zone).vm(instanceName);

      // Stop instance if running
      const [metadata] = await vm.getMetadata();
      const wasRunning = metadata.status === 'RUNNING';
      
      if (wasRunning) {
        logger.info(`Stopping instance ${instanceName} for license update...`);
        await vm.stop();
        await this.waitForInstanceStatus(vm, 'TERMINATED');
      }

      // Update boot disk licenses
      const [disks] = await vm.getDisks();
      const bootDisk = disks[0]; // First disk is typically the boot disk

      if (bootDisk) {
        await bootDisk.setMetadata({
          licenses: licenseConfig.licenses
        });
      }

      // Restart instance if it was running
      if (wasRunning) {
        logger.info(`Restarting instance ${instanceName} after license update...`);
        await vm.start();
        await this.waitForInstanceStatus(vm, 'RUNNING');
      }

      logger.info(`License updated successfully for instance ${instanceName}`);
      return true;

    } catch (error) {
      logger.error(`Error updating license for instance ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Wait for instance to reach specified status
   */
  async waitForInstanceStatus(vm, targetStatus, timeout = 300000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const [metadata] = await vm.getMetadata();
        if (metadata.status === targetStatus) {
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      } catch (error) {
        logger.error('Error checking instance status:', error);
        throw error;
      }
    }
    
    throw new Error(`Timeout waiting for instance to reach status ${targetStatus}`);
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
      const compute = this.getComputeClient(projectId);
      const [zones] = await compute.getZones();
      
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