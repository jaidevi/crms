
import React, { useState, useRef } from 'react';
import { QuestionMarkIcon, ImageIcon, CloseIcon } from './Icons';
import ShopMasterModal from './ShopMasterModal';
import type { Client, ProcessType } from '../App';

interface FormLabelProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  hasInfo?: boolean;
  labelColor?: string;
}

const FormLabel: React.FC<FormLabelProps> = ({ htmlFor, label, required = false, hasInfo = false, labelColor = "text-secondary-700"}) => {
  return (
    <label htmlFor={htmlFor} className={`flex items-center text-sm font-medium mb-1 ${labelColor}`}>
      <span>{label}</span>
      {required && <span className="text-danger-500 ml-0.5">*</span>}
      {hasInfo && <QuestionMarkIcon className="w-4 h-4 text-secondary-400 ml-1" />}
    </label>
  );
};

interface ProductsScreenProps {
    clients: Client[];
    onAddClient: (newClient: Omit<Client, 'id'>) => void;
    processTypes: ProcessType[];
    onAddProcessType: (process: { name: string, rate: number }) => void;
}

const ProductsScreen: React.FC<ProductsScreenProps> = ({ clients, onAddClient, processTypes, onAddProcessType }) => {
  const [itemType, setItemType] = useState('goods');
  const clientNames = clients.map(s => s.name);
  const [selectedClientName, setSelectedClientName] = useState(clientNames[0] || '');
  const [showClientMasterModal, setShowClientMasterModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      console.log('Selected files:', event.target.files);
      // File handling logic can be added here
    }
  };

  const handleSaveClient = (newClient: Client) => {
    const { id, ...newClientData } = newClient;
    onAddClient(newClientData);
    setSelectedClientName(newClient.name);
    setShowClientMasterModal(false);
  };

  const handleClientNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === '_add_new_') {
        setShowClientMasterModal(true);
    } else {
        setSelectedClientName(value);
    }
  };

  const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500";
  
  return (
    <>
      {showClientMasterModal && <ShopMasterModal onClose={() => setShowClientMasterModal(false)} onSave={handleSaveClient} existingClientNames={clientNames} processTypes={processTypes} onAddProcessType={onAddProcessType} />}
      <div className="bg-white rounded-lg shadow-sm">
          {/* Form Header */}
          <div className="flex items-center justify-between p-5 border-b border-secondary-200">
              <h1 className="text-xl font-semibold text-secondary-800">New Item</h1>
              <button className="p-1 rounded-full hover:bg-secondary-100">
                  <CloseIcon className="w-5 h-5 text-secondary-500" />
              </button>
          </div>

          {/* Form Body */}
          <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left side form fields */}
                  <div className="lg:col-span-2 space-y-6">
                      <div>
                          <FormLabel htmlFor="itemType" label="Type" hasInfo />
                          <div className="flex items-center space-x-6 mt-2">
                              <label className="flex items-center">
                                  <input 
                                      type="radio" 
                                      name="itemType" 
                                      value="goods"
                                      checked={itemType === 'goods'}
                                      onChange={(e) => setItemType(e.target.value)}
                                      className="h-4 w-4 text-primary-600 border-secondary-300 focus:ring-primary-500"
                                  />
                                  <span className="ml-2 text-sm text-secondary-700">Goods</span>
                              </label>
                              <label className="flex items-center">
                                  <input 
                                      type="radio" 
                                      name="itemType" 
                                      value="service"
                                      checked={itemType === 'service'}
                                      onChange={(e) => setItemType(e.target.value)}
                                      className="h-4 w-4 text-primary-600 border-secondary-300 focus:ring-primary-500"
                                  />
                                  <span className="ml-2 text-sm text-secondary-700">Service</span>
                              </label>
                          </div>
                      </div>

                      <div>
                          <FormLabel htmlFor="clientName" label="Client Name" />
                           <select id="clientName" value={selectedClientName} onChange={handleClientNameChange} className={commonInputClasses}>
                                {clientNames.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="_add_new_" className="text-primary-600 font-semibold">++ Add New Client ++</option>
                            </select>
                      </div>
                      
                      <div>
                          <FormLabel htmlFor="name" label="Name" required />
                          <input id="name" type="text" className={commonInputClasses} />
                      </div>

                      <div>
                          <FormLabel htmlFor="unit" label="Unit" hasInfo />
                          <select id="unit" className={commonInputClasses}>
                              <option>Select or type to add</option>
                              <option>PCS</option>
                              <option>BOX</option>
                              <option>KG</option>
                          </select>
                      </div>

                      <div>
                          <FormLabel htmlFor="selling-price" label="Selling Price" required labelColor="text-danger-500" />
                          <div className="flex rounded-md shadow-sm">
                              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-secondary-300 bg-secondary-50 text-secondary-500 sm:text-sm">
                                  INR
                              </span>
                              <input type="text" id="selling-price" className="flex-1 min-w-0 block w-full px-3 py-2.5 rounded-none rounded-r-md focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-secondary-300" />
                          </div>
                      </div>

                      <div>
                          <FormLabel htmlFor="description" label="Description" />
                          <textarea id="description" rows={3} className={commonInputClasses}></textarea>
                      </div>
                  </div>

                  {/* Right side image dropzone */}
                  <div className="lg:col-span-1 mt-8">
                      <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          accept="image/*"
                          multiple
                      />
                      <div className="flex justify-center items-center w-full h-52 border-2 border-secondary-300 border-dashed rounded-lg">
                          <div className="text-center">
                              <ImageIcon className="mx-auto h-12 w-12 text-secondary-400" />
                              <p className="mt-2 text-sm text-secondary-600">
                                  Drag image(s) here or{' '}
                                  <button 
                                      type="button" 
                                      onClick={handleBrowseClick} 
                                      className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
                                  >
                                      Browse images
                                  </button>
                              </p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
      <div className="bg-white py-4 px-8 mt-4 rounded-lg shadow-sm">
          <div className="flex justify-start space-x-3">
              <button className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Save
              </button>
              <button className="px-4 py-2 bg-secondary-200 text-secondary-800 rounded-md text-sm font-semibold hover:bg-secondary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-400">
                Cancel
              </button>
          </div>
      </div>
    </>
  );
};

export default ProductsScreen;