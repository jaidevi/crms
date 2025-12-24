
import React, { useState, useMemo } from 'react';
import type { PurchaseShop } from '../types';
import { indianStates } from '../data/indian-locations';

interface NewPartyScreenProps {
    shops: PurchaseShop[];
    onAddShop: (newShop: Omit<PurchaseShop, 'id'>) => void;
    setActiveScreen: (screen: string) => void;
}

/* FIX: Added missing openingBalance property */
const BLANK_SHOP: Omit<PurchaseShop, 'id'> = {
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
    openingBalance: 0,
};

const NewPartyScreen: React.FC<NewPartyScreenProps> = ({ shops, onAddShop, setActiveScreen }) => {
    const [shop, setShop] = useState<Omit<PurchaseShop, 'id'>>(BLANK_SHOP);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [availableCities, setAvailableCities] = useState<string[]>([]);

    const existingShopNames = useMemo(() => shops.map(s => s.name), [shops]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'state') {
            const stateData = indianStates.find(s => s.state === value);
            setAvailableCities(stateData ? stateData.cities.sort() : []);
            setShop(prev => ({ ...prev, state: value, city: '' }));
        } else {
            const finalValue = name === 'name' ? value.toUpperCase() : value;
            setShop(prev => ({ ...prev, [name]: finalValue }));
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
            newErrors.name = 'Party name cannot be empty.';
        } else if (existingShopNames.map(name => name.toLowerCase()).includes(trimmedName.toLowerCase())) {
            newErrors.name = 'This party name already exists.';
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
        onAddShop({ ...shop, name: shop.name.trim() });
        setActiveScreen('Add Purchase Shop');
    };

    const handleCancel = () => {
        setActiveScreen('Add Purchase Shop');
    };

    const inputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";

    return (
        <div className="bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <h1 className="text-xl font-semibold text-gray-800">Create New Party</h1>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Party Name <span className="text-red-500">*</span>
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
            <div className="bg-white py-4 px-8 mt-0 rounded-lg shadow-sm border-t">
                <div className="flex justify-start space-x-3">
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Save Party
                    </button>
                    <button onClick={handleCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewPartyScreen;
