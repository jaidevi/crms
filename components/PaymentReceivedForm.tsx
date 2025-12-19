import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, CalendarIcon, ImageIcon } from './Icons';
import DatePicker from './DatePicker';
import AddShopModal from './AddShopModal';
import type { PaymentReceived, Client, PaymentMode } from '../types';

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
    openingBalance: 0,
    paymentMode: 'Cash',
    referenceNumber: '',
    notes: '',
    image: '',
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (paymentToEdit) {
            const { id, ...rest } = paymentToEdit;
            setPayment({
                ...BLANK_PAYMENT,
                ...rest
            });
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
        setPayment(prev => ({ ...prev, [name]: isNumber ? (value === '' ? 0 : Number(value)) : value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '_add_new_') {
            setShowAddClientModal(true);
        } else {
            setPayment(prev => ({ ...prev, clientName: value }));
            if (errors.clientName) setErrors(prev => ({ ...prev, clientName: '' }));
        }
    };

    const handleSaveClient = (clientName: string) => {
        const newClient: Omit<Client, 'id'> = { name: clientName, phone: '', email: '', address: '', city: '', state: '', pincode: '', gstNo: '', panNo: '', paymentTerms: 'Due on receipt', processes: [] };
        onAddClient(newClient);
        setPayment(prev => ({ ...prev, clientName }));
        setShowAddClientModal(false);
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

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!payment.clientName) newErrors.clientName = "Client Name is required.";
        if (!payment.paymentDate) newErrors.paymentDate = "Payment Date is required.";
        if (payment.amount <= 0) newErrors.amount = "Amount must be greater than 0.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSave({ ...payment, id: paymentToEdit?.id || `pr-temp-${Date.now()}` });
    };

    const modalTitle = isEditing ? 'Edit Payment' : 'Record New Payment';
    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500";
    const paymentModes: PaymentMode[] = ['Cash', 'Cheque', 'NEFT', 'GPay', 'Credit Card', 'Bank Transfer', 'Other'];

    return (
        <>
            {showAddClientModal && <AddShopModal onClose={() => setShowAddClientModal(false)} onSave={handleSaveClient} existingClientNames={clients.map(c => c.name)} />}
            <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-start p-4 pt-20" role="dialog">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl animate-fade-in-down overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b">
                        <h2 className="text-xl font-bold text-secondary-800">{modalTitle}</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label htmlFor="clientName" className="block text-sm font-medium text-secondary-700 mb-1">Client Name <span className="text-danger-500">*</span></label>
                                <select id="clientName" name="clientName" value={payment.clientName} onChange={handleClientChange} className={`${commonInputClasses} ${errors.clientName ? 'border-danger-500' : ''}`}>
                                    <option value="">Select a client</option>
                                    {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    <option value="_add_new_" className="text-primary-600 font-semibold">++ Add New Client ++</option>
                                </select>
                                {errors.clientName && <p className="mt-1 text-sm text-danger-500">{errors.clientName}</p>}
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Payment Date <span className="text-danger-500">*</span></label>
                                <div className="relative">
                                    <button type="button" onClick={() => setDatePickerOpen(p => !p)} className={`block w-full text-left ${commonInputClasses}`}>
                                        {formatDateForInput(payment.paymentDate) || 'Select date'}
                                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                    </button>
                                    {isDatePickerOpen && <DatePicker value={payment.paymentDate} onChange={d => { setPayment(p => ({...p, paymentDate: d})); setDatePickerOpen(false); }} onClose={() => setDatePickerOpen(false)} />}
                                </div>
                                {errors.paymentDate && <p className="mt-1 text-sm text-danger-500">{errors.paymentDate}</p>}
                            </div>
                            <div>
                                <label htmlFor="openingBalance" className="block text-sm font-medium text-secondary-700 mb-1">Opening Balance</label>
                                <input id="openingBalance" name="openingBalance" type="number" step="0.01" value={payment.openingBalance || ''} onChange={handleChange} className={commonInputClasses} placeholder="0.00" />
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-secondary-700 mb-1">Amount Received <span className="text-danger-500">*</span></label>
                                <input id="amount" name="amount" type="number" step="0.01" value={payment.amount || ''} onChange={handleChange} className={`${commonInputClasses} ${errors.amount ? 'border-danger-500' : ''}`} placeholder="0.00" />
                                {errors.amount && <p className="mt-1 text-sm text-danger-500">{errors.amount}</p>}
                            </div>
                            <div>
                                <label htmlFor="paymentMode" className="block text-sm font-medium text-secondary-700 mb-1">Payment Mode</label>
                                <select id="paymentMode" name="paymentMode" value={payment.paymentMode} onChange={handleChange} className={commonInputClasses}>
                                    {paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-1">
                                <label htmlFor="referenceNumber" className="block text-sm font-medium text-secondary-700 mb-1">Reference #</label>
                                <input id="referenceNumber" name="referenceNumber" type="text" value={payment.referenceNumber || ''} onChange={handleChange} className={commonInputClasses} placeholder="e.g., Cheque No., UPI ID" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="notes" className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
                                <textarea id="notes" name="notes" rows={2} value={payment.notes || ''} onChange={handleChange} className={commonInputClasses} placeholder="Any additional details..." />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Payment Proof Image</label>
                                <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-secondary-300 rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary-50 transition-colors min-h-[120px]"
                                >
                                    {payment.image ? (
                                        <div className="relative w-full h-full flex justify-center">
                                            <img src={payment.image} alt="Payment Proof" className="max-h-40 object-contain rounded" />
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setPayment(p => ({...p, image: ''})); }}
                                                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-danger-50 border border-secondary-200"
                                                title="Remove Image"
                                            >
                                                <CloseIcon className="w-4 h-4 text-danger-500" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-secondary-400 mb-2" />
                                            <span className="text-sm text-secondary-500 text-center">Click to upload payment proof (Cheque image, UPI screenshot, etc.)</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end p-5 bg-gray-50 border-t space-x-3">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-secondary-300 text-secondary-700 rounded-md text-sm font-semibold hover:bg-secondary-50">Cancel</button>
                        <button onClick={handleSubmit} className="px-5 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-700 transition-colors">
                            {isEditing ? 'Update Payment' : 'Save Payment'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentReceivedForm;