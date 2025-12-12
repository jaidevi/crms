
import React, { useState, useEffect } from 'react';
import type { InvoiceNumberConfig } from '../types';
import { InfoIcon } from './Icons';

interface InvoiceNumberSettingsScreenProps {
  gstConfig: InvoiceNumberConfig;
  ngstConfig: InvoiceNumberConfig;
  onUpdateConfig: (type: 'GST' | 'NGST', newConfig: InvoiceNumberConfig) => void;
}

const InvoiceNumberSettingsScreen: React.FC<InvoiceNumberSettingsScreenProps> = ({ gstConfig, ngstConfig, onUpdateConfig }) => {
  const [activeTab, setActiveTab] = useState<'GST' | 'NGST'>('GST');
  const [isSaved, setIsSaved] = useState(false);

  // Local state for GST settings
  const [gstMode, setGstMode] = useState(gstConfig.mode);
  const [gstPrefix, setGstPrefix] = useState(gstConfig.prefix);
  const [gstNextNumber, setGstNextNumber] = useState(gstConfig.nextNumber);

  // Local state for NGST settings
  const [ngstMode, setNgstMode] = useState(ngstConfig.mode);
  const [ngstPrefix, setNgstPrefix] = useState(ngstConfig.prefix);
  const [ngstNextNumber, setNgstNextNumber] = useState(ngstConfig.nextNumber);

  // Sync props to state if they change externally
  useEffect(() => {
    setGstMode(gstConfig.mode);
    setGstPrefix(gstConfig.prefix);
    setGstNextNumber(gstConfig.nextNumber);
  }, [gstConfig]);

  useEffect(() => {
    setNgstMode(ngstConfig.mode);
    setNgstPrefix(ngstConfig.prefix);
    setNgstNextNumber(ngstConfig.nextNumber);
  }, [ngstConfig]);

  const handleSave = () => {
    if (activeTab === 'GST') {
      onUpdateConfig('GST', { mode: gstMode, prefix: gstPrefix, nextNumber: Number(gstNextNumber) });
    } else {
      onUpdateConfig('NGST', { mode: ngstMode, prefix: ngstPrefix, nextNumber: Number(ngstNextNumber) });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };
  
  const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";

  // Determine current values based on active tab
  const currentMode = activeTab === 'GST' ? gstMode : ngstMode;
  const setMode = activeTab === 'GST' ? setGstMode : setNgstMode;
  const currentPrefix = activeTab === 'GST' ? gstPrefix : ngstPrefix;
  const setPrefix = activeTab === 'GST' ? setGstPrefix : setNgstPrefix;
  const currentNextNumber = activeTab === 'GST' ? gstNextNumber : ngstNextNumber;
  const setNextNumber = activeTab === 'GST' ? setGstNextNumber : setNgstNextNumber;

  return (
    <div className="bg-white rounded-lg shadow-sm max-w-2xl">
      <div className="p-5 border-b border-gray-200 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">Invoice Numbering</h1>
        <div className="flex bg-gray-100 rounded-lg p-1">
            <button 
                onClick={() => setActiveTab('GST')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${activeTab === 'GST' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                GST
            </button>
            <button 
                onClick={() => setActiveTab('NGST')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${activeTab === 'NGST' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                NGST
            </button>
        </div>
      </div>
      <div className="p-8 space-y-6">
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="radio"
              name={`invoice-numbering-type-${activeTab}`}
              value="auto"
              checked={currentMode === 'auto'}
              onChange={() => setMode('auto')}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-3 text-sm font-medium text-gray-800">
              Auto-generate {activeTab} invoice numbers
            </span>
            <InfoIcon className="w-4 h-4 text-gray-400 ml-1" />
          </label>
          {currentMode === 'auto' && (
            <div className="flex items-end space-x-4 pl-7 animate-fade-in-down">
              <div className="flex-1">
                <label htmlFor={`inv-prefix-${activeTab}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Prefix
                </label>
                <input
                  type="text"
                  id={`inv-prefix-${activeTab}`}
                  value={currentPrefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  className={commonInputClasses}
                  maxLength={20}
                  placeholder={activeTab === 'GST' ? 'INV' : 'NGST'}
                />
              </div>
              <div className="w-32">
                <label htmlFor={`inv-nextNumber-${activeTab}`} className="block text-sm font-medium text-gray-700 mb-1">
                  Next Number
                </label>
                <input
                  type="number"
                  id={`inv-nextNumber-${activeTab}`}
                  value={currentNextNumber}
                  onChange={(e) => setNextNumber(Number(e.target.value))}
                  className={commonInputClasses}
                />
              </div>
            </div>
          )}
          <label className="flex items-center">
            <input
              type="radio"
              name={`invoice-numbering-type-${activeTab}`}
              value="manual"
              checked={currentMode === 'manual'}
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
            Save {activeTab} Settings
          </button>
          {isSaved && <span className="text-sm text-green-600 animate-fade-in-down">Settings saved successfully!</span>}
      </div>
    </div>
  );
};

export default InvoiceNumberSettingsScreen;