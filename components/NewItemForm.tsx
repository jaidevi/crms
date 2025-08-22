import React, { useState } from 'react';
import { QuestionMarkIcon, ImageIcon, CloseIcon } from './Icons';

interface FormLabelProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  hasInfo?: boolean;
  labelColor?: string;
}

const FormLabel: React.FC<FormLabelProps> = ({ htmlFor, label, required = false, hasInfo = false, labelColor = "text-gray-700"}) => {
  return (
    <label htmlFor={htmlFor} className={`flex items-center text-sm font-medium mb-1 ${labelColor}`}>
      <span>{label}</span>
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {hasInfo && <QuestionMarkIcon className="w-4 h-4 text-gray-400 ml-1" />}
    </label>
  );
};

const ProductsScreen: React.FC = () => {
  const [itemType, setItemType] = useState('goods');
  
  return (
    <>
      <div className="bg-white rounded-lg shadow-sm">
          {/* Form Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-800">New Product</h1>
              <button className="p-1 rounded-full hover:bg-gray-100">
                  <CloseIcon className="w-5 h-5 text-gray-500" />
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
                                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Goods</span>
                              </label>
                              <label className="flex items-center">
                                  <input 
                                      type="radio" 
                                      name="itemType" 
                                      value="service"
                                      checked={itemType === 'service'}
                                      onChange={(e) => setItemType(e.target.value)}
                                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">Service</span>
                              </label>
                          </div>
                      </div>
                      
                      <div>
                          <FormLabel htmlFor="name" label="Name" required />
                          <input id="name" type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
                      </div>

                      <div>
                          <FormLabel htmlFor="unit" label="Unit" hasInfo />
                          <select id="unit" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                              <option>Select or type to add</option>
                              <option>PCS</option>
                              <option>BOX</option>
                              <option>KG</option>
                          </select>
                      </div>

                      <div>
                          <FormLabel htmlFor="selling-price" label="Selling Price" required labelColor="text-red-500" />
                          <div className="flex rounded-md shadow-sm">
                              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                  INR
                              </span>
                              <input type="text" id="selling-price" className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300" />
                          </div>
                      </div>

                      <div>
                          <FormLabel htmlFor="description" label="Description" />
                          <textarea id="description" rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"></textarea>
                      </div>
                  </div>

                  {/* Right side image dropzone */}
                  <div className="lg:col-span-1 mt-8">
                      <div className="flex justify-center items-center w-full h-52 border-2 border-gray-300 border-dashed rounded-lg">
                          <div className="text-center">
                              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <p className="mt-2 text-sm text-gray-600">
                                  Drag image(s) here or {' '}
                                  <button className="font-medium text-blue-600 hover:text-blue-500">
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
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Save
              </button>
              <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
                Cancel
              </button>
          </div>
      </div>
    </>
  );
};

export default ProductsScreen;