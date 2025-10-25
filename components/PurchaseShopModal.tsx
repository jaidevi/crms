
import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';
import type { PurchaseShop } from '../App';
import { indianStates } from '../data/indian-locations';

interface PurchaseShopModalProps {
    onClose: () => void;
    onSave: (newShop: PurchaseShop) => void;
    existingShopNames: string[];
    shopToEdit?: PurchaseShop | null;
}

// FIX: Removed 'contactPerson' property which does not exist in the 'PurchaseShop' type.
const BLANK_SHOP: PurchaseShop = {
    id: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNo: '',
    panNo: '',
    paymentTerms: 'Due on receipt',
};

const PurchaseShopModal: React.FC<PurchaseShopModalProps> = ({ onClose, onSave, existingShopNames, shopToEdit }) => {
    const [shop, setShop] = useState<PurchaseShop>(shopToEdit || BLANK_SHOP);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    
    useEffect(() => {
        const initialShop = shopToEdit || BLANK_SHOP;
        setShop(initialShop);
        setErrors({});

        if (initialShop.state) {
            const stateData = indianStates.find(s => s.state === initialShop.state);
            setAvailableCities(stateData ? stateData.cities.sort() : []);
        } else {
            setAvailableCities([]);
        }
    }, [shopToEdit]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'state') {
            const stateData = indianStates.find(s => s.state === value);
            setAvailableCities(stateData ? stateData.cities.sort() : []);
            setShop(prev => ({ ...prev, state: value, city: '' }));
        } else {
            setShop(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        const trimmedName = shop.name.trim();

        if (!trimmedName) {
            newErrors.name = 'Shop name cannot be empty.';
        } else {
            const otherShopNames = shopToEdit
                ? existingShopNames.filter(name => name.toLowerCase() !== shopToEdit.name.toLowerCase())
                : existingShopNames;
            if (otherShopNames.map(name => name.toLowerCase()).includes(trimmedName.toLowerCase())) {
                newErrors.name = 'This shop name already exists.';
            }
        }

        if (shop.phone && !/^(?:\+91)?[6789]\d{9}$/.test(shop.phone.trim())) {
            newErrors.phone = 'Invalid Indian mobile number (e.g., 9876543210).';
        }

        if (shop.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shop.email.trim())) {
            newErrors.email = 'Invalid email address.';
        }

        if (shop.gstNo && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(shop.gstNo.trim())) {
            newErrors.gstNo = 'Invalid GST number format.';
        }

        if (shop.panNo && !/^[A-Z]{5}\d{4}[A-Z]{1}$/i.test(shop.panNo.trim())) {
            newErrors.panNo = 'Invalid PAN number format.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSave = () => {
        if (!validate()) {
            return;
        }
        onSave({ ...shop, name: shop.name.trim() });
    };

    const inputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
    const modalTitle = shopToEdit ? 'Edit Shop' : 'Add New Shop';
    const saveButtonText = shopToEdit ? 'Update Shop' : 'Save Shop';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex justify-center items-start p-4 pt-10" role="dialog" aria-modal="true" aria-labelledby="shop-master-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 animate-fade-in-down">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 id="shop-master-modal-title" className="text-lg font-semibold text-gray-800">{modalTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="Close">
                        <CloseIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Shop Name <span className="text-red-500">*</span>
                        </label>
                        <input id="name" name="name" type="text" value={shop.name} onChange={handleChange} className={`${inputClasses} ${errors.name ? 'border-red-500' : ''}`} autoFocus />
                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input id="phone" name="phone" type="tel" value={shop.phone} onChange={handleChange} className={`${inputClasses} ${errors.phone ? 'border-red-500' : ''}`} />
                             {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input id="email" name="email" type="email" value={shop.email} onChange={handleChange} className={`${inputClasses} ${errors.email ? 'border-red-500' : ''}`} />
                            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea id="address" name="address" rows={2} value={shop.address} onChange={handleChange} className={inputClasses}></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                            <select id="state" name="state" value={shop.state} onChange={handleChange} className={inputClasses}>
                                <option value="">Select a state</option>
                                {indianStates.map(s => (
                                    <option key={s.state} value={s.state}>{s.state}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">District</label>
                            <select id="city" name="city" value={shop.city} onChange={handleChange} className={inputClasses} disabled={!shop.state || availableCities.length === 0}>
                                <option value="">{shop.state ? 'Select a district' : 'Select a state first'}</option>
                                {availableCities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                            <input id="pincode" name="pincode" type="text" value={shop.pincode} onChange={handleChange} className={inputClasses} />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="gstNo" className="block text-sm font-medium text-gray-700 mb-1">GST NO</label>
                            <input id="gstNo" name="gstNo" type="text" value={shop.gstNo} onChange={handleChange} className={`${inputClasses} ${errors.gstNo ? 'border-red-500' : ''}`} />
                             {errors.gstNo && <p className="mt-1 text-sm text-red-500">{errors.gstNo}</p>}
                        </div>
                        <div>
                            <label htmlFor="panNo" className="block text-sm font-medium text-gray-700 mb-1">PAN No</label>
                            <input id="panNo" name="panNo" type="text" value={shop.panNo || ''} onChange={handleChange} className={`${inputClasses} ${errors.panNo ? 'border-red-500' : ''}`} />
                            {errors.panNo && <p className="mt-1 text-sm text-red-500">{errors.panNo}</p>}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end items-center p-4 bg-gray-50 border-t rounded-b-lg space-x-3">
                    <button onClick={onClose} type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} type="button" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">{saveButtonText}</button>
                </div>
            </div>
        </div>
    );
};

export default PurchaseShopModal;