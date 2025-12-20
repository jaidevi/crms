
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { CloseIcon, CalendarIcon, ImageIcon } from './Icons';
import DatePicker from './DatePicker';
import type { SupplierPayment, PurchaseShop, SupplierPaymentNumberConfig, PaymentMode, TimberExpense } from '../types';

interface TimberPaymentFormProps {
    onClose: () => void;
    onSave: (payment: Omit<SupplierPayment, 'id'>) => void;
    suppliers: PurchaseShop[];
    paymentConfig: SupplierPaymentNumberConfig;
    timberExpenses: TimberExpense[];
    supplierPayments: SupplierPayment[];
}

const formatDateForInput = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const TimberPaymentForm: React.FC<TimberPaymentFormProps> = ({ onClose, onSave, suppliers, paymentConfig, timberExpenses, supplierPayments }) => {
    const [payment, setPayment] = useState<Omit<SupplierPayment, 'id'>>({
        paymentNumber: `${paymentConfig.prefix}${String(paymentConfig.nextNumber).padStart(4, '0')}`,
        date: new Date().toISOString().split('T')[0],
        supplierName: '',
        amount: 0,
        paymentMode: 'Cash',
        referenceId: '',
        image: '',
    });
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Calculate Outstanding and Balance including Opening Balance
    const outstandingAmount = useMemo(() => {
        if (!payment.supplierName) return 0;
        
        const totalLiability = timberExpenses
            .filter(e => e.supplierName === payment.supplierName)
            .reduce((sum, e) => sum + (e.amount || 0) + (e.openingBalance || 0), 0);
            
        const totalPaid = supplierPayments
            .filter(p => p.supplierName === payment.supplierName)
            .reduce((sum, p) => sum + (p.amount || 0), 0);
            
        return Math.max(0, totalLiability - totalPaid);
    }, [payment.supplierName, timberExpenses, supplierPayments]);

    const balanceAmount = useMemo(() => {
        return Math.max(0, outstandingAmount - (payment.amount || 0));
    }, [outstandingAmount, payment.amount]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPayment(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
             setPayment(prev => ({ ...prev, amount: Number(value) }));
             if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setPayment(prev => ({ ...prev, image: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!payment.date) newErrors.date = "Date is required.";
        if (!payment.supplierName) newErrors.supplierName = "Supplier is required.";
        if (payment.amount <= 0) newErrors.amount = "Amount must be positive.";
        if (!payment.paymentMode) newErrors.paymentMode = "Payment mode is required.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSave(payment);
            onClose();
        }
    };

    const paymentModes: PaymentMode[] = ['Cash', 'Cheque', 'NEFT', 'GPay', 'Credit Card', 'Bank Transfer', 'Other'];
    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-start p-4 pt-20" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg animate-fade-in-down overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Record Supplier Payment</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Voucher No</label>
                            <input type="text" value={payment.paymentNumber} readOnly className={`${commonInputClasses} bg-gray-100 text-gray-500`} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <button type="button" onClick={() => setDatePickerOpen(p => !p)} className={`block w-full text-left ${commonInputClasses}`}>
                                    {formatDateForInput(payment.date) || 'Select date'}
                                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </button>
                                {isDatePickerOpen && <DatePicker value={payment.date} onChange={d => { setPayment(p => ({...p, date: d})); setDatePickerOpen(false); }} onClose={() => setDatePickerOpen(false)} />}
                            </div>
                            {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name <span className="text-red-500">*</span></label>
                            <select name="supplierName" value={payment.supplierName} onChange={handleChange} className={`${commonInputClasses} ${errors.supplierName ? 'border-red-500' : ''}`}>
                                <option value="">Select Supplier</option>
                                {suppliers.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            {errors.supplierName && <p className="mt-1 text-sm text-red-500">{errors.supplierName}</p>}
                            {payment.supplierName && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Outstanding: <span className="font-semibold text-gray-700">₹{outstandingAmount.toFixed(2)}</span>
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount <span className="text-red-500">*</span></label>
                            <input type="number" value={payment.amount || ''} onChange={handleAmountChange} className={`${commonInputClasses} ${errors.amount ? 'border-red-500' : ''}`} placeholder="0.00" />
                            {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Balance Amount</label>
                            <input 
                                type="text" 
                                value={`₹${balanceAmount.toFixed(2)}`} 
                                readOnly 
                                className={`${commonInputClasses} bg-gray-100 font-semibold ${balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`} 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode <span className="text-red-500">*</span></label>
                            <select name="paymentMode" value={payment.paymentMode} onChange={handleChange} className={commonInputClasses}>
                                {paymentModes.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reference ID</label>
                            <input type="text" name="referenceId" value={payment.referenceId} onChange={handleChange} className={commonInputClasses} placeholder="Txn / Cheque No" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Image</label>
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            {payment.image ? (
                                <div className="relative w-full h-32">
                                    <img src={payment.image} alt="Payment Proof" className="w-full h-full object-contain" />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setPayment(p => ({...p, image: ''})); }}
                                        className="absolute top-0 right-0 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                                    >
                                        <CloseIcon className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-500">Click to upload payment proof</span>
                                </>
                            )}
                        </div>
                    </div>

                </div>
                <div className="flex items-center justify-end p-5 bg-gray-50 border-t space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50">Cancel</button>
                    <button onClick={handleSubmit} className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">Save Payment</button>
                </div>
            </div>
        </div>
    );
};

export default TimberPaymentForm;
