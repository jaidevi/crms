
import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';
import type { Employee } from '../types';

interface EmployeeModalProps {
    onClose: () => void;
    onSave: (employee: Omit<Employee, 'id'>) => void;
    existingEmployees: Employee[];
    employeeToEdit?: Employee | null;
}

const BLANK_EMPLOYEE: Omit<Employee, 'id'> = {
    name: '',
    designation: '',
    phone: '',
    dailyWage: 0,
    monthlyWage: 0,
    ratePerMeter: 0,
};

const EmployeeModal: React.FC<EmployeeModalProps> = ({ onClose, onSave, existingEmployees, employeeToEdit }) => {
    const [employee, setEmployee] = useState(BLANK_EMPLOYEE);
    const [dailyWageInput, setDailyWageInput] = useState('0');
    const [monthlyWageInput, setMonthlyWageInput] = useState('0');
    const [ratePerMeterInput, setRatePerMeterInput] = useState('0');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (employeeToEdit) {
            setEmployee(employeeToEdit);
            setDailyWageInput(String(employeeToEdit.dailyWage || '0'));
            setMonthlyWageInput(String(employeeToEdit.monthlyWage || '0'));
            setRatePerMeterInput(String(employeeToEdit.ratePerMeter || '0'));
        } else {
            setEmployee(BLANK_EMPLOYEE);
            setDailyWageInput(String(BLANK_EMPLOYEE.dailyWage));
            setMonthlyWageInput(String(BLANK_EMPLOYEE.monthlyWage));
            setRatePerMeterInput(String(BLANK_EMPLOYEE.ratePerMeter));
        }
    }, [employeeToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEmployee(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
             setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'dailyWage' | 'ratePerMeter' | 'monthlyWage') => {
        const { value } = e.target;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            if (field === 'dailyWage') {
                setDailyWageInput(value);
            } else if (field === 'monthlyWage') {
                setMonthlyWageInput(value);
            } else {
                setRatePerMeterInput(value);
            }
            setEmployee(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
        }
    };

    const handleSave = () => {
        const newErrors: { [key: string]: string } = {};
        const trimmedName = employee.name.trim();

        if (!trimmedName) {
            newErrors.name = 'Employee name cannot be empty.';
        } else {
            const otherEmployeeNames = employeeToEdit
                ? existingEmployees.filter(e => e.id !== employeeToEdit.id).map(e => e.name.toLowerCase())
                : existingEmployees.map(e => e.name.toLowerCase());
            
            if (otherEmployeeNames.includes(trimmedName.toLowerCase())) {
                newErrors.name = 'This employee name already exists.';
            }
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        onSave({ 
            ...employee, 
            name: trimmedName,
            dailyWage: Number(employee.dailyWage) || 0,
            monthlyWage: Number(employee.monthlyWage) || 0,
            ratePerMeter: Number(employee.ratePerMeter) || 0,
        });
    };
    
    const modalTitle = employeeToEdit ? 'Edit Employee' : 'Add New Employee';
    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" role="dialog" aria-modal="true" aria-labelledby="employee-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 animate-fade-in-down">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 id="employee-modal-title" className="text-lg font-semibold text-gray-800">{modalTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="Close">
                        <CloseIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <div className="p-6 space-y-6">
                    <fieldset className="border border-gray-200 rounded-lg p-4">
                        <legend className="text-base font-semibold text-gray-900 px-2">Personal Details</legend>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Employee Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={employee.name}
                                    onChange={handleChange}
                                    className={`${commonInputClasses} ${errors.name ? 'border-red-500' : ''}`}
                                    autoFocus
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>
                            <div>
                                <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                <input id="designation" name="designation" type="text" value={employee.designation} onChange={handleChange} className={commonInputClasses} />
                            </div>
                             <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input id="phone" name="phone" type="text" value={employee.phone} onChange={handleChange} className={commonInputClasses} />
                            </div>
                        </div>
                    </fieldset>
                    
                    <fieldset className="border border-gray-200 rounded-lg p-4">
                        <legend className="text-base font-semibold text-gray-900 px-2">Compensation</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            <div>
                                <label htmlFor="dailyWage" className="block text-sm font-medium text-gray-700 mb-1">Daily Wage</label>
                                <input id="dailyWage" name="dailyWage" type="number" min="0" value={dailyWageInput} onChange={(e) => handleNumericChange(e, 'dailyWage')} className={commonInputClasses} placeholder="e.g., 500" />
                            </div>
                            <div>
                                <label htmlFor="monthlyWage" className="block text-sm font-medium text-gray-700 mb-1">Monthly Wage</label>
                                <input id="monthlyWage" name="monthlyWage" type="number" min="0" value={monthlyWageInput} onChange={(e) => handleNumericChange(e, 'monthlyWage')} className={commonInputClasses} placeholder="e.g., 15000" />
                            </div>
                            <div>
                                <label htmlFor="ratePerMeter" className="block text-sm font-medium text-gray-700 mb-1">Rate per Meter</label>
                                <input id="ratePerMeter" name="ratePerMeter" type="number" min="0" step="0.01" value={ratePerMeterInput} onChange={(e) => handleNumericChange(e, 'ratePerMeter')} className={commonInputClasses} placeholder="e.g., 1.25" />
                            </div>
                        </div>
                    </fieldset>
                </div>
                <div className="flex justify-end items-center p-4 bg-gray-50 border-t rounded-b-lg space-x-3">
                    <button onClick={onClose} type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onClick={handleSave} type="button" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">
                        Save Employee
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeModal;