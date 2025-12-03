
import React, { useState, useEffect } from 'react';
import type { InvoiceNumberConfig } from '../types';
import { InfoIcon } from './Icons';

interface InvoiceNumberSettingsScreenProps {
  config: InvoiceNumberConfig;
  onUpdateConfig: (newConfig: InvoiceNumberConfig) => void;
}

const InvoiceNumberSettingsScreen: React.FC<InvoiceNumberSettingsScreenProps> = ({ config, onUpdateConfig }) => {
  const [mode, setMode] = useState(config.mode);
  const [prefix, setPrefix] = useState(config.prefix);
  const [nextNumber, setNextNumber] = useState(config.nextNumber);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setMode(config.mode);
    setPrefix(config.prefix);
    setNextNumber(config.nextNumber);
  }, [config]);

  const handleSave = () => {
    onUpdateConfig({ mode, prefix, nextNumber: Number(nextNumber) });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };
  
  const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";

  return (
    <div className="bg-white rounded-lg shadow-sm max-w-2xl">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800">Invoice Numbering</h1>
      </div>
      <div className="p-8 space-y-6">
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="invoice-numbering-type"
              value="auto"
              checked={mode === 'auto'}
              onChange={() => setMode('auto')}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-800">
              Continue auto-generating invoice numbers
            </span>
            <InfoIcon className="w-4 h-4 text-gray-400 ml-1" />
          </label>
          {mode === 'auto' && (
            <div className="flex items-end space-x-4 pl-7">
              <div className="flex-1">
                <label htmlFor="inv-prefix" className="block text-sm font-medium text-gray-700 mb-1">
                  Prefix
                </label>
                <input
                  type="text"
                  id="inv-prefix"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className={commonInputClasses}
                  maxLength={20}
                />
              </div>
              <div className="w-32">
                <label htmlFor="inv-nextNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Next Number
                </label>
                <input
                  type="number"
                  id="inv-nextNumber"
                  value={nextNumber}
                  onChange={(e) => setNextNumber(Number(e.target.value))}
                  className={commonInputClasses}
                />
              </div>
            </div>
          )}
          <label className="flex items-center">
            <input
              type="radio"
              name="invoice-numbering-type"
              value="manual"
              checked={mode === 'manual'}
              onChange={() => setMode('manual')}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-800">
              I will enter them manually
            </span>
          </label>
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

export default InvoiceNumberSettingsScreen;
