
import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, CalendarIcon } from './Icons';
import DatePicker from './DatePicker';
import type { TimberExpense, PurchaseShop, PaymentMode, OrderStatus } from '../types';
import PurchaseShopModal from './PurchaseShopModal';
import AddBankModal from './AddBankModal';

interface TimberExpenseFormProps {
    onClose: () => void;
    onSave: (expense: Omit<TimberExpense, 'id'> | TimberExpense) => void;
    expenseToEdit?: TimberExpense | null;
    suppliers: PurchaseShop[];
    onAddSupplier: (newShop: Omit<PurchaseShop, 'id'>) => void;
    bankNames: string[];
    onAddBankName: (newBankName: string) => void;
}

const BLANK_EXPENSE: Omit<TimberExpense, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    supplierName: '',
    loadWeight: 0,
    vehicleWeight: 0,
    cft: 0,
    rate: 0,
    amount: 0,
    notes: '',
    bankName: '',
    chequeDate: '',
    paymentMode: 'Cash',
    paymentStatus: 'Paid',
    paymentTerms: 'Due on receipt'
};

const formatDateForInput = (isoDate?: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const parsePaymentTermsToDays = (terms?: string): string => {
    if (!terms) return '';
    if (terms.toLowerCase() === 'due on receipt') {
        return '0';
    }
    const match = terms.match(/net (\d+)/i);
    return match ? match[1] : '';
};

const TimberExpenseForm: React.FC<TimberExpenseFormProps> = ({ onClose, onSave, expenseToEdit, suppliers, onAddSupplier, bankNames, onAddBankName }) => {
    const isEditing = !!expenseToEdit;
    const [expense, setExpense] = useState<Omit<TimberExpense, 'id'>>(BLANK_EXPENSE);
    
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [showAddBankModal, setShowAddBankModal] = useState(false);

    useEffect(() => {
        if (expenseToEdit) {
            const { id, ...rest } = expenseToEdit;
            setExpense(rest);
        } else {
            const newExpense = { ...BLANK_EXPENSE, date: new Date().toISOString().split('T')[0] };
            setExpense(newExpense);
        }
    }, [expenseToEdit]);

    useEffect(() => {
        const loadWeight = expense.loadWeight || 0;
        const vehicleWeight = expense.vehicleWeight || 0;
        const cft = Math.max(0, loadWeight - vehicleWeight);
        setExpense(prev => ({ ...prev, cft }));
    }, [expense.loadWeight, expense.vehicleWeight]);

    useEffect(() => {
        const amount = (expense.cft || 0) * (expense.rate || 0);
        setExpense(prev => ({ ...prev, amount }));
    }, [expense.cft, expense.rate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        
        setExpense(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
        
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };
    
    const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '_add_new_') {
            setShowAddSupplierModal(true);
            return;
        }
        setExpense(prev => ({...prev, supplierName: value}));
        if (errors.supplierName) setErrors(prev => ({...prev, supplierName: ''}));
    }

    const handleSaveSupplier = (newShop: Omit<PurchaseShop, 'id'>) => {
        onAddSupplier(newShop);
        setExpense(prev => ({...prev, supplierName: newShop.name}));
        setShowAddSupplierModal(false);
    };
    
    const handleSaveBank = (newBank: string) => {
        onAddBankName(newBank);
        setExpense(prev => ({...prev, bankName: newBank}));
        setShowAddBankModal(false);
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!expense.supplierName.trim()) newErrors.supplierName = "Supplier is required.";
        if (Number(expense.loadWeight) <= 0) newErrors.loadWeight = "Load Weight must be positive.";
        if (Number(expense.vehicleWeight) <= 0) newErrors.vehicleWeight = "Vehicle Weight must be positive.";
        if (Number(expense.loadWeight) <= Number(expense.vehicleWeight)) newErrors.loadWeight = "Load weight must be greater than vehicle weight.";
        if (!expense.date) newErrors.date = "Date is required.";
        if (Number(expense.rate) <= 0) newErrors.rate = "Rate must be positive.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        const finalExpenseData = { ...expense, amount: Number(expense.amount) };

        if (isEditing && expenseToEdit) {
            onSave({ ...finalExpenseData, id: expenseToEdit.id });
        } else {
            onSave(finalExpenseData);
        }
    };

    const sortedSuppliers = useMemo(() => 
        [...suppliers].sort((a, b) => a.name.localeCompare(b.name)),
        [suppliers]
    );
    
    const modalTitle = isEditing ? 'Edit Timber Expense' : 'Record New Timber Expense';
    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";

    return (
        <>
           {showAddSupplierModal && <PurchaseShopModal onClose={() => setShowAddSupplierModal(false)} onSave={handleSaveSupplier} existingShopNames={suppliers.map(s => s.name)} />}
            {showAddBankModal && <AddBankModal onClose={() => setShowAddBankModal(false)} onSave={handleSaveBank} existingBankNames={bankNames} />}
            <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-start p-4 pt-20" role="dialog">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl animate-fade-in-down overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b">
                        <h2 className="text-xl font-bold text-gray-800">{modalTitle}</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <button type="button" onClick={() => setDatePickerOpen(p => !p)} className={`block w-full text-left ${commonInputClasses}`}>
                                        {formatDateForInput(expense.date) || 'Select date'}
                                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    </button>
                                    {isDatePickerOpen && <DatePicker value={expense.date} onChange={d => { setExpense(p => ({...p, date: d})); setDatePickerOpen(false); }} onClose={() => setDatePickerOpen(false)} />}
                                </div>
                                {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
                            </div>
                            <div>
                                <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 mb-1">Supplier <span className="text-red-500">*</span></label>
                                <select id="supplierName" name="supplierName" value={expense.supplierName} onChange={handleSupplierChange} className={`${commonInputClasses} ${errors.supplierName ? 'border-red-500' : ''}`}>
                                    <option value="" disabled>Select a supplier</option>
                                    {sortedSuppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    <option value="_add_new_" className="font-semibold text-blue-600">++ Add New Supplier ++</option>
                                </select>
                                {errors.supplierName && <p className="mt-1 text-sm text-red-500">{errors.supplierName}</p>}
                            </div>
                            <div>
                                <label htmlFor="loadWeight" className="block text-sm font-medium text-gray-700 mb-1">Load Weight <span className="text-red-500">*</span></label>
                                <input id="loadWeight" name="loadWeight" type="number" value={expense.loadWeight || ''} onChange={handleChange} className={`${commonInputClasses} ${errors.loadWeight ? 'border-red-500' : ''}`} placeholder="0.00" />
                                {errors.loadWeight && <p className="mt-1 text-sm text-red-500">{errors.loadWeight}</p>}
                            </div>
                            <div>
                                <label htmlFor="vehicleWeight" className="block text-sm font-medium text-gray-700 mb-1">Vehicle Weight <span className="text-red-500">*</span></label>
                                <input id="vehicleWeight" name="vehicleWeight" type="number" value={expense.vehicleWeight || ''} onChange={handleChange} className={`${commonInputClasses} ${errors.vehicleWeight ? 'border-red-500' : ''}`} placeholder="0.00" />
                                {errors.vehicleWeight && <p className="mt-1 text-sm text-red-500">{errors.vehicleWeight}</p>}
                            </div>
                            <div>
                                <label htmlFor="cft" className="block text-sm font-medium text-gray-700 mb-1">CFT (Calculated)</label>
                                <input id="cft" name="cft" type="number" value={expense.cft.toFixed(2)} readOnly className={`${commonInputClasses} bg-gray-100`} />
                            </div>
                             <div>
                                <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">Rate (per CFT) <span className="text-red-500">*</span></label>
                                <input id="rate" name="rate" type="number" value={expense.rate || ''} onChange={handleChange} className={`${commonInputClasses} ${errors.rate ? 'border-red-500' : ''}`} placeholder="0.00" />
                                {errors.rate && <p className="mt-1 text-sm text-red-500">{errors.rate}</p>}
                            </div>
                            <div>
                                <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                                <div className="relative">
                                    <input
                                        id="paymentTerms"
                                        type="number"
                                        value={parsePaymentTermsToDays(expense.paymentTerms)}
                                        onChange={e => {
                                            const value = e.target.value;
                                            if (value === '') {
                                                setExpense(prev => ({...prev, paymentTerms: ''}));
                                                return;
                                            }
                                            const numDays = parseInt(value, 10);
                                            if (!isNaN(numDays)) {
                                                if (numDays <= 0) {
                                                    setExpense(prev => ({...prev, paymentTerms: 'Due on receipt'}));
                                                } else {
                                                    setExpense(prev => ({...prev, paymentTerms: `Net ${numDays}`}));
                                                }
                                            }
                                        }}
                                        className={`${commonInputClasses} pr-12`}
                                        placeholder="e.g., 30"
                                        min="0"
                                    />
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <span className="text-secondary-500 sm:text-sm">
                                            days
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                                <input id="amount" name="amount" type="text" value={`₹${expense.amount.toFixed(2)}`} readOnly className={`${commonInputClasses} bg-gray-100 font-semibold text-lg`} />
                            </div>
                        </div>

                        <hr className="border-gray-200" />

                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea id="notes" name="notes" rows={2} value={expense.notes || ''} onChange={handleChange} className={commonInputClasses} />
                        </div>
                    </div>
                    <div className="flex items-center justify-end p-5 bg-gray-50 border-t space-x-3">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSubmit} className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">
                            {isEditing ? 'Update Expense' : 'Save Expense'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TimberExpenseForm;
