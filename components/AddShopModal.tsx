

import React, { useState } from 'react';
import { CloseIcon } from './Icons';

interface AddShopModalProps {
    onClose: () => void;
    onSave: (clientName: string) => void;
    existingClientNames: string[];
}

const AddShopModal: React.FC<AddShopModalProps> = ({ onClose, onSave, existingClientNames }) => {
    const [clientName, setClientName] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        const trimmedName = clientName.trim();
        if (!trimmedName) {
            setError('Client name cannot be empty.');
        } else {
            const normalize = (name: string) => name.toLowerCase().replace(/[\s&'.,-/]/g, '').replace(/s$/, '');
            const normalizedTrimmedName = normalize(trimmedName);
            if (existingClientNames.some(name => normalize(name) === normalizedTrimmedName)) {
                setError('A client with this name or a very similar name already exists.');
            } else {
                onSave(trimmedName);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" role="dialog" aria-modal="true" aria-labelledby="add-client-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 animate-fade-in-down">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 id="add-client-modal-title" className="text-lg font-semibold text-gray-800">Add New Client</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="Close">
                        <CloseIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <div className="p-6">
                    <div>
                        <label htmlFor="new-client-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Client Name
                        </label>
                        <input
                            id="new-client-name"
                            type="text"
                            value={clientName}
                            onChange={(e) => {
                                setClientName(e.target.value);
                                if (error) setError('');
                            }}
                            className={`w-full px-3 py-2.5 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Enter client name"
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
                        Save Client
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddShopModal;
