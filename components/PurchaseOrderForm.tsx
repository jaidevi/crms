import React, { useState, useMemo, useEffect } from 'react';
import { CloseIcon, PlusIcon, TrashIcon, CalendarIcon, QuestionMarkIcon } from './Icons';
import type { PurchaseOrder, LineItem, PaymentMode, OrderStatus, PurchaseShop, PONumberConfig, MasterItem } from '../App';
import PurchaseShopModal from './PurchaseShopModal';
import AddBankModal from './AddBankModal';
import DatePicker from './DatePicker';
import AddItemModal from './AddItemModal';
import CustomSelect from './CustomSelect';

interface PurchaseOrderFormProps {
    onClose: () => void;
    onSave: (order: PurchaseOrder) => void;
    purchaseShops: PurchaseShop[];
    onAddPurchaseShop: (newShop: Omit<PurchaseShop, 'id'>) => void;
    bankNames: string[];
    onAddBankName: (newBankName: string) => void;
    poNumberConfig: PONumberConfig;
    orderToEdit?: PurchaseOrder | null;
    masterItems: MasterItem[];
    onAddMasterItem: (itemData: { name: string, rate: number }) => Promise<MasterItem | null>;
}

const formatDateForInput = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

interface FormLabelProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  hasInfo?: boolean;
}

const FormLabel: React.FC<FormLabelProps> = ({ htmlFor, label, required = false, hasInfo = false }) => {
  return (
    <label htmlFor={htmlFor} className="flex items-center text-sm font-medium text-gray-700 mb-1">
      <span>{label}</span>
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {hasInfo && <QuestionMarkIcon className="w-4 h-4 text-gray-400 ml-1" />}
    </label>
  );
};


const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ onClose, onSave, purchaseShops, onAddPurchaseShop, bankNames, onAddBankName, poNumberConfig, orderToEdit, masterItems, onAddMasterItem }) => {
    const isEditing = !!orderToEdit;
    const shopNames = useMemo(() => purchaseShops.map(s => s.name), [purchaseShops]);
    
    // Form State
    const [poSequentialNumber, setPoSequentialNumber] = useState('');
    const [shopName, setShopName] = useState('');
    const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [gstNo, setGstNo] = useState('');
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
    const [status, setStatus] = useState<OrderStatus>('Unpaid');
    const [paymentTerms, setPaymentTerms] = useState('Due on receipt');
    const [bankName, setBankName] = useState('');
    const [chequeDate, setChequeDate] = useState('');
    
    // UI State
    const [showAddShopModal, setShowAddShopModal] = useState(false);
    const [showAddBankModal, setShowAddBankModal] = useState(false);
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [editingLineItemId, setEditingLineItemId] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isPoDatePickerOpen, setPoDatePickerOpen] = useState(false);
    const [isChequeDatePickerOpen, setChequeDatePickerOpen] = useState(false);

    // Effect to pre-fill form for editing or set defaults for new
    useEffect(() => {
        if (orderToEdit) {
            setShopName(orderToEdit.shopName);
            setPoDate(orderToEdit.poDate);
            // Assign new temporary IDs for React keys to avoid issues
            setLineItems(orderToEdit.items.map(item => ({ ...item, id: `item-${Date.now()}-${Math.random()}` })));
            setGstNo(orderToEdit.gstNo);
            setPaymentMode(orderToEdit.paymentMode);
            setStatus(orderToEdit.status);
            setPaymentTerms(orderToEdit.paymentTerms || 'Due on receipt');
            setBankName(orderToEdit.bankName || '');
            setChequeDate(orderToEdit.chequeDate || '');
            const seqNum = orderToEdit.poNumber.split('-').pop() || '';
            setPoSequentialNumber(seqNum);
        } else {
            // Reset form for a new entry
            setShopName('');
            setPoDate(new Date().toISOString().split('T')[0]);
            setLineItems([]);
            setGstNo('');
            setPaymentMode('Cash');
            setStatus('Unpaid');
            setPaymentTerms('Due on receipt');
            setBankName('');
            setChequeDate('');
            setErrors({});
            setPoSequentialNumber(String(poNumberConfig.nextNumber).padStart(4, '0'));
        }
    }, [orderToEdit, poNumberConfig]);

    // Auto-fill GST & Payment Terms when shop changes
    useEffect(() => {
        const selectedShop = purchaseShops.find(s => s.name === shopName);
        if (selectedShop) {
            setGstNo(selectedShop.gstNo || '');
            setPaymentTerms(selectedShop.paymentTerms || 'Due on receipt');
        } else {
            setGstNo('');
            setPaymentTerms('Due on receipt');
        }
    }, [shopName, purchaseShops]);


    const addLineItem = () => {
        if (errors.lineItems) setErrors(prev => ({ ...prev, lineItems: '' }));
        const newItem: LineItem = {
            id: `item-${Date.now()}-${Math.random()}`,
            name: '',
            description: '',
            quantity: 1,
            rate: 0,
            amount: 0,
        };
        setLineItems(prevItems => [...prevItems, newItem]);
    };

    const updateLineItem = (id: string, updates: Partial<Omit<LineItem, 'id' | 'amount'>>) => {
        // Clear errors for the field being updated
        if ((updates.quantity !== undefined && errors[`quantity_${id}`]) || (updates.rate !== undefined && errors[`rate_${id}`])) {
            setErrors(prev => {
                const newErrors = { ...prev };
                if (updates.quantity !== undefined) delete newErrors[`quantity_${id}`];
                if (updates.rate !== undefined) delete newErrors[`rate_${id}`];
                return newErrors;
            });
        }
        
        setLineItems(prevItems =>
            prevItems.map(item => {
                if (item.id === id) {
                    const updatedItem = { ...item, ...updates };
                    
                    // Recalculate amount
                    const quantity = Math.max(0, Number(updatedItem.quantity));
                    const rate = Math.max(0, Number(updatedItem.rate));
                    updatedItem.quantity = quantity;
                    updatedItem.rate = rate;
                    updatedItem.amount = quantity * rate;
                    
                    return updatedItem;
                }
                return item;
            })
        );
    };

    const removeLineItem = (id: string) => {
        setLineItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    const totalAmount = useMemo(() => {
        return lineItems.reduce((total, item) => total + item.amount, 0);
    }, [lineItems]);

    const handleSequentialNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numericValue = value.replace(/[^0-9]/g, '');
        setPoSequentialNumber(numericValue);
    };

    const handleSequentialNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value) {
            const paddedValue = value.padStart(4, '0');
            setPoSequentialNumber(paddedValue);
        }
    };

    const handleSubmit = () => {
        const newErrors: { [key: string]: string } = {};
        if (!shopName) newErrors.shopName = 'Shop Name is required.';
        if (!poDate) newErrors.poDate = 'Date is required.';
        if (paymentMode === 'Cheque') {
            if (!bankName) newErrors.bankName = 'Bank Name is required.';
            if (!chequeDate) newErrors.chequeDate = 'Cheque Date is required.';
        }

        const validLineItems = lineItems.filter(item => item.name.trim() !== '');
        if (validLineItems.length === 0) {
            newErrors.lineItems = 'Please add at least one line item with a name.';
        } else {
            validLineItems.forEach((item) => {
                if (item.quantity <= 0) newErrors[`quantity_${item.id}`] = `Must be positive.`;
                if (item.rate <= 0) newErrors[`rate_${item.id}`] = `Must be positive.`;
            });
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        const poNumber = isEditing 
            ? orderToEdit.poNumber 
            : `${poNumberConfig.prefix}-${poSequentialNumber}`;

        const orderData: PurchaseOrder = {
            id: orderToEdit?.id || `po-temp-${Date.now()}`,
            poNumber,
            poDate,
            shopName,
            items: validLineItems.map(({id, ...rest}, index) => ({...rest, id: (index + 1).toString()})),
            totalAmount,
            gstNo,
            paymentMode,
            status,
            paymentTerms,
            ...(paymentMode === 'Cheque' && { bankName, chequeDate }),
        };
        onSave(orderData);
    };
    
    const handleSaveShop = (newShop: Omit<PurchaseShop, 'id'>) => {
        onAddPurchaseShop(newShop);
        setShopName(newShop.name);
        setShowAddShopModal(false);
    };

    const handleSaveBank = (newBank: string) => {
        onAddBankName(newBank);
        setBankName(newBank);
        setShowAddBankModal(false);
    };
    
    const handleMainShopNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (errors.shopName) setErrors(prev => ({...prev, shopName: ''}));
        if (value === '_add_new_') {
            setShowAddShopModal(true);
        } else {
            setShopName(value);
        }
    };

    const handleBankNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (errors.bankName) setErrors(prev => ({...prev, bankName: ''}));
        if (value === '_add_new_') {
            setShowAddBankModal(true);
        } else {
            setBankName(value);
        }
    };

    const handleItemSelection = (lineItemId: string, selectedValue: string) => {
        if (selectedValue === '_add_new_') {
            setEditingLineItemId(lineItemId);
            setShowAddItemModal(true);
        } else {
            const selectedItem = masterItems.find(i => i.name === selectedValue);
            if (selectedItem) {
                updateLineItem(lineItemId, {
                    name: selectedItem.name,
                    rate: selectedItem.rate
                });
            } else {
                updateLineItem(lineItemId, { name: '' });
            }
        }
    };
    
    const handleSaveNewItem = async (itemData: { name: string, rate: number }) => {
        const newItem = await onAddMasterItem(itemData);
        if (newItem && editingLineItemId) {
            // Update the line item that triggered the modal
            updateLineItem(editingLineItemId, {
                name: newItem.name,
                rate: newItem.rate
            });
        }
        setShowAddItemModal(false);
        setEditingLineItemId(null);
    };

    const paymentTermOptions = useMemo(() => {
        const options = ['Due on receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60'];
        if (paymentTerms && !options.includes(paymentTerms)) {
            return [paymentTerms, ...options];
        }
        return options;
    }, [paymentTerms]);

    const paymentModeOptions = [
        { value: 'Cash', label: 'Cash' },
        { value: 'Cheque', label: 'Cheque' },
        { value: 'NEFT', label: 'NEFT' },
        { value: 'GPay', label: 'GPay' },
        { value: 'Credit Card', label: 'Credit Card' },
        { value: 'Bank Transfer', label: 'Bank Transfer' },
        { value: 'Other', label: 'Other' },
    ];

    const statusOptions = [
        { value: 'Unpaid', label: 'Unpaid' },
        { value: 'Paid', label: 'Paid' },
    ];

    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";

    const modalTitle = isEditing ? 'Edit Purchase Order' : 'Create New Purchase Order';
    const saveButtonText = isEditing ? 'Update Purchase Order' : 'Create Purchase Order';

    return (
        <>
            {showAddShopModal && <PurchaseShopModal onClose={() => setShowAddShopModal(false)} onSave={handleSaveShop} existingShopNames={shopNames} />}
            {showAddBankModal && <AddBankModal onClose={() => setShowAddBankModal(false)} onSave={handleSaveBank} existingBankNames={bankNames} />}
            {showAddItemModal && <AddItemModal onClose={() => setShowAddItemModal(false)} onSave={handleSaveNewItem} existingItemNames={masterItems.map(i => i.name)} />}
            <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-start p-4 pt-20" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl animate-fade-in-down overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-gray-200">
                        <h2 id="modal-title" className="text-xl font-bold text-gray-800">
                            {modalTitle}
                        </h2>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700 mb-1">PO Number</label>
                                <div className={`flex items-center w-full text-sm rounded-md border shadow-sm overflow-hidden ${isEditing ? 'bg-gray-100 border-gray-200' : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'}`}>
                                    <span className="px-3 py-2.5 bg-gray-50 text-gray-500 border-r border-gray-300 whitespace-nowrap">
                                        {isEditing && orderToEdit ? orderToEdit.poNumber.slice(0, -4) : `${poNumberConfig.prefix}-`}
                                    </span>
                                    <input
                                        type="text"
                                        id="poNumber"
                                        value={poSequentialNumber}
                                        onChange={handleSequentialNumberChange}
                                        onBlur={handleSequentialNumberBlur}
                                        readOnly={isEditing}
                                        className={`flex-1 min-w-0 block w-full px-3 py-2.5 border-0 focus:ring-0 sm:text-sm ${isEditing ? 'bg-gray-100 text-gray-500' : ''}`}
                                        aria-label="Purchase Order Number"
                                    />
                                </div>
                            </div>
                            <div>
                                <FormLabel htmlFor="shopName" label="Shop Name" required />
                                <select id="shopName" value={shopName} onChange={handleMainShopNameChange} className={`${commonInputClasses} ${errors.shopName ? 'border-red-500' : ''}`}>
                                    <option value="" disabled>Select a shop</option>
                                    {shopNames.map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="_add_new_" className="text-blue-600 font-semibold">++ Add New Shop ++</option>
                                </select>
                                {errors.shopName && <p className="mt-1 text-sm text-red-500">{errors.shopName}</p>}
                            </div>
                           <div>
                                <FormLabel htmlFor="po-date-picker" label="Date" required />
                                <div className="relative">
                                    <button
                                        type="button"
                                        id="po-date-picker"
                                        onClick={() => setPoDatePickerOpen(prev => !prev)}
                                        className={`block w-full text-sm rounded-md border shadow-sm bg-white px-3 py-2.5 flex items-center justify-between text-left font-normal ${errors.poDate ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <span className={poDate ? 'text-gray-900' : 'text-gray-500'}>
                                            {formatDateForInput(poDate) || 'Select a date'}
                                        </span>
                                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                                    </button>
                                    {isPoDatePickerOpen && (
                                        <DatePicker
                                            value={poDate}
                                            onChange={(date) => {
                                                setPoDate(date);
                                                if (errors.poDate) setErrors(prev => ({...prev, poDate: ''}));
                                                setPoDatePickerOpen(false);
                                            }}
                                            onClose={() => setPoDatePickerOpen(false)}
                                        />
                                    )}
                                </div>
                                {errors.poDate && <p className="mt-1 text-sm text-red-500">{errors.poDate}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                             <div>
                                <label htmlFor="gstNo" className="block text-sm font-medium text-gray-700 mb-1">GST NO</label>
                                <input id="gstNo" type="text" value={gstNo} onChange={e => setGstNo(e.target.value)} className={commonInputClasses} placeholder="Auto-filled from shop" />
                            </div>
                            <div>
                                <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                                <select id="paymentTerms" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} className={commonInputClasses}>
                                    {paymentTermOptions.map(term => (
                                        <option key={term} value={term}>{term}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <CustomSelect
                                    label="Payment Mode"
                                    options={paymentModeOptions}
                                    value={paymentMode}
                                    onChange={(val) => setPaymentMode(val as PaymentMode)}
                                />
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
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                                <div>
                                    <FormLabel htmlFor="bankName" label="Bank Name" required />
                                    <select id="bankName" value={bankName} onChange={handleBankNameChange} className={`${commonInputClasses} ${errors.bankName ? 'border-red-500' : ''}`}>
                                        <option value="" disabled>Select a bank</option>
                                        {bankNames.map(b => <option key={b} value={b}>{b}</option>)}
                                        <option value="_add_new_" className="text-blue-600 font-semibold">++ Add New Bank ++</option>
                                    </select>
                                     {errors.bankName && <p className="mt-1 text-sm text-red-500">{errors.bankName}</p>}
                                </div>
                                <div>
                                    <FormLabel htmlFor="cheque-date-picker" label="Cheque Date" required />
                                    <div className="relative">
                                        <button
                                            type="button"
                                            id="cheque-date-picker"
                                            onClick={() => setChequeDatePickerOpen(prev => !prev)}
                                            className={`block w-full text-sm rounded-md border shadow-sm bg-white px-3 py-2.5 flex items-center justify-between text-left font-normal ${errors.chequeDate ? 'border-red-500' : 'border-gray-300'}`}
                                        >
                                            <span className={chequeDate ? 'text-gray-900' : 'text-gray-500'}>
                                                {formatDateForInput(chequeDate) || 'Select a date'}
                                            </span>
                                            <CalendarIcon className="w-5 h-5 text-gray-400" />
                                        </button>
                                        {isChequeDatePickerOpen && (
                                            <DatePicker
                                                value={chequeDate}
                                                onChange={(date) => {
                                                    setChequeDate(date);
                                                    if (errors.chequeDate) setErrors(prev => ({...prev, chequeDate: ''}));
                                                    setChequeDatePickerOpen(false);
                                                }}
                                                onClose={() => setChequeDatePickerOpen(false)}
                                            />
                                        )}
                                    </div>
                                    {errors.chequeDate && <p className="mt-1 text-sm text-red-500">{errors.chequeDate}</p>}
                                </div>
                            </div>
                        )}


                        <div className="space-y-2 pt-4">
                            <h3 className="text-base font-semibold text-gray-800">Line Items <span className="text-red-500">*</span></h3>
                            <div className="grid grid-cols-12 gap-4 px-3 py-2 bg-gray-50 rounded-md text-xs font-medium text-gray-500 tracking-wider uppercase">
                                <div className="col-span-4">Master Item</div>
                                <div className="col-span-3">Description</div>
                                <div className="col-span-1 text-right">Qty</div>
                                <div className="col-span-2 text-right">Rate</div>
                                <div className="col-span-1 text-right">Amount</div>
                                <div className="col-span-1"></div>
                            </div>

                            <div className="space-y-3 pt-2">
                                {lineItems.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-4 items-start">
                                        <div className="col-span-4">
                                            <select value={item.name} onChange={e => handleItemSelection(item.id, e.target.value)} className={commonInputClasses}>
                                                <option value="">Select an item</option>
                                                {masterItems.map(mi => <option key={mi.id} value={mi.name}>{mi.name}</option>)}
                                                <option value="_add_new_" className="text-blue-600 font-semibold">++ Add New Item ++</option>
                                            </select>
                                        </div>
                                        <div className="col-span-3">
                                            <input type="text" value={item.description || ''} onChange={e => updateLineItem(item.id, { description: e.target.value })} placeholder="Description" className={commonInputClasses} aria-label="Item Description" />
                                        </div>
                                        <div className="col-span-1">
                                            <input type="number" value={item.quantity} min="0" onChange={e => updateLineItem(item.id, { quantity: Number(e.target.value) })} className={`${commonInputClasses} text-right ${errors[`quantity_${item.id}`] ? 'border-red-500' : ''}`} aria-label="Quantity" />
                                            {errors[`quantity_${item.id}`] && <p className="mt-1 text-xs text-red-500">{errors[`quantity_${item.id}`]}</p>}
                                        </div>
                                        <div className="col-span-2">
                                            <input type="number" value={item.rate} min="0" step="0.01" onChange={e => updateLineItem(item.id, { rate: Number(e.target.value) })} className={`${commonInputClasses} text-right ${errors[`rate_${item.id}`] ? 'border-red-500' : ''}`} aria-label="Rate" />
                                            {errors[`rate_${item.id}`] && <p className="mt-1 text-xs text-red-500">{errors[`rate_${item.id}`]}</p>}
                                        </div>
                                        <div className="col-span-1 text-right text-sm text-gray-800 font-medium pt-2.5">
                                            ₹{item.amount.toFixed(2)}
                                        </div>
                                        <div className="col-span-1 flex justify-end pt-1.5">
                                            <button onClick={() => removeLineItem(item.id)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50" aria-label="Remove item">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <button onClick={addLineItem} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mt-2">
                                    <PlusIcon className="w-4 h-4 mr-1" />
                                    Add Item
                                </button>
                                {errors.lineItems && <p className="mt-2 text-sm text-red-500">{errors.lineItems}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                        <div>
                            <span className="text-sm text-gray-600">Total Amount: </span>
                            <span className="text-xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                {saveButtonText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PurchaseOrderForm;
