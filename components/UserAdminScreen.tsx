
import React, { useState, useEffect } from 'react';
import type { CompanyDetails } from '../App';
import { SpinnerIcon, CheckIcon, TrashIcon } from './Icons';

interface UserAdminScreenProps {
  companyDetails: CompanyDetails;
  onUpdate: (details: CompanyDetails) => Promise<void>;
}

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    // Compress to JPEG with 0.7 quality to reduce size significantly
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                } else {
                    reject(new Error('Could not get canvas context'));
                }
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
};

const UserAdminScreen: React.FC<UserAdminScreenProps> = ({ companyDetails, onUpdate }) => {
  const [details, setDetails] = useState(companyDetails);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with props when data is fetched
  useEffect(() => {
    setDetails(companyDetails);
  }, [companyDetails]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        try {
            // Resize image to max 300x300 to ensure it fits in DB text column
            const resizedBase64 = await resizeImage(file, 300, 300);
            setDetails(prev => ({ ...prev, logoUrl: resizedBase64 }));
        } catch (error) {
            console.error("Error resizing image:", error);
            alert("Failed to process image. Please try a different file.");
        }
    }
  };

  const handleRemoveLogo = () => {
      setDetails(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        await onUpdate(details);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
    } catch (e) {
        // Error handling is managed by onUpdate in App.tsx which shows an alert.
    } finally {
        setIsSaving(false);
    }
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
             <div>
                <label htmlFor="hsnSac" className="block text-sm font-medium text-gray-700 mb-1">Default HSN/SAC</label>
                <input type="text" id="hsnSac" name="hsnSac" value={details.hsnSac || ''} onChange={handleChange} className={commonInputClasses} placeholder="998821" />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
                <div className="flex items-center space-x-4">
                    {details.logoUrl ? (
                        <div className="relative group">
                            <div className="flex-shrink-0 h-20 w-20 border rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                                <img src={details.logoUrl} alt="Logo Preview" className="h-full w-full object-contain" />
                            </div>
                            <button
                                type="button"
                                onClick={handleRemoveLogo}
                                className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 shadow-sm"
                                title="Remove Logo"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 text-gray-400 text-xs text-center p-1">
                            No Logo
                        </div>
                    )}
                    <div className="flex-1">
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        <p className="text-xs text-gray-500 mt-1">Upload a PNG or JPG image. It will be resized automatically.</p>
                    </div>
                </div>
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
            disabled={isSaving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
                <>
                    <SpinnerIcon className="w-4 h-4 mr-2" />
                    Saving...
                </>
            ) : (
                'Save Changes'
            )}
          </button>
          {isSaved && (
              <span className="flex items-center text-sm text-green-600 transition-opacity duration-300">
                  <CheckIcon className="w-4 h-4 mr-1" />
                  Details saved successfully!
              </span>
          )}
      </div>
    </form>
  );
};

export default UserAdminScreen;
