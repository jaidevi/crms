
import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';
import type { ProcessType } from '../App';

interface ProcessTypeModalProps {
    onClose: () => void;
    onSave: (data: { name: string, rate: number }) => void;
    existingProcessNames: string[];
    processToEdit?: ProcessType | null;
}

const ProcessTypeModal: React.FC<ProcessTypeModalProps> = ({ onClose, onSave, existingProcessNames, processToEdit }) => {
    const [name, setName] = useState('');
    const [rate, setRate] = useState<number | '' >('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (processToEdit) {
            setName(processToEdit.name);
            setRate(processToEdit.rate ?? '');
        }
    }, [processToEdit]);

    const handleSave = () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            setError('Process type name cannot be empty.');
            return;
        }

        const otherProcessNames = processToEdit
            ? existingProcessNames.filter(n => n.toLowerCase() !== processToEdit.name.toLowerCase())
            : existingProcessNames;
        
        if (otherProcessNames.map(n => n.toLowerCase()).includes(trimmedName.toLowerCase())) {
            setError('This process type name already exists.');
            return;
        }
        
        onSave({ name: trimmedName, rate: Number(rate) || 0 });
    };
    
    const modalTitle = processToEdit ? 'Edit Process Type' : 'Add New Process Type';
    const commonInputClasses = `w-full px-3 py-2.5 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" role="dialog" aria-modal="true" aria-labelledby="process-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 animate-fade-in-down">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 id="process-modal-title" className="text-lg font-semibold text-gray-800">{modalTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="Close">
                        <CloseIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="process-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Process Type Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="process-name"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value.toUpperCase());
                                if (error) setError('');
                            }}
                            className={`${commonInputClasses} ${error ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="e.g., WEAVING, DYEING"
                            autoFocus
                        />
                        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
                    </div>
                    <div>
                        <label htmlFor="process-rate" className="block text-sm font-medium text-gray-700 mb-1">
                            Default Rate
                        </label>
                         <input
                            id="process-rate"
                            type="number"
                            value={rate}
                            onChange={(e) => setRate(e.target.value === '' ? '' : Number(e.target.value))}
                            className={`${commonInputClasses} border-gray-300`}
                            placeholder="e.g., 1.85"
                        />
                    </div>
                </div>
                <div className="flex justify-end items-center p-4 bg-gray-50 border-t rounded-b-lg space-x-3">
                    <button
                        onClick={onClose}
                        type="button"
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        type="button"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700"
                    >
                        Save Process Type
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProcessTypeModal;
