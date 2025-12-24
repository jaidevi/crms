
import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, CalendarIcon, PlusIcon, TrashIcon } from './Icons';
import DatePicker from './DatePicker';
import CustomSelect from './CustomSelect';
import AddPurchaseShopModal from './AddPurchaseShopModal';
import AddBankModal from './AddBankModal';
import AddItemModal from './AddItemModal';
import type { PurchaseOrder, PurchaseShop, PONumberConfig, MasterItem, LineItem, PaymentMode, OrderStatus } from '../types';

interface PurchaseOrderFormProps {
    onClose: () => void;
    onSave: (order: PurchaseOrder) => void;
    purchaseShops: PurchaseShop[];
    onAddPurchaseShop: (newShop: Omit<PurchaseShop, 'id'>) => void;
    bankNames: string[];
    onAddBankName: (newBankName: string) => void;
    poNumberConfig: PONumberConfig;
    orderToEdit: PurchaseOrder | null;
    masterItems: MasterItem[];
    onAddMasterItem: (itemData: { name: string, rate: number }) => Promise<MasterItem | null>;
}

const BLANK_ORDER: PurchaseOrder = {
    id: '',
    poNumber: '',
    poDate: new Date().toISOString().split('T')[0],
    shopName: '',
    items: [],
    totalAmount: 0,
    gstNo: '',
    paymentMode: 'Cash',
    status: 'Unpaid',
    paymentTerms: 'Due on receipt',
    referenceId: '',
    bankName: '',
    chequeDate: '',
};

const formatDateForInput = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const parsePaymentTermsToDays = (terms?: string): string => {
    if (!terms) return '';
    if (terms.toLowerCase().includes('due on receipt')) return '0';
    const match = terms.match(/(\d+)/);
    return match ? match[1] : '';
};

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
    onClose, onSave, purchaseShops, onAddPurchaseShop, bankNames, onAddBankName, poNumberConfig, orderToEdit, masterItems, onAddMasterItem
}) => {
    const isEditing = !!orderToEdit;
    
    // State
    const [poNumber, setPoNumber] = useState('');
    const [poDate, setPoDate] = useState(BLANK_ORDER.poDate);
    const [shopName, setShopName] = useState('');
    const [items, setItems] = useState<LineItem[]>([]);
    const [gstNo, setGstNo] = useState('');
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
    const [status, setStatus] = useState<OrderStatus>('Unpaid');
    const [paymentTerms, setPaymentTerms] = useState('Due on receipt');
    const [referenceId, setReferenceId] = useState('');
    const [bankName, setBankName] = useState('');
    const [chequeDate, setChequeDate] = useState('');
    
    // UI State
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [isChequeDatePickerOpen, setChequeDatePickerOpen] = useState(false);
    const [showAddShopModal, setShowAddShopModal] = useState(false);
    const [showAddBankModal, setShowAddBankModal] = useState(false);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (orderToEdit) {
            setPoNumber(orderToEdit.poNumber);
            setPoDate(orderToEdit.poDate);
            setShopName(orderToEdit.shopName);
            setItems(orderToEdit.items);
            setGstNo(orderToEdit.gstNo);
            setPaymentMode(orderToEdit.paymentMode);
            setStatus(orderToEdit.status);
            setPaymentTerms(orderToEdit.paymentTerms || 'Due on receipt');
            setReferenceId(orderToEdit.referenceId || '');
            setBankName(orderToEdit.bankName || '');
            setChequeDate(orderToEdit.chequeDate || '');
        } else {
            setPoNumber(`${poNumberConfig.prefix}${poNumberConfig.nextNumber}`);
            setPoDate(new Date().toISOString().split('T')[0]);
            setShopName('');
            setItems([{ id: Date.now().toString(), name: '', quantity: 1, rate: 0, amount: 0 }]);
            setGstNo('');
            setPaymentMode('Cash');
            setStatus('Unpaid');
            setPaymentTerms('Due on receipt');
            setReferenceId('');
            setBankName('');
            setChequeDate('');
        }
    }, [orderToEdit, poNumberConfig]);

    const handleShopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === '_add_new_') {
            setShowAddShopModal(true);
        } else {
            setShopName(val);
            const shop = purchaseShops.find(s => s.name === val);
            if (shop) {
                setGstNo(shop.gstNo);
                setPaymentTerms(shop.paymentTerms || 'Due on receipt');
            }
        }
    };

    const handleAddItem = () => {
        setItems(prev => [...prev, { id: Date.now().toString(), name: '', quantity: 1, rate: 0, amount: 0 }]);
    };

    const handleRemoveItem = (id: string) => {
        if (items.length > 1) {
            setItems(prev => prev.filter(i => i.id !== id));
        }
    };

    const handleItemChange = (id: string, field: keyof LineItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'quantity' || field === 'rate') {
                    updatedItem.amount = updatedItem.quantity * updatedItem.rate;
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const handleItemNameChange = (id: string, val: string) => {
        if (val === '_add_new_') {
            setShowAddItemModal(true);
            // Ideally we would want to know which row triggered this to auto-select after adding
        } else {
            const masterItem = masterItems.find(m => m.name === val);
            setItems(prev => prev.map(item => {
                if (item.id === id) {
                    return { ...item, name: val, rate: masterItem ? masterItem.rate : item.rate, amount: (masterItem ? masterItem.rate : item.rate) * item.quantity };
                }
                return item;
            }));
        }
    };

    const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.amount, 0), [items]);

    const handleSaveShop = (name: string) => {
        /* FIX: Added missing openingBalance property */
        const newShop: Omit<PurchaseShop, 'id'> = {
            name, phone: '', email: '', address: '', city: '', state: '', pincode: '', gstNo: '', panNo: '', paymentTerms: 'Due on receipt', openingBalance: 0
        };
        onAddPurchaseShop(newShop);
        setShopName(name);
        setShowAddShopModal(false);
    };

    const handleSaveBank = (name: string) => {
        onAddBankName(name);
        setBankName(name);
        setShowAddBankModal(false);
    };
    
    const handleSaveMasterItem = async (itemData: { name: string, rate: number }) => {
        const newItem = await onAddMasterItem(itemData);
        if (newItem) {
            // User can now select it from dropdowns.
        }
        setShowAddItemModal(false);
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!poNumber) newErrors.poNumber = "PO Number is required";
        if (!shopName) newErrors.shopName = "Shop Name is required";
        if (items.some(i => !i.name)) newErrors.items = "All items must have a name";
        if (items.some(i => i.quantity <= 0)) newErrors.items = "Quantity must be > 0";
        
        if (paymentMode === 'Cheque') {
            if (!bankName) newErrors.bankName = "Bank name required for Cheque";
            if (!chequeDate) newErrors.chequeDate = "Cheque date required";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        
        const orderData: PurchaseOrder = {
            id: orderToEdit ? orderToEdit.id : '',
            poNumber,
            poDate,
            shopName,
            items,
            totalAmount,
            gstNo,
            paymentMode,
            status,
            paymentTerms,
            referenceId,
            bankName: paymentMode === 'Cheque' ? bankName : undefined,
            chequeDate: paymentMode === 'Cheque' ? chequeDate : undefined,
        };
        onSave(orderData);
    };

    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500";
    const paymentModeOptions = [
        { value: 'Cash', label: 'Cash' },
        { value: 'Cheque', label: 'Cheque' },
        { value: 'NEFT', label: 'NEFT' },
        { value: 'GPay', label: 'GPay' },
        { value: 'Credit Card', label: 'Credit Card' },
        { value: 'Bank Transfer', label: 'Bank Transfer' },
        { value: 'Other', label: 'Other' }
    ];
    const statusOptions = [
        { value: 'Paid', label: 'Paid' },
        { value: 'Unpaid', label: 'Unpaid' }
    ];

    return (
        <>
            {showAddShopModal && <AddPurchaseShopModal onClose={() => setShowAddShopModal(false)} onSave={handleSaveShop} existingShopNames={purchaseShops.map(s => s.name)} />}
            {showAddBankModal && <AddBankModal onClose={() => setShowAddBankModal(false)} onSave={handleSaveBank} existingBankNames={bankNames} />}
            {showAddItemModal && <AddItemModal onClose={() => setShowAddItemModal(false)} onSave={handleSaveMasterItem} existingItemNames={masterItems.map(i => i.name)} />}

            <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-start p-4 pt-10" role="dialog">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl animate-fade-in-down overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between p-5 border-b shrink-0">
                        <h2 className="text-xl font-bold text-secondary-800">{isEditing ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-secondary-400 hover:bg-secondary-100 hover:text-secondary-600">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-grow space-y-6">
                        {/* PO Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">PO Number</label>
                                <input type="text" value={poNumber} readOnly className={`${commonInputClasses} bg-secondary-50`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Date</label>
                                <div className="relative">
                                    <button type="button" onClick={() => setDatePickerOpen(p => !p)} className={`block w-full text-left ${commonInputClasses}`}>
                                        {formatDateForInput(poDate) || 'Select date'}
                                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                    </button>
                                    {isDatePickerOpen && <DatePicker value={poDate} onChange={d => { setPoDate(d); setDatePickerOpen(false); }} onClose={() => setDatePickerOpen(false)} />}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">Shop Name <span className="text-danger-500">*</span></label>
                                <select value={shopName} onChange={handleShopChange} className={`${commonInputClasses} ${errors.shopName ? 'border-danger-500' : ''}`}>
                                    <option value="">Select a shop</option>
                                    {purchaseShops.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    <option value="_add_new_" className="font-semibold text-primary-600">++ Add New Shop ++</option>
                                </select>
                                {errors.shopName && <p className="text-xs text-danger-500 mt-1">{errors.shopName}</p>}
                            </div>
                        </div>

                        {/* Items */}
                        <div>
                            <h3 className="text-lg font-semibold text-secondary-800 mb-2">Items</h3>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="w-full text-sm text-left text-secondary-500">
                                    <thead className="text-xs text-secondary-700 uppercase bg-secondary-50">
                                        <tr>
                                            <th className="px-4 py-3 w-1/3">Item Name</th>
                                            <th className="px-4 py-3 text-right w-24">Qty</th>
                                            <th className="px-4 py-3 text-right w-32">Rate</th>
                                            <th className="px-4 py-3 text-right w-32">Amount</th>
                                            <th className="px-4 py-3 text-center w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={item.id} className="border-b hover:bg-secondary-50">
                                                <td className="px-4 py-2">
                                                    <select 
                                                        value={item.name} 
                                                        onChange={e => handleItemNameChange(item.id, e.target.value)}
                                                        className="w-full p-2 border rounded focus:ring-primary-500 focus:border-primary-500"
                                                    >
                                                        <option value="">Select Item</option>
                                                        {masterItems.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                                        <option value="_add_new_" className="font-semibold text-primary-600">++ Add New Item ++</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={item.quantity} 
                                                        onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                                                        className="w-full p-2 text-right border rounded focus:ring-primary-500 focus:border-primary-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        step="0.01"
                                                        value={item.rate} 
                                                        onChange={e => handleItemChange(item.id, 'rate', Number(e.target.value))}
                                                        className="w-full p-2 text-right border rounded focus:ring-primary-500 focus:border-primary-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right font-medium text-secondary-900">
                                                    ₹{item.amount.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button onClick={() => handleRemoveItem(item.id)} className="text-secondary-400 hover:text-danger-500 disabled:opacity-50" disabled={items.length === 1}>
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={5} className="px-4 py-3">
                                                <button onClick={handleAddItem} className="flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm">
                                                    <PlusIcon className="w-4 h-4 mr-1" /> Add Line Item
                                                </button>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            {errors.items && <p className="text-xs text-danger-500 mt-1">{errors.items}</p>}
                        </div>

                        {/* Payment Info */}
                        <fieldset className="border border-secondary-200 rounded-lg p-4">
                            <legend className="text-base font-semibold text-secondary-900 px-2">Payment Information</legend>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4">
                                 <div>
                                    <label htmlFor="gstNo" className="block text-sm font-medium text-secondary-700 mb-1">GST NO</label>
                                    <input id="gstNo" type="text" value={gstNo} onChange={e => setGstNo(e.target.value)} className={commonInputClasses} placeholder="Auto-filled from shop" />
                                </div>
                                {status === 'Unpaid' && (
                                    <div>
                                        <label htmlFor="paymentTerms" className="block text-sm font-medium text-secondary-700 mb-1">Payment Terms</label>
                                        <div className="relative">
                                            <input
                                                id="paymentTerms"
                                                type="number"
                                                value={parsePaymentTermsToDays(paymentTerms)}
                                                onChange={e => {
                                                    const value = e.target.value;
                                                    if (value === '') {
                                                        setPaymentTerms('');
                                                        return;
                                                    }
                                                    const numDays = parseInt(value, 10);
                                                    if (!isNaN(numDays)) {
                                                        if (numDays <= 0) {
                                                            setPaymentTerms('Due on receipt');
                                                        } else {
                                                            setPaymentTerms(`Net ${numDays}`);
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
                                )}
                                <div>
                                    <CustomSelect
                                        label="Payment Mode"
                                        options={paymentModeOptions}
                                        value={paymentMode}
                                        onChange={(val) => setPaymentMode(val as PaymentMode)}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="referenceId" className="block text-sm font-medium text-secondary-700 mb-1">Reference ID</label>
                                    <input id="referenceId" type="text" value={referenceId} onChange={e => setReferenceId(e.target.value)} className={commonInputClasses} placeholder="Transaction / Ref ID" />
                                </div>
                                 <div>
                                    <CustomSelect
                                        label="Status"
                                        options={statusOptions}
                                        value={status}
                                        onChange={(val) => setStatus(val as OrderStatus)}
                                    />
                                </div>
                            </div>
                            {paymentMode === 'Cheque' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-secondary-100">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">Bank Name <span className="text-danger-500">*</span></label>
                                        <select value={bankName} onChange={e => {
                                            if (e.target.value === '_add_new_') setShowAddBankModal(true);
                                            else setBankName(e.target.value);
                                        }} className={commonInputClasses}>
                                            <option value="">Select Bank</option>
                                            {bankNames.map(b => <option key={b} value={b}>{b}</option>)}
                                            <option value="_add_new_" className="font-semibold text-primary-600">++ Add New Bank ++</option>
                                        </select>
                                        {errors.bankName && <p className="text-xs text-danger-500 mt-1">{errors.bankName}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">Cheque Date <span className="text-danger-500">*</span></label>
                                        <div className="relative">
                                            <button type="button" onClick={() => setChequeDatePickerOpen(p => !p)} className={`block w-full text-left ${commonInputClasses}`}>
                                                {formatDateForInput(chequeDate) || 'Select date'}
                                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                            </button>
                                            {isChequeDatePickerOpen && <DatePicker value={chequeDate} onChange={d => { setChequeDate(d); setChequeDatePickerOpen(false); }} onClose={() => setChequeDatePickerOpen(false)} />}
                                        </div>
                                        {errors.chequeDate && <p className="text-xs text-danger-500 mt-1">{errors.chequeDate}</p>}
                                    </div>
                                </div>
                            )}
                        </fieldset>

                        <div className="flex justify-end items-center gap-4 p-4 bg-secondary-50 rounded-lg">
                            <span className="text-lg font-semibold text-secondary-700">Total Amount:</span>
                            <span className="text-2xl font-bold text-secondary-900">₹{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-end p-5 border-t bg-gray-50 shrink-0 space-x-3">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-secondary-300 text-secondary-700 rounded-md text-sm font-semibold hover:bg-secondary-50">Cancel</button>
                        <button onClick={handleSave} className="px-5 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-700">
                            {isEditing ? 'Update Order' : 'Save Order'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PurchaseOrderForm;
