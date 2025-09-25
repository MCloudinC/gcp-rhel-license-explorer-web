import React, { useEffect, useState } from 'react';
import { 
  ComputerDesktopIcon, 
  ArrowPathIcon, 
  ClockIcon,
  ServerIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useInstances } from '../../hooks/useInstances';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import InstanceCard from '../InstanceCard/InstanceCard';

const Dashboard = ({ projectId, socket, onProjectChange }) => {
  const { 
    instances, 
    loading, 
    error, 
    lastUpdated, 
    cached, 
    refreshInstances,
    getCacheStats 
  } = useInstances(projectId);
  
  const [cacheStats, setCacheStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (socket?.socket && projectId) {
      // Join project room
      socket.socket.emit('join-project', projectId);

      // Listen for instance updates
      socket.socket.on('instances-updated', (data) => {
        if (data.projectId === projectId) {
          console.log('Received instance updates via WebSocket');
          refreshInstances();
        }
      });

      // Listen for license update progress
      socket.socket.on('license-update-progress', (data) => {
        console.log('License update progress:', data);
        // Handle license update notifications
      });

      return () => {
        socket.socket.emit('leave-project', projectId);
        socket.socket.off('instances-updated');
        socket.socket.off('license-update-progress');
      };
    }
  }, [socket, projectId, refreshInstances]);

  useEffect(() => {
    const loadCacheStats = async () => {
      const stats = await getCacheStats();
      setCacheStats(stats);
    };
    loadCacheStats();
  }, [getCacheStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshInstances();
      
      // Notify other clients via WebSocket
      if (socket?.socket) {
        socket.socket.emit('refresh-instances', { projectId });
      }
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleProjectChange = () => {
    onProjectChange('');
  };

  // Calculate statistics
  const stats = {
    total: instances.length,
    running: instances.filter(i => i.status === 'RUNNING').length,
    rhel: instances.filter(i => i.licenseInfo?.isRHEL).length,
    payg: instances.filter(i => i.licenseInfo?.isPAYG).length,
    byos: instances.filter(i => i.licenseInfo?.isBYOS).length
  };

  if (loading && instances.length === 0) {
    return <LoadingSpinner message="Loading project data..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={handleProjectChange}
          className="text-blue-600 hover:text-blue-500"
        >
          Select Different Project
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              Project: {projectId}
            </h2>
            <p className="text-sm text-gray-500">
              {lastUpdated && (
                <>Last updated: {new Date(lastUpdated).toLocaleString()}</>
              )}
              {cached && <span className="ml-2 text-blue-600">(cached)</span>}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            
            <button
              onClick={handleProjectChange}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Change Project
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ServerIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Instances
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ComputerDesktopIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Running
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.running}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    RHEL Instances
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.rhel}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-green-400 rounded"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    PAYG Licenses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.payg}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 bg-blue-400 rounded"></div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    BYOS Licenses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.byos}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Status */}
      {cacheStats && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-blue-400 mr-2" />
            <div className="text-sm text-blue-800">
              Cache Status: {cacheStats.exists ? 'Active' : 'Empty'} 
              {cacheStats.exists && (
                <span className="ml-2">
                  | Age: {Math.round(cacheStats.age / 1000)}s 
                  | {cacheStats.expired ? 'Expired' : 'Fresh'}
                  | {cacheStats.instanceCount} instances
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Instances */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Instances
          </h3>
        </div>
        
        <div className="p-6">
          {instances.length === 0 ? (
            <div className="text-center py-8">
              <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No instances found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No VM instances were found in this project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {instances.slice(0, 6).map((instance) => (
                <InstanceCard
                  key={`${instance.zone}-${instance.name}`}
                  instance={instance}
                  projectId={projectId}
                  onLicenseUpdate={() => refreshInstances()}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;