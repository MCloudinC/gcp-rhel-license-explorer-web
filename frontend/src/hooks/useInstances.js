import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

/**
 * Custom hook for managing GCP instances
 */
export const useInstances = (projectId) => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [cached, setCached] = useState(false);

  const fetchInstances = useCallback(async (zone = null, forceRefresh = false) => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (zone) params.zone = zone;
      if (forceRefresh) params.refresh = true;

      const response = await api.get(`/projects/${projectId}/instances`, { params });
      
      setInstances(response.data.instances || []);
      setLastUpdated(response.data.metadata?.lastUpdated);
      setCached(response.data.metadata?.cached || false);

    } catch (err) {
      console.error('Failed to fetch instances:', err);
      setError(err.response?.data?.error || 'Failed to fetch instances');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const refreshInstances = useCallback((zone = null) => {
    return fetchInstances(zone, true);
  }, [fetchInstances]);

  const updateInstanceLicense = useCallback(async (instanceName, zone, licenseType, rhelVersion) => {
    try {
      const response = await api.post(
        `/projects/${projectId}/instances/${instanceName}/license`,
        { licenseType, rhelVersion },
        { params: { zone } }
      );
      
      // Refresh instances after successful update
      await refreshInstances(zone);
      
      return response.data;
    } catch (err) {
      console.error('Failed to update license:', err);
      throw new Error(err.response?.data?.error || 'Failed to update license');
    }
  }, [projectId, refreshInstances]);

  const clearCache = useCallback(async () => {
    try {
      await api.delete(`/projects/${projectId}/instances/cache`);
      await fetchInstances();
    } catch (err) {
      console.error('Failed to clear cache:', err);
      throw new Error(err.response?.data?.error || 'Failed to clear cache');
    }
  }, [projectId, fetchInstances]);

  const getCacheStats = useCallback(async () => {
    try {
      const response = await api.get(`/projects/${projectId}/instances/cache/stats`);
      return response.data.cache;
    } catch (err) {
      console.error('Failed to get cache stats:', err);
      return null;
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      fetchInstances();
    }
  }, [projectId, fetchInstances]);

  return {
    instances,
    loading,
    error,
    lastUpdated,
    cached,
    fetchInstances,
    refreshInstances,
    updateInstanceLicense,
    clearCache,
    getCacheStats
  };
};