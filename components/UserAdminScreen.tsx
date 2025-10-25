
import React, { useState } from 'react';
import type { CompanyDetails } from '../App';

interface UserAdminScreenProps {
  companyDetails: CompanyDetails;
  onUpdate: (details: CompanyDetails) => void;
}

const UserAdminScreen: React.FC<UserAdminScreenProps> = ({ companyDetails, onUpdate }) => {
  const [details, setDetails] = useState(companyDetails);
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(details);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";

  return (
    <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm max-w-4xl mx-auto">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800">Company Details</h1>
        <p className="text-gray-500 mt-1">Manage your company's information for invoices and reports.</p>
      </div>
      <div className="p-8 space-y-6">
        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <legend className="text-lg font-medium text-gray-900 col-span-full mb-2">Company Information</legend>
            <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" id="name" name="name" value={details.name} onChange={handleChange} className={commonInputClasses} required />
            </div>
             <div>
                <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                <input type="text" id="addressLine1" name="addressLine1" value={details.addressLine1} onChange={handleChange} className={commonInputClasses} />
            </div>
             <div>
                <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input type="text" id="addressLine2" name="addressLine2" value={details.addressLine2} onChange={handleChange} className={commonInputClasses} />
            </div>
             <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="text" id="phone" name="phone" value={details.phone} onChange={handleChange} className={commonInputClasses} />
            </div>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" id="email" name="email" value={details.email} onChange={handleChange} className={commonInputClasses} />
            </div>
             <div>
                <label htmlFor="gstin" className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <input type="text" id="gstin" name="gstin" value={details.gstin} onChange={handleChange} className={commonInputClasses} />
            </div>
        </fieldset>
        
        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-6 border-t">
            <legend className="text-lg font-medium text-gray-900 col-span-full mb-2">Bank Details</legend>
            <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                <input type="text" id="bankName" name="bankName" value={details.bankName} onChange={handleChange} className={commonInputClasses} />
            </div>
            <div>
                <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <input type="text" id="bankAccountNumber" name="bankAccountNumber" value={details.bankAccountNumber} onChange={handleChange} className={commonInputClasses} />
            </div>
            <div>
                <label htmlFor="bankIfscCode" className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                <input type="text" id="bankIfscCode" name="bankIfscCode" value={details.bankIfscCode} onChange={handleChange} className={commonInputClasses} />
            </div>
        </fieldset>
      </div>
       <div className="flex items-center justify-start space-x-3 p-5 bg-gray-50 border-t border-gray-200">
          <button 
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
          {isSaved && <span className="text-sm text-green-600 transition-opacity duration-300">Details saved successfully!</span>}
      </div>
    </form>
  );
};

export default UserAdminScreen;
