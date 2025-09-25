import React from 'react';
import { CloudIcon } from '@heroicons/react/24/outline';

const Header = () => {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <CloudIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                GCP RHEL License Explorer
              </h1>
              <p className="text-sm text-gray-500">
                Manage RHEL licenses across your GCP instances
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Web Tool v1.0.0
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;