
import React, { useState, useEffect } from 'react';
import { CloseIcon, CalendarIcon } from './Icons';
import DatePicker from './DatePicker';
import AddShopModal from './AddShopModal'; // Re-using for adding clients quickly
import type { PaymentReceived, Client, PaymentMode } from '../App';

interface PaymentReceivedFormProps {
    onClose: () => void;
    onSave: (payment: PaymentReceived) => void;
    clients: Client[];
    onAddClient: (newClient: Omit<Client, 'id'>) => void;
    paymentToEdit?: PaymentReceived | null;
}

const BLANK_PAYMENT: Omit<PaymentReceived, 'id'> = {
    clientName: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMode: 'Cash',
    referenceNumber: '',
    notes: '',
};

const formatDateForInput = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const PaymentReceivedForm: React.FC<PaymentReceivedFormProps> = ({ onClose, onSave, clients, onAddClient, paymentToEdit }) => {
    const isEditing = !!paymentToEdit;
    const [payment, setPayment] = useState<Omit<PaymentReceived, 'id'>>(BLANK_PAYMENT);
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (paymentToEdit) {
            const { id, ...rest } = paymentToEdit;
            setPayment(rest);
        } else {
            setPayment({
                ...BLANK_PAYMENT,
                paymentDate: new Date().toISOString().split('T')[0],
                clientName: '',
            });
        }
    }, [paymentToEdit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setPayment(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '_add_new_') {
            setShowAddClientModal(true);
        } else {
            handleChange(e);
        }
    };

    const handleSaveClient = (clientName: string) => {
        const newClient: Omit<Client, 'id'> = { name: clientName, phone: '', email: '', address: '', city: '', state: '', pincode: '', gstNo: '', panNo: '', paymentTerms: 'Due on receipt', processes: [] };
        onAddClient(newClient);
        setPayment(prev => ({ ...prev, clientName }));
        setShowAddClientModal(false);
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!payment.clientName) newErrors.clientName = "Client Name is required.";
        if (!payment.paymentDate) newErrors.paymentDate = "Payment Date is required.";
        if (payment.amount <= 0) newErrors.amount = "Amount must be a positive number.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSave({ ...payment, id: paymentToEdit?.id || `pr-temp-${Date.now()}` });
    };

    const modalTitle = isEditing ? 'Edit Payment' : 'Record New Payment';
    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
    const paymentModes: PaymentMode[] = ['Cash', 'Cheque', 'NEFT', 'GPay', 'Credit Card', 'Bank Transfer', 'Other'];

    return (
        <>
            {showAddClientModal && <AddShopModal onClose={() => setShowAddClientModal(false)} onSave={handleSaveClient} existingClientNames={clients.map(c => c.name)} />}
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
                                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">Client Name <span className="text-red-500">*</span></label>
                                <select id="clientName" name="clientName" value={payment.clientName} onChange={handleClientChange} className={`${commonInputClasses} ${errors.clientName ? 'border-red-500' : ''}`}>
                                    <option value="">Select a client</option>
                                    {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    <option value="_add_new_">++ Add New Client ++</option>
                                </select>
                                {errors.clientName && <p className="mt-1 text-sm text-red-500">{errors.clientName}</p>}
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <button type="button" onClick={() => setDatePickerOpen(p => !p)} className={`block w-full text-left ${commonInputClasses}`}>
                                        {formatDateForInput(payment.paymentDate) || 'Select date'}
                                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    </button>
                                    {isDatePickerOpen && <DatePicker value={payment.paymentDate} onChange={d => { setPayment(p => ({...p, paymentDate: d})); setDatePickerOpen(false); }} onClose={() => setDatePickerOpen(false)} />}
                                </div>
                                {errors.paymentDate && <p className="mt-1 text-sm text-red-500">{errors.paymentDate}</p>}
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                                <input id="amount" name="amount" type="number" value={payment.amount || ''} onChange={handleChange} className={`${commonInputClasses} ${errors.amount ? 'border-red-500' : ''}`} placeholder="0.00" />
                                {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
                            </div>
                            <div>
                                <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                                <select id="paymentMode" name="paymentMode" value={payment.paymentMode} onChange={handleChange} className={commonInputClasses}>
                                    {paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 mb-1">Reference #</label>
                                <input id="referenceNumber" name="referenceNumber" type="text" value={payment.referenceNumber || ''} onChange={handleChange} className={commonInputClasses} placeholder="e.g., Cheque No., UPI ID" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea id="notes" name="notes" rows={3} value={payment.notes || ''} onChange={handleChange} className={commonInputClasses} placeholder="Any additional details..." />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end p-5 bg-gray-50 border-t space-x-3">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSubmit} className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">
                            {isEditing ? 'Update Payment' : 'Save Payment'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentReceivedForm;
