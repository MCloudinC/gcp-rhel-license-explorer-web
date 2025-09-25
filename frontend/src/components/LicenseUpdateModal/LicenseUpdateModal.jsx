import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useInstances } from '../../hooks/useInstances';

const LicenseUpdateModal = ({ instance, projectId, onClose, onUpdate }) => {
  const [licenseType, setLicenseType] = useState('PAYG');
  const [rhelVersion, setRhelVersion] = useState('rhel-8');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const { updateInstanceLicense } = useInstances(projectId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');

    try {
      await updateInstanceLicense(
        instance.name, 
        instance.zone, 
        licenseType, 
        rhelVersion
      );
      
      onUpdate();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Update RHEL License
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Warning</p>
              <p>The instance will be stopped and restarted during the license update process.</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Instance:</strong> {instance.name}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <strong>Zone:</strong> {instance.zone}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Current License:</strong> {instance.licenseInfo?.types?.join(', ') || 'Unknown'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="license-type" className="block text-sm font-medium text-gray-700">
              License Type
            </label>
            <select
              id="license-type"
              value={licenseType}
              onChange={(e) => setLicenseType(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="PAYG">PAYG (Pay-As-You-Go)</option>
              <option value="BYOS">BYOS (Bring Your Own Subscription)</option>
            </select>
          </div>

          <div>
            <label htmlFor="rhel-version" className="block text-sm font-medium text-gray-700">
              RHEL Version
            </label>
            <select
              id="rhel-version"
              value={rhelVersion}
              onChange={(e) => setRhelVersion(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="rhel-7">RHEL 7</option>
              <option value="rhel-8">RHEL 8</option>
              <option value="rhel-9">RHEL 9</option>
            </select>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Update License'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LicenseUpdateModal;