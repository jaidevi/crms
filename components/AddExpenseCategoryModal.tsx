import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';
import type { ExpenseCategory } from '../types';

interface AddExpenseCategoryModalProps {
    onClose: () => void;
    onSave: (name: string) => void;
    existingCategoryNames: string[];
    categoryToEdit?: ExpenseCategory | null;
}

const AddExpenseCategoryModal: React.FC<AddExpenseCategoryModalProps> = ({ onClose, onSave, existingCategoryNames, categoryToEdit }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (categoryToEdit) {
            setName(categoryToEdit.name);
        }
    }, [categoryToEdit]);

    const handleSave = () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Category name cannot be empty.');
            return;
        }

        const otherNames = categoryToEdit
            ? existingCategoryNames.filter(n => n.toLowerCase() !== categoryToEdit.name.toLowerCase())
            : existingCategoryNames;

        if (otherNames.map(n => n.toLowerCase()).includes(trimmedName.toLowerCase())) {
            setError('This category name already exists.');
            return;
        }

        onSave(trimmedName);
    };

    const commonInputClasses = "block w-full px-4 py-3 text-sm rounded-lg border-2 border-secondary-800 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-all";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex justify-center items-center" role="dialog" aria-modal="true" aria-labelledby="add-category-modal-title">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fade-in-down overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-secondary-100">
                    <h2 id="add-category-modal-title" className="text-xl font-bold text-secondary-800">
                        {categoryToEdit ? 'Edit Expense Category' : 'Add New Expense Category'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary-100 transition-colors" aria-label="Close">
                        <CloseIcon className="w-6 h-6 text-secondary-500" />
                    </button>
                </div>
                <div className="p-8">
                    <div>
                        <label htmlFor="category-name" className="block text-sm font-bold text-secondary-700 mb-2 ml-1">
                            Category Name <span className="text-danger-500">*</span>
                        </label>
                        <input
                            id="category-name"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError('');
                            }}
                            className={`${commonInputClasses} ${error ? 'border-danger-500' : 'border-secondary-900'}`}
                            placeholder="e.g., Travel, Food, Utilities"
                            autoFocus
                        />
                        {error && <p className="mt-2 text-xs font-semibold text-danger-600 ml-1">{error}</p>}
                    </div>
                </div>
                <div className="flex justify-end items-center p-5 bg-secondary-50 border-t border-secondary-100 space-x-3">
                    <button 
                        onClick={onClose} 
                        type="button" 
                        className="px-6 py-2.5 bg-secondary-200 text-secondary-800 rounded-xl text-sm font-bold hover:bg-secondary-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        type="button" 
                        className="px-8 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 shadow-md transform active:scale-95 transition-all"
                    >
                        {categoryToEdit ? 'Update Category' : 'Save Category'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddExpenseCategoryModal;