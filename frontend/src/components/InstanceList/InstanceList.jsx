import React, { useEffect, useState } from 'react';
import { useInstances } from '../../hooks/useInstances';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import InstanceCard from '../InstanceCard/InstanceCard';

const InstanceList = ({ projectId, socket }) => {
  const { 
    instances, 
    loading, 
    error, 
    refreshInstances 
  } = useInstances(projectId);

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (socket?.socket && projectId) {
      socket.socket.emit('join-project', projectId);

      socket.socket.on('instances-updated', (data) => {
        if (data.projectId === projectId) {
          refreshInstances();
        }
      });

      return () => {
        socket.socket.off('instances-updated');
      };
    }
  }, [socket, projectId, refreshInstances]);

  const filteredInstances = instances.filter(instance => {
    const matchesSearch = instance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instance.zone.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (filter) {
      case 'rhel':
        return instance.licenseInfo?.isRHEL;
      case 'payg':
        return instance.licenseInfo?.isPAYG;
      case 'byos':
        return instance.licenseInfo?.isBYOS;
      case 'running':
        return instance.status === 'RUNNING';
      case 'stopped':
        return instance.status === 'TERMINATED' || instance.status === 'STOPPED';
      default:
        return true;
    }
  });

  if (loading) {
    return <LoadingSpinner message="Loading instances..." />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => refreshInstances()}
          className="text-blue-600 hover:text-blue-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <h2 className="text-lg font-medium text-gray-900">
            All Instances ({filteredInstances.length})
          </h2>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <input
              type="text"
              placeholder="Search instances..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Instances</option>
              <option value="rhel">RHEL Only</option>
              <option value="payg">PAYG Licenses</option>
              <option value="byos">BYOS Licenses</option>
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
            </select>
          </div>
        </div>
      </div>

      {filteredInstances.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No instances found</div>
          {(filter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setFilter('all');
                setSearchTerm('');
              }}
              className="text-blue-600 hover:text-blue-500"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredInstances.map((instance) => (
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
  );
};

export default InstanceList;