
import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, CalendarIcon } from './Icons';
import DatePicker from './DatePicker';
import type { EmployeeAdvance, Employee } from '../types';

interface EmployeeAdvanceFormProps {
    onClose: () => void;
    onSave: (advance: Omit<EmployeeAdvance, 'id'> | EmployeeAdvance) => void | Promise<void>;
    employees: Employee[];
    advanceToEdit?: EmployeeAdvance | null;
}

const BLANK_ADVANCE: Omit<EmployeeAdvance, 'id'> = {
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paidAmount: 0,
    notes: '',
};

const formatDateForInput = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const EmployeeAdvanceForm: React.FC<EmployeeAdvanceFormProps> = ({ onClose, onSave, employees, advanceToEdit }) => {
    const isEditing = !!advanceToEdit;
    const [advance, setAdvance] = useState<Omit<EmployeeAdvance, 'id'>>(BLANK_ADVANCE);
    const [amountInput, setAmountInput] = useState('0');
    const [paidAmountInput, setPaidAmountInput] = useState('0');
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (advanceToEdit) {
            const { id, ...rest } = advanceToEdit;
            setAdvance(rest);
            setAmountInput(String(rest.amount || '0'));
            setPaidAmountInput(String(rest.paidAmount || '0'));
        } else {
            const newAdvance = {
                ...BLANK_ADVANCE,
                date: new Date().toISOString().split('T')[0],
                employeeId: '',
            };
            setAdvance(newAdvance);
            setAmountInput(String(newAdvance.amount));
            setPaidAmountInput(String(newAdvance.paidAmount));
        }
    }, [advanceToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAdvance(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'amount' | 'paidAmount') => {
        const { value } = e.target;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            if (field === 'amount') {
                setAmountInput(value);
            } else {
                setPaidAmountInput(value);
            }

            setAdvance(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
            
            if (errors[field]) {
                setErrors(prev => ({ ...prev, [field]: '' }));
            }
        }
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!advance.employeeId) newErrors.employeeId = "Employee is required.";
        if (!advance.date) newErrors.date = "Date is required.";
        if (Number(advance.amount) <= 0) newErrors.amount = "Amount must be a positive number.";
        if (Number(advance.paidAmount) < 0) {
            newErrors.paidAmount = "Paid amount cannot be negative.";
        }
        if (Number(advance.paidAmount) > Number(advance.amount)) {
            newErrors.paidAmount = "Paid amount cannot exceed the advance amount.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        const finalAdvanceData = { ...advance, amount: Number(advance.amount), paidAmount: Number(advance.paidAmount) || 0 };

        if (isEditing && advanceToEdit) {
            await onSave({ ...finalAdvanceData, id: advanceToEdit.id });
        } else {
            await onSave(finalAdvanceData);
        }
    };

    const modalTitle = isEditing ? 'Edit Employee Advance' : 'Record New Advance';
    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
    const sortedEmployees = useMemo(() => [...employees].sort((a,b) => a.name.localeCompare(b.name)), [employees]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-start p-4 pt-20" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl animate-fade-in-down overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-xl font-bold text-gray-800">{modalTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">Employee <span className="text-red-500">*</span></label>
                            <select id="employeeId" name="employeeId" value={advance.employeeId} onChange={handleChange} className={`${commonInputClasses} ${errors.employeeId ? 'border-red-500' : ''}`}>
                                <option value="">Select an employee</option>
                                {sortedEmployees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                            {errors.employeeId && <p className="mt-1 text-sm text-red-500">{errors.employeeId}</p>}
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <button type="button" onClick={() => setDatePickerOpen(p => !p)} className={`block w-full text-left ${commonInputClasses}`}>
                                    {formatDateForInput(advance.date) || 'Select date'}
                                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </button>
                                {isDatePickerOpen && <DatePicker value={advance.date} onChange={d => { setAdvance(p => ({...p, date: d})); setDatePickerOpen(false); }} onClose={() => setDatePickerOpen(false)} />}
                            </div>
                            {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
                        </div>
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Advance Amount <span className="text-red-500">*</span></label>
                            <input id="amount" name="amount" type="number" min="0" value={amountInput} onChange={(e) => handleNumericChange(e, 'amount')} className={`${commonInputClasses} ${errors.amount ? 'border-red-500' : ''}`} placeholder="0.00" />
                            {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
                        </div>
                        <div>
                            <label htmlFor="paidAmount" className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
                            <input id="paidAmount" name="paidAmount" type="number" min="0" value={paidAmountInput} onChange={(e) => handleNumericChange(e, 'paidAmount')} className={`${commonInputClasses} ${errors.paidAmount ? 'border-red-500' : ''}`} placeholder="0.00" />
                            {errors.paidAmount && <p className="mt-1 text-sm text-red-500">{errors.paidAmount}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes / Reason</label>
                            <textarea id="notes" name="notes" rows={3} value={advance.notes || ''} onChange={handleChange} className={commonInputClasses} placeholder="e.g., Personal advance" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-end p-5 bg-gray-50 border-t space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50">Cancel</button>
                    <button onClick={handleSubmit} className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">
                        {isEditing ? 'Update Advance' : 'Save Advance'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeAdvanceForm;
