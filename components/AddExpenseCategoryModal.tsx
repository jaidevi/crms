import React, { useState } from 'react';
import { CloseIcon } from './Icons';

interface AddExpenseCategoryModalProps {
    onClose: () => void;
    onSave: (name: string) => void;
    existingCategoryNames: string[];
}

const AddExpenseCategoryModal: React.FC<AddExpenseCategoryModalProps> = ({ onClose, onSave, existingCategoryNames }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Category name cannot be empty.');
            return;
        }

        if (existingCategoryNames.map(n => n.toLowerCase()).includes(trimmedName.toLowerCase())) {
            setError('This category name already exists.');
            return;
        }

        onSave(trimmedName);
    };

    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center" role="dialog" aria-modal="true" aria-labelledby="add-category-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 animate-fade-in-down">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 id="add-category-modal-title" className="text-lg font-semibold text-gray-800">Add New Expense Category</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="Close">
                        <CloseIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <div className="p-6">
                    <div>
                        <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Category Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="category-name"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError('');
                            }}
                            className={`${commonInputClasses} ${error ? 'border-red-500' : ''}`}
                            placeholder="e.g., Travel, Food, Utilities"
                            autoFocus
                        />
                        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                    </div>
                </div>
                <div className="flex justify-end items-center p-4 bg-gray-50 border-t rounded-b-lg space-x-3">
                    <button onClick={onClose} type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onClick={handleSave} type="button" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">
                        Save Category
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddExpenseCategoryModal;