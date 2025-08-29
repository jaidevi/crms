
import React, { useState } from 'react';
import { CloseIcon } from './Icons';

interface AddShopModalProps {
    onClose: () => void;
    onSave: (shopName: string) => void;
    existingShopNames: string[];
}

const AddShopModal: React.FC<AddShopModalProps> = ({ onClose, onSave, existingShopNames }) => {
    const [shopName, setShopName] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        const trimmedName = shopName.trim();
        if (!trimmedName) {
            setError('Shop name cannot be empty.');
        } else if (existingShopNames.map(name => name.toLowerCase()).includes(trimmedName.toLowerCase())) {
            setError('This shop name already exists.');
        } else {
            onSave(trimmedName);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex justify-center items-center" role="dialog" aria-modal="true" aria-labelledby="add-shop-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 animate-fade-in-down">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 id="add-shop-modal-title" className="text-lg font-semibold text-gray-800">Add New Shop</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="Close">
                        <CloseIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <div className="p-6">
                    <div>
                        <label htmlFor="new-shop-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Shop Name
                        </label>
                        <input
                            id="new-shop-name"
                            type="text"
                            value={shopName}
                            onChange={(e) => {
                                setShopName(e.target.value);
                                if (error) setError('');
                            }}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Enter shop name"
                            autoFocus
                        />
                        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                    </div>
                </div>
                <div className="flex justify-end items-center p-4 bg-gray-50 border-t rounded-b-lg space-x-3">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        type="button"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Save Shop
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddShopModal;