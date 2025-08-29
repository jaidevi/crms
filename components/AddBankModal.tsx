import React, { useState } from 'react';
import { CloseIcon } from './Icons';

interface AddBankModalProps {
    onClose: () => void;
    onSave: (bankName: string) => void;
}

const AddBankModal: React.FC<AddBankModalProps> = ({ onClose, onSave }) => {
    const [bankName, setBankName] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        if (bankName.trim()) {
            onSave(bankName.trim());
        } else {
            setError('Bank name cannot be empty.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Add New Bank</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <CloseIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <div className="p-6">
                    <div>
                        <label htmlFor="new-bank-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Bank Name
                        </label>
                        <input
                            id="new-bank-name"
                            type="text"
                            value={bankName}
                            onChange={(e) => {
                                setBankName(e.target.value);
                                if (error) setError('');
                            }}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="Enter bank name"
                            autoFocus
                        />
                        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                    </div>
                </div>
                <div className="flex justify-end items-center p-4 bg-gray-50 border-t rounded-b-lg space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Save Bank
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddBankModal;
