
import React, { useState, useEffect } from 'react';
import type { PONumberConfig } from '../types';
import { InfoIcon } from './Icons';

interface PONumberSettingsScreenProps {
  config: PONumberConfig;
  onUpdateConfig: (newConfig: PONumberConfig) => void;
}

const PONumberSettingsScreen: React.FC<PONumberSettingsScreenProps> = ({ config, onUpdateConfig }) => {
  const [prefix, setPrefix] = useState(config.prefix);
  const [nextNumber, setNextNumber] = useState(config.nextNumber);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setPrefix(config.prefix);
    setNextNumber(config.nextNumber);
  }, [config]);

  const handleSave = () => {
    onUpdateConfig({ prefix, nextNumber: Number(nextNumber) });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000); // Hide message after 2 seconds
  };
  
  const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";

  return (
    <div className="bg-white rounded-lg shadow-sm max-w-2xl">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800">Purchase Order Numbering</h1>
      </div>
      <div className="p-8 space-y-6">
        <div>
          <label className="flex items-center">
            <input
              type="radio"
              name="numbering-type"
              value="auto"
              checked={true}
              readOnly
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-800">
              Continue auto-generating purchase order numbers
            </span>
            <InfoIcon className="w-4 h-4 text-gray-400 ml-1" />
          </label>
        </div>

        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label htmlFor="prefix" className="block text-sm font-medium text-gray-700 mb-1">
              Prefix
            </label>
            <input
              type="text"
              id="prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className={commonInputClasses}
              maxLength={20}
            />
          </div>
          <div className="w-32">
            <label htmlFor="nextNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Next Number
            </label>
            <input
              type="number"
              id="nextNumber"
              value={nextNumber}
              onChange={(e) => setNextNumber(Number(e.target.value))}
              className={commonInputClasses}
            />
          </div>
        </div>
      </div>
       <div className="flex items-center justify-start space-x-3 p-5 bg-gray-50 border-t border-gray-200">
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save
          </button>
          {isSaved && <span className="text-sm text-green-600">Settings saved successfully!</span>}
      </div>
    </div>
  );
};

export default PONumberSettingsScreen;
