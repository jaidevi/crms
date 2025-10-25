import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, CalendarIcon } from './Icons';
import DatePicker from './DatePicker';
import type { OtherExpense, ExpenseCategory, PaymentMode, OrderStatus } from '../App';
import AddExpenseCategoryModal from './AddExpenseCategoryModal';
import AddBankModal from './AddBankModal';

interface OtherExpenseFormProps {
    onClose: () => void;
    onSave: (expense: OtherExpense) => void;
    expenseToEdit?: OtherExpense | null;
    expenseCategories: ExpenseCategory[];
    onAddExpenseCategory: (name: string) => Promise<ExpenseCategory | null>;
    bankNames: string[];
    onAddBankName: (newBankName: string) => void;
}

const BLANK_EXPENSE: Omit<OtherExpense, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    itemName: '',
    amount: 0,
    notes: '',
    paymentMode: undefined,
    paymentStatus: undefined,
    bankName: '',
    chequeDate: '',
    paymentTerms: 'Due on receipt',
};

const formatDateForInput = (isoDate?: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const OtherExpenseForm: React.FC<OtherExpenseFormProps> = ({ onClose, onSave, expenseToEdit, expenseCategories, onAddExpenseCategory, bankNames, onAddBankName }) => {
    const isEditing = !!expenseToEdit;
    const [expense, setExpense] = useState<Omit<OtherExpense, 'id'>>(BLANK_EXPENSE);
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [isChequeDatePickerOpen, setChequeDatePickerOpen] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
    const [showAddBankModal, setShowAddBankModal] = useState(false);

    useEffect(() => {
        if (expenseToEdit) {
            const { id, ...rest } = expenseToEdit;
            setExpense(rest);
        } else {
            setExpense({ ...BLANK_EXPENSE, date: new Date().toISOString().split('T')[0] });
        }
    }, [expenseToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (name === 'itemName' && value === '_add_new_') {
            setShowAddCategoryModal(true);
            return;
        }

        const isNumber = type === 'number';
        setExpense(prev => ({ ...prev, [name]: isNumber ? (value === '' ? '' : Number(value)) : value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSaveCategory = async (name: string) => {
        const newCategory = await onAddExpenseCategory(name);
        if (newCategory) {
            setExpense(prev => ({ ...prev, itemName: newCategory.name }));
        }
        setShowAddCategoryModal(false);
    };
    
    const handleBankNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '_add_new_') {
            setShowAddBankModal(true);
        } else {
            setExpense(prev => ({ ...prev, bankName: value }));
        }
        if (errors.bankName) setErrors(prev => ({ ...prev, bankName: '' }));
    };

    const handleSaveBank = (newBank: string) => {
        onAddBankName(newBank);
        setExpense(prev => ({...prev, bankName: newBank}));
        setShowAddBankModal(false);
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!expense.itemName.trim()) newErrors.itemName = "Category is required.";
        if (!expense.date) newErrors.date = "Date is required.";
        if (Number(expense.amount) <= 0) newErrors.amount = "Amount must be a positive number.";
        if (!expense.paymentMode) newErrors.paymentMode = "Payment mode is required.";
        if (!expense.paymentStatus) newErrors.paymentStatus = "Payment status is required.";

        if (expense.paymentMode === 'Cheque') {
            if (!expense.bankName?.trim()) {
                newErrors.bankName = "Bank name is required for cheque payments.";
            }
            if (!expense.chequeDate) {
                newErrors.chequeDate = "Cheque date is required for cheque payments.";
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSave({ ...expense, amount: Number(expense.amount), id: expenseToEdit?.id || `exp-temp-${Date.now()}` });
    };

    const sortedCategories = useMemo(() => 
        [...expenseCategories].sort((a, b) => a.name.localeCompare(b.name)),
        [expenseCategories]
    );
    
    const paymentTermOptions = useMemo(() => {
        const options = ['Due on receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60'];
        if (expense.paymentTerms && !options.includes(expense.paymentTerms)) {
            return [expense.paymentTerms, ...options];
        }
        return options;
    }, [expense.paymentTerms]);

    const modalTitle = isEditing ? 'Edit Expense' : 'Record New Expense';
    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
    const paymentModes: PaymentMode[] = ['Cash', 'Cheque', 'GPay', 'NEFT'];
    const paymentStatuses: OrderStatus[] = ['Paid', 'Unpaid'];

    return (
        <>
            {showAddCategoryModal && (
                <AddExpenseCategoryModal 
                    onClose={() => setShowAddCategoryModal(false)}
                    onSave={handleSaveCategory}
                    existingCategoryNames={expenseCategories.map(c => c.name)}
                />
            )}
            {showAddBankModal && (
                <AddBankModal
                    onClose={() => setShowAddBankModal(false)}
                    onSave={handleSaveBank}
                    existingBankNames={bankNames}
                />
            )}
            <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-start p-4 pt-20" role="dialog">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-fade-in-down overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b">
                        <h2 className="text-xl font-bold text-gray-800">{modalTitle}</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                                <select id="itemName" name="itemName" value={expense.itemName} onChange={handleChange} className={`${commonInputClasses} ${errors.itemName ? 'border-red-500' : ''}`}>
                                    <option value="" disabled>Select a category</option>
                                    {sortedCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                    <option value="_add_new_" className="font-semibold text-blue-600">++ Add New Category ++</option>
                                </select>
                                {errors.itemName && <p className="mt-1 text-sm text-red-500">{errors.itemName}</p>}
                            </div>
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
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                                <input id="amount" name="amount" type="number" value={expense.amount || ''} onChange={handleChange} className={`${commonInputClasses} ${errors.amount ? 'border-red-500' : ''}`} placeholder="0.00" />
                                {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
                            </div>
                            <div>
                                <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700 mb-1">Payment Mode <span className="text-red-500">*</span></label>
                                <select id="paymentMode" name="paymentMode" value={expense.paymentMode || ''} onChange={handleChange} className={`${commonInputClasses} ${errors.paymentMode ? 'border-red-500' : ''}`}>
                                    <option value="" disabled>Select a payment mode</option>
                                    {paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                </select>
                                {errors.paymentMode && <p className="mt-1 text-sm text-red-500">{errors.paymentMode}</p>}
                            </div>
                            <div>
                                <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">Payment Status <span className="text-red-500">*</span></label>
                                <select id="paymentStatus" name="paymentStatus" value={expense.paymentStatus || ''} onChange={handleChange} className={`${commonInputClasses} ${errors.paymentStatus ? 'border-red-500' : ''}`}>
                                    <option value="" disabled>Select a payment status</option>
                                    {paymentStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                                </select>
                                {errors.paymentStatus && <p className="mt-1 text-sm text-red-500">{errors.paymentStatus}</p>}
                            </div>
                            <div>
                                <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                                <select id="paymentTerms" name="paymentTerms" value={expense.paymentTerms || ''} onChange={handleChange} className={commonInputClasses}>
                                    {paymentTermOptions.map(term => (
                                        <option key={term} value={term}>{term}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {expense.paymentMode === 'Cheque' && (
                            <div className="p-4 bg-gray-50 rounded-lg border animate-fade-in-down">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">Bank Name <span className="text-red-500">*</span></label>
                                        <select
                                            id="bankName"
                                            name="bankName"
                                            value={expense.bankName || ''}
                                            onChange={handleBankNameChange}
                                            className={`${commonInputClasses} ${errors.bankName ? 'border-red-500' : ''}`}
                                        >
                                            <option value="" disabled>Select a bank</option>
                                            {bankNames.map(b => <option key={b} value={b}>{b}</option>)}
                                            <option value="_add_new_" className="text-blue-600 font-semibold">++ Add New Bank ++</option>
                                        </select>
                                        {errors.bankName && <p className="mt-1 text-sm text-red-500">{errors.bankName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cheque Date <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <button type="button" onClick={() => setChequeDatePickerOpen(p => !p)} className={`block w-full text-left ${commonInputClasses} ${errors.chequeDate ? 'border-red-500' : ''}`}>
                                                {formatDateForInput(expense.chequeDate) || 'Select date'}
                                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            </button>
                                            {isChequeDatePickerOpen && <DatePicker value={expense.chequeDate || ''} onChange={d => { setExpense(p => ({...p, chequeDate: d})); setChequeDatePickerOpen(false); }} onClose={() => setChequeDatePickerOpen(false)} />}
                                            {errors.chequeDate && <p className="mt-1 text-sm text-red-500">{errors.chequeDate}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes / Reason</label>
                            <textarea id="notes" name="notes" rows={3} value={expense.notes || ''} onChange={handleChange} className={commonInputClasses} placeholder="e.g., For office stationary" />
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

export default OtherExpenseForm;