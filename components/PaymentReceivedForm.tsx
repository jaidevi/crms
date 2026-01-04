
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CloseIcon, CalendarIcon, ImageIcon, InfoIcon, SearchIcon, ChevronDownIcon, PlusIcon } from './Icons';
import DatePicker from './DatePicker';
import AddShopModal from './AddShopModal';
import type { PaymentReceived, Client, PaymentMode, Invoice } from '../types';

// Helper hook for click outside
const useClickOutside = (ref: React.RefObject<HTMLElement | null>, handler: () => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler();
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

interface PaymentReceivedFormProps {
    onClose: () => void;
    onSave: (payment: PaymentReceived) => void;
    clients: Client[];
    onAddClient: (newClient: Omit<Client, 'id'>) => void;
    paymentToEdit?: PaymentReceived | null;
    invoices: Invoice[];
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

const PaymentReceivedForm: React.FC<PaymentReceivedFormProps> = ({ onClose, onSave, clients, onAddClient, paymentToEdit, invoices }) => {
    const isEditing = !!paymentToEdit;
    const [payment, setPayment] = useState<Omit<PaymentReceived, 'id'>>(BLANK_PAYMENT);
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Searchable dropdown states
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const clientDropdownRef = useRef<HTMLDivElement>(null);
    
    useClickOutside(clientDropdownRef, () => {
        setIsClientDropdownOpen(false);
        setClientSearchTerm('');
    });

    // Track adjustment amounts per invoice in local state
    const [adjustments, setAdjustments] = useState<Record<string, number>>({});

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

    const filteredInvoices = useMemo(() => {
        if (!payment.clientName) return [];
        return invoices.filter(inv => inv.clientName === payment.clientName)
            .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));
    }, [payment.clientName, invoices]);

    const filteredClients = useMemo(() => {
        const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name));
        if (!clientSearchTerm) return sorted;
        const lowerTerm = clientSearchTerm.toLowerCase();
        return sorted.filter(c => c.name.toLowerCase().includes(lowerTerm));
    }, [clients, clientSearchTerm]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setPayment(prev => ({ ...prev, [name]: isNumber ? (value === '' ? 0 : Number(value)) : value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSelectClient = (clientName: string) => {
        if (clientName === '_add_new_') {
            setShowAddClientModal(true);
        } else {
            const selectedClient = clients.find(c => c.name === clientName);
            setPayment(prev => ({ 
                ...prev, 
                clientName: clientName,
                openingBalance: selectedClient ? selectedClient.openingBalance : 0
            }));
            setAdjustments({}); // Reset adjustments on client change
            if (errors.clientName) setErrors(prev => ({ ...prev, clientName: '' }));
        }
        setIsClientDropdownOpen(false);
        setClientSearchTerm('');
    };

    const handleAdjustmentChange = (invoiceId: string, value: string) => {
        const amount = value === '' ? 0 : Number(value);
        const newAdjustments = { ...adjustments, [invoiceId]: amount };
        setAdjustments(newAdjustments);
        
        // Update total amount received based on sum of adjustments
        // FIX: Added explicit type (sum: number) to reduce callback to fix "Operator '+' cannot be applied to types 'unknown' and 'number'"
        const newTotal = Object.values(newAdjustments).reduce((sum: number, val) => sum + (val as number), 0);
        setPayment(prev => ({ ...prev, amount: newTotal }));
    };

    const handleSaveClient = (clientName: string) => {
        const newClient: Omit<Client, 'id'> = { name: clientName, phone: '', email: '', address: '', city: '', state: '', pincode: '', gstNo: '', panNo: '', paymentTerms: 'Due on receipt', openingBalance: 0, processes: [] };
        onAddClient(newClient);
        setPayment(prev => ({ ...prev, clientName, openingBalance: 0 }));
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
        
        // Ensure numeric fields are cast as numbers
        const finalPayment: PaymentReceived = { 
            ...payment, 
            id: paymentToEdit?.id || `pr-temp-${Date.now()}`,
            amount: Number(payment.amount),
            openingBalance: Number(payment.openingBalance)
        } as PaymentReceived;
        
        onSave(finalPayment);
    };

    const modalTitle = isEditing ? 'Edit Payment' : 'Record New Payment';
    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-all";
    const paymentModes: PaymentMode[] = ['Cash', 'Cheque', 'NEFT', 'GPay', 'Credit Card', 'Bank Transfer', 'Other'];

    return (
        <>
            {showAddClientModal && <AddShopModal onClose={() => setShowAddClientModal(false)} onSave={handleSaveClient} existingClientNames={clients.map(c => c.name)} />}
            <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-start p-4 pt-10 sm:pt-20" role="dialog">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl animate-fade-in-down overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b">
                        <h2 className="text-xl font-bold text-secondary-800">{modalTitle}</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                             <div className="lg:col-span-2" ref={clientDropdownRef}>
                                <label htmlFor="clientSearch" className="block text-sm font-medium text-secondary-700 mb-1">Client Name <span className="text-danger-500">*</span></label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        className={`${commonInputClasses} flex items-center justify-between bg-white ${errors.clientName ? 'border-danger-500' : ''}`}
                                        onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                    >
                                        <span className={`block truncate ${payment.clientName ? 'text-secondary-900 font-medium' : 'text-secondary-400'}`}>
                                            {payment.clientName || 'Select a client'}
                                        </span>
                                        <ChevronDownIcon className="h-5 w-5 text-secondary-400" />
                                    </button>

                                    {isClientDropdownOpen && (
                                        <div className="absolute z-50 mt-1 w-full bg-white shadow-2xl max-h-64 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-secondary-200">
                                            <div className="sticky top-0 z-10 bg-white px-2 py-1.5 border-b border-secondary-100">
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                        <SearchIcon className="h-4 w-4 text-secondary-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="block w-full pl-8 pr-3 py-1.5 border border-secondary-300 rounded-md leading-5 bg-white placeholder-secondary-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                                        placeholder="Search client..."
                                                        value={clientSearchTerm}
                                                        onChange={(e) => setClientSearchTerm(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <div
                                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-primary-600 font-bold hover:bg-primary-50 border-b border-secondary-100 flex items-center"
                                                onClick={() => handleSelectClient('_add_new_')}
                                            >
                                                <PlusIcon className="w-4 h-4 mr-2" />
                                                Add New Client
                                            </div>
                                            {filteredClients.map((client) => (
                                                <div
                                                    key={client.id}
                                                    className={`cursor-pointer select-none relative py-2.5 pl-3 pr-9 hover:bg-secondary-50 ${payment.clientName === client.name ? 'text-primary-700 bg-primary-50 font-bold' : 'text-secondary-700'}`}
                                                    onClick={() => handleSelectClient(client.name)}
                                                >
                                                    <span className="block truncate">{client.name}</span>
                                                </div>
                                            ))}
                                            {filteredClients.length === 0 && (
                                                <div className="cursor-default select-none relative py-4 text-secondary-400 text-center italic">
                                                    No matching clients found
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {errors.clientName && <p className="mt-1 text-sm text-danger-500">{errors.clientName}</p>}
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Payment Date <span className="text-danger-500">*</span></label>
                                <div className="relative">
                                    <button type="button" onClick={() => setDatePickerOpen(p => !p)} className={`block w-full text-left ${commonInputClasses}`}>
                                        {formatDateForInput(payment.paymentDate) || 'Select date'}
                                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    </button>
                                    {isDatePickerOpen && <DatePicker value={payment.paymentDate} onChange={d => { setPayment(p => ({...p, paymentDate: d})); setDatePickerOpen(false); }} onClose={() => setDatePickerOpen(false)} />}
                                </div>
                                {errors.paymentDate && <p className="mt-1 text-sm text-danger-500">{errors.paymentDate}</p>}
                            </div>
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-secondary-700 mb-1 font-bold text-primary-700">Amount Received <span className="text-danger-500">*</span></label>
                                <input id="amount" name="amount" type="number" step="0.01" value={payment.amount === 0 ? '' : payment.amount} onChange={handleChange} className={`${commonInputClasses} ${errors.amount ? 'border-danger-500' : ''} bg-primary-50 font-bold border-primary-200 text-lg`} placeholder="0.00" />
                                {errors.amount && <p className="mt-1 text-sm text-danger-500">{errors.amount}</p>}
                            </div>
                        </div>

                        {/* Bill-wise Adjustment Table */}
                        {payment.clientName && (
                            <div className="border border-secondary-200 rounded-lg overflow-hidden animate-fade-in-down shadow-sm">
                                <div className="bg-secondary-50 px-4 py-2 border-b border-secondary-200 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-secondary-700 flex items-center">
                                        <InfoIcon className="w-4 h-4 mr-2" />
                                        Invoice Wise Adjustment
                                    </h3>
                                    <span className="text-[10px] uppercase font-bold text-secondary-400 tracking-wider">Select invoices to adjust payment</span>
                                </div>
                                <table className="w-full text-sm text-left text-secondary-500 border-collapse">
                                    <thead className="text-[11px] text-secondary-600 uppercase bg-white border-b">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 font-bold">Invoice Number</th>
                                            <th scope="col" className="px-6 py-3 text-center font-bold">Invoice Date</th>
                                            <th scope="col" className="px-6 py-3 text-right font-bold">Invoice Amount</th>
                                            <th scope="col" className="px-6 py-3 text-right w-48 font-bold text-primary-600">Payment Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary-100">
                                        {filteredInvoices.length > 0 ? (
                                            filteredInvoices.map((inv) => (
                                                <tr key={inv.id} className="bg-white hover:bg-secondary-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-secondary-900">{inv.invoiceNumber}</td>
                                                    <td className="px-6 py-4 text-center">{formatDateForInput(inv.invoiceDate)}</td>
                                                    <td className="px-6 py-4 text-right font-semibold">₹{inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-6 py-2">
                                                        <div className="flex items-center">
                                                            <span className="text-secondary-400 mr-2">₹</span>
                                                            <input 
                                                                type="number"
                                                                step="0.01"
                                                                value={adjustments[inv.id] || ''}
                                                                onChange={(e) => handleAdjustmentChange(inv.id, e.target.value)}
                                                                className="w-full px-3 py-1.5 text-right text-sm border border-secondary-200 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-bold text-primary-700"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-10 text-center text-secondary-400 italic">
                                                    No outstanding invoices found for this client.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="paymentMode" className="block text-sm font-medium text-secondary-700 mb-1">Payment Mode</label>
                                <select id="paymentMode" name="paymentMode" value={payment.paymentMode} onChange={handleChange} className={commonInputClasses}>
                                    {paymentModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="referenceNumber" className="block text-sm font-medium text-secondary-700 mb-1">Reference #</label>
                                <input id="referenceNumber" name="referenceNumber" type="text" value={payment.referenceNumber || ''} onChange={handleChange} className={commonInputClasses} placeholder="e.g., Cheque No., UPI ID" />
                            </div>
                            <div className="lg:col-span-3">
                                <label htmlFor="notes" className="block text-sm font-medium text-secondary-700 mb-1">Notes</label>
                                <textarea id="notes" name="notes" rows={2} value={payment.notes || ''} onChange={handleChange} className={commonInputClasses} placeholder="Any additional details..." />
                            </div>
                            
                            <div className="lg:col-span-3">
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Payment Proof Image</label>
                                <input type="file" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" />
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-secondary-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary-50 transition-colors min-h-[100px]"
                                >
                                    {payment.image ? (
                                        <div className="relative w-full h-full flex justify-center">
                                            <img src={payment.image} alt="Payment Proof" className="max-h-40 object-contain rounded shadow-sm" />
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
                    <div className="flex items-center justify-end p-5 bg-secondary-50 border-t space-x-3">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-secondary-300 text-secondary-700 rounded-md text-sm font-semibold hover:bg-secondary-100 transition-colors">Cancel</button>
                        <button onClick={handleSubmit} className="px-6 py-2 bg-primary-600 text-white rounded-md text-sm font-bold hover:bg-primary-700 shadow-md transform active:scale-95 transition-all">
                            {isEditing ? 'Update Payment' : 'Save Payment'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentReceivedForm;
