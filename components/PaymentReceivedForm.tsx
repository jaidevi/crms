
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
    onSave: (payment: PaymentReceived) => Promise<void> | void;
    clients: Client[];
    onAddClient: (newClient: Omit<Client, 'id'>) => void;
    paymentToEdit?: PaymentReceived | null;
    invoices: Invoice[];
    payments: PaymentReceived[];
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

const PaymentReceivedForm: React.FC<PaymentReceivedFormProps> = ({ onClose, onSave, clients, onAddClient, paymentToEdit, invoices, payments }) => {
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

    const [isSaving, setIsSaving] = useState(false);

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

    // Calculate outstanding balances for initial opening balance and invoices
    const { outstandingInitialBalance, outstandingInvoices } = useMemo(() => {
        if (!payment.clientName) return { outstandingInitialBalance: 0, outstandingInvoices: [] };
        
        const selectedClient = clients.find(c => c.name === payment.clientName);
        if (!selectedClient) return { outstandingInitialBalance: 0, outstandingInvoices: [] };

        // Sort by date ascending for FIFO allocation
        const clientInvoices = invoices.filter(inv => inv.clientName === payment.clientName)
            .sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate));
        
        const clientPayments = payments.filter(p => p.clientName === payment.clientName && (!paymentToEdit || p.id !== paymentToEdit.id));
        const totalPayments = clientPayments.reduce((sum, p) => sum + p.amount, 0);

        let pool = totalPayments;
        
        // 1. Apply to Initial Opening Balance
        const initialBal = selectedClient.openingBalance || 0;
        const remainingInitialBalance = Math.max(0, initialBal - pool);
        pool = Math.max(0, pool - initialBal);

        // 2. Apply to Invoices
        const invoicesWithBalance = [];
        for (const inv of clientInvoices) {
            const remainingInvoiceBalance = Math.max(0, inv.totalAmount - pool);
            pool = Math.max(0, pool - inv.totalAmount);
            
            if (remainingInvoiceBalance > 0) {
                invoicesWithBalance.push({
                    ...inv,
                    outstandingAmount: remainingInvoiceBalance
                });
            }
        }

        return { 
            outstandingInitialBalance: remainingInitialBalance, 
            outstandingInvoices: invoicesWithBalance 
        };
    }, [payment.clientName, clients, invoices, payments, paymentToEdit]);

    const filteredClients = useMemo(() => {
        // Show last added client first (insertion order reverse)
        const reversed = [...clients].reverse();
        if (!clientSearchTerm) return reversed;
        const lowerTerm = clientSearchTerm.toLowerCase();
        return reversed.filter(c => c.name.toLowerCase().includes(lowerTerm));
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
            if (selectedClient) {
                const clientInvoices = invoices.filter(inv => inv.clientName === clientName);
                const clientPayments = payments.filter(p => p.clientName === clientName && (!paymentToEdit || p.id !== paymentToEdit.id));
                
                const totalInvoices = clientInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
                const totalPayments = clientPayments.reduce((sum, p) => sum + p.amount, 0);
                
                // Formula: Initial Opening Balance + Total Invoices - Total Payments
                const calculatedOpeningBalance = (selectedClient.openingBalance || 0) + totalInvoices - totalPayments;

                setPayment(prev => ({ 
                    ...prev, 
                    clientName: clientName,
                    openingBalance: calculatedOpeningBalance
                }));
            }
            setAdjustments({}); // Reset adjustments on client change
            if (errors.clientName) setErrors(prev => ({ ...prev, clientName: '' }));
        }
        setIsClientDropdownOpen(false);
        setClientSearchTerm('');
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === '' ? 0 : Number(e.target.value);
        setPayment(prev => ({ ...prev, amount: value }));
        
        // Waterfall logic: Apply to Initial Opening Balance first, then to Invoices
        const newAdjustments: Record<string, number> = {};
        let remaining = value;

        // 1. Apply to Initial Opening Balance
        if (outstandingInitialBalance > 0) {
            const toOpening = Math.min(remaining, outstandingInitialBalance);
            newAdjustments['opening_balance'] = toOpening;
            remaining = Math.max(0, remaining - toOpening);
        } else {
            newAdjustments['opening_balance'] = 0;
        }

        // 2. Apply to Outstanding Invoices (Oldest First)
        for (const inv of outstandingInvoices) {
            if (remaining <= 0) {
                newAdjustments[inv.id] = 0;
                continue;
            }
            const toInv = Math.min(remaining, inv.outstandingAmount);
            newAdjustments[inv.id] = toInv;
            remaining = Math.max(0, remaining - toInv);
        }
        setAdjustments(newAdjustments);
    };

    const handleAdjustmentChange = (id: string, value: string) => {
        const amount = value === '' ? 0 : Number(value);
        const newAdjustments = { ...adjustments, [id]: amount };
        setAdjustments(newAdjustments);
        
        // Total amount is the sum of all adjustments (including opening balance)
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

    const handleSubmit = async () => {
        if (!validate() || isSaving) return;
        
        setIsSaving(true);
        try {
            // Ensure numeric fields are cast as numbers
            const finalPayment: PaymentReceived = { 
                ...payment, 
                id: paymentToEdit?.id || `pr-temp-${Date.now()}`,
                amount: Number(payment.amount),
                openingBalance: Number(payment.openingBalance)
            } as PaymentReceived;
            
            await onSave(finalPayment);
        } catch (error) {
            console.error("Error saving payment:", error);
            setIsSaving(false);
        }
    };

    const modalTitle = isEditing ? 'Edit Payment' : 'Record New Payment';
    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-all";
    const paymentModes: PaymentMode[] = ['Cash', 'Cheque', 'NEFT', 'GPay', 'Credit Card', 'Bank Transfer', 'Other'];

    return (
        <>
            {showAddClientModal && <AddShopModal onClose={() => setShowAddClientModal(false)} onSave={handleSaveClient} existingClientNames={clients.map(c => c.name)} />}
            <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4" role="dialog">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-full flex flex-col animate-fade-in-down overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
                        <h2 className="text-xl font-bold text-secondary-800">{modalTitle}</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto space-y-6 flex-1">
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
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="amount" className="block text-sm font-medium text-secondary-700 font-bold text-primary-700">Amount Received <span className="text-danger-500">*</span></label>
                                    {payment.clientName && (
                                        <span className="text-xs font-semibold text-secondary-500">
                                            Total Balance: <span className={payment.openingBalance > 0 ? 'text-danger-600' : 'text-success-600'}>₹{payment.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </span>
                                    )}
                                </div>
                                <input 
                                    id="amount" 
                                    name="amount" 
                                    type="number" 
                                    step="0.01" 
                                    value={payment.amount === 0 ? '' : payment.amount} 
                                    onChange={handleAmountChange} 
                                    className={`${commonInputClasses} ${errors.amount ? 'border-danger-500' : ''} bg-primary-50 font-bold border-primary-200 text-lg`} 
                                    placeholder="0.00" 
                                />
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
                                            <th scope="col" className="px-6 py-3 text-right font-bold">Outstanding Amount</th>
                                            <th scope="col" className="px-6 py-3 text-right w-48 font-bold text-primary-600">Payment Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary-100">
                                        {outstandingInitialBalance > 0.01 && (
                                            <tr className="bg-primary-50/30 hover:bg-primary-50 transition-colors border-b border-primary-100">
                                                <td className="px-6 py-4 font-bold text-primary-800">Total Balance</td>
                                                <td className="px-6 py-4 text-center text-secondary-400">-</td>
                                                <td className="px-6 py-4 text-right font-semibold text-primary-700">₹{outstandingInitialBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                <td className="px-6 py-2">
                                                    <div className="flex items-center">
                                                        <span className="text-primary-400 mr-2">₹</span>
                                                        <input 
                                                            type="number"
                                                            step="0.01"
                                                            value={adjustments['opening_balance'] || ''}
                                                            onChange={(e) => handleAdjustmentChange('opening_balance', e.target.value)}
                                                            className="w-full px-3 py-1.5 text-right text-sm border border-primary-200 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-bold text-primary-700 bg-white"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {outstandingInvoices.length > 0 ? (
                                            outstandingInvoices.map((inv) => (
                                                <tr key={inv.id} className="bg-white hover:bg-secondary-50 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-secondary-900">{inv.invoiceNumber}</td>
                                                    <td className="px-6 py-4 text-center">{formatDateForInput(inv.invoiceDate)}</td>
                                                    <td className="px-6 py-4 text-right font-semibold">₹{inv.outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
                                            outstandingInitialBalance <= 0.01 && (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-10 text-center text-secondary-400 italic">
                                                        No outstanding invoices found for this client.
                                                    </td>
                                                </tr>
                                            )
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
                    <div className="flex items-center justify-end p-5 bg-secondary-50 border-t space-x-3 flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-secondary-300 text-secondary-700 rounded-md text-sm font-semibold hover:bg-secondary-100 transition-colors">Cancel</button>
                        <button 
                            type="button" 
                            onClick={handleSubmit} 
                            disabled={isSaving}
                            className={`px-6 py-2 bg-primary-600 text-white rounded-md text-sm font-bold shadow-md transform transition-all ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-700 active:scale-95'}`}
                        >
                            {isSaving ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </div>
                            ) : (
                                isEditing ? 'Update Payment' : 'Save Payment'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PaymentReceivedForm;
