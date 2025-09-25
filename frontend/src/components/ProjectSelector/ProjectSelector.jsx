import React, { useState } from 'react';
import { FolderIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const ProjectSelector = ({ onProjectSelect }) => {
  const [projectId, setProjectId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!projectId.trim()) {
      setError('Please enter a project ID');
      return;
    }

    // Basic validation for GCP project ID format
    const projectIdRegex = /^[a-z][-a-z0-9]*[a-z0-9]$/;
    if (!projectIdRegex.test(projectId)) {
      setError('Invalid project ID format. Use lowercase letters, numbers, and hyphens.');
      return;
    }

    setError('');
    onProjectSelect(projectId.trim());
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center mb-6">
          <FolderIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">
            Select GCP Project
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter your Google Cloud Platform project ID to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="project-id" className="block text-sm font-medium text-gray-700">
              Project ID
            </label>
            <input
              type="text"
              id="project-id"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="my-project-id"
              required
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Connect to Project
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 text-xs text-gray-500">
          <p className="font-medium">Requirements:</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Valid GCP project ID</li>
            <li>Compute Engine API enabled</li>
            <li>Service account credentials configured</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProjectSelector;