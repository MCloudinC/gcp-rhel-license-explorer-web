import React, { useState } from 'react';
import { 
  ComputerDesktopIcon, 
  CogIcon, 
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LicenseUpdateModal from '../LicenseUpdateModal/LicenseUpdateModal';

const InstanceCard = ({ instance, projectId, onLicenseUpdate }) => {
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'RUNNING':
        return 'text-green-800 bg-green-100';
      case 'STOPPED':
      case 'TERMINATED':
        return 'text-red-800 bg-red-100';
      case 'PENDING':
      case 'STAGING':
        return 'text-yellow-800 bg-yellow-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const getLicenseBadgeColor = (type) => {
    switch (type) {
      case 'PAYG':
        return 'text-green-800 bg-green-100';
      case 'BYOS':
        return 'text-blue-800 bg-blue-100';
      case 'Marketplace':
        return 'text-purple-800 bg-purple-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const primaryLicenseType = instance.licenseInfo?.types?.[0] || 'Unknown';
  const isRHEL = instance.licenseInfo?.isRHEL;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <ComputerDesktopIcon className="h-6 w-6 text-gray-400 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                {instance.name}
              </h4>
              <p className="text-xs text-gray-500">
                {instance.zone} • {instance.machineType}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(instance.status)}`}>
              {instance.status}
            </span>
            
            {isRHEL && (
              <button
                onClick={() => setShowLicenseModal(true)}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Manage License"
              >
                <CogIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">License Type:</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getLicenseBadgeColor(primaryLicenseType)}`}>
              {primaryLicenseType}
            </span>
          </div>

          {instance.licenseInfo?.isRHEL && (
            <div className="flex items-center text-xs text-gray-500">
              <ExclamationTriangleIcon className="h-3 w-3 mr-1 text-red-400" />
              RHEL License Detected
            </div>
          )}

          <div className="flex items-center text-xs text-gray-500">
            <ClockIcon className="h-3 w-3 mr-1" />
            Created: {new Date(instance.creationTimestamp).toLocaleDateString()}
          </div>
        </div>

        {instance.licenseInfo?.licenses && instance.licenseInfo.licenses.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                License Details ({instance.licenseInfo.licenses.length})
              </summary>
              <div className="mt-2 space-y-1">
                {instance.licenseInfo.licenses.map((license, index) => (
                  <div key={index} className="text-gray-600 break-all">
                    {license.split('/').pop()}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      {showLicenseModal && (
        <LicenseUpdateModal
          instance={instance}
          projectId={projectId}
          onClose={() => setShowLicenseModal(false)}
          onUpdate={onLicenseUpdate}
        />
      )}
    </>
  );
};

export default InstanceCard;