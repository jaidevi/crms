
import React, { useState, useMemo } from 'react';
import { CloseIcon, PlusIcon, TrashIcon, CalendarIcon } from './Icons';
import type { PurchaseOrder, LineItem, PaymentMode, OrderStatus } from '../App';
import AddShopModal from './AddShopModal';
import AddBankModal from './AddBankModal';

interface PurchaseOrderFormProps {
    onClose: () => void;
    onSave: (newOrder: PurchaseOrder) => void;
    shopNames: string[];
    onAddShopName: (newShopName: string) => void;
    bankNames: string[];
    onAddBankName: (newBankName: string) => void;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ onClose, onSave, shopNames, onAddShopName, bankNames, onAddBankName }) => {
    const [shopName, setShopName] = useState(shopNames[0] || '');
    const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
    const [lineItems, setLineItems] = useState<LineItem[]>([]);
    const [showAddShopModal, setShowAddShopModal] = useState(false);
    const [showAddBankModal, setShowAddBankModal] = useState(false);

    // New state for additional fields
    const [gstNo, setGstNo] = useState('');
    const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
    const [status, setStatus] = useState<OrderStatus>('Unpaid');

    // State for cheque-specific fields
    const [bankName, setBankName] = useState(bankNames[0] || '');
    const [chequeDate, setChequeDate] = useState('');

    const addLineItem = () => {
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

    const updateLineItem = (id: string, field: keyof Omit<LineItem, 'id' | 'amount'>, value: string | number) => {
        setLineItems(prevItems =>
            prevItems.map(item => {
                if (item.id === id) {
                    const updatedItem = { ...item, [field]: value };
                    if (field === 'quantity' || field === 'rate') {
                        const quantity = field === 'quantity' ? Number(value) || 0 : item.quantity;
                        const rate = field === 'rate' ? Number(value) || 0 : item.rate;
                        updatedItem.amount = quantity * rate;
                    }
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

    const handleSubmit = () => {
        if (!shopName || !poDate) {
            // Basic validation, can be improved with error messages
            return;
        }
        
        const newOrder: PurchaseOrder = {
            poNumber: `PO-${Date.now()}`,
            poDate,
            shopName,
            items: lineItems.filter(item => item.name.trim() !== ''), // only save items with a name
            totalAmount,
            gstNo,
            paymentMode,
            status,
            ...(paymentMode === 'Cheque' && { bankName, chequeDate }),
        };
        onSave(newOrder);
    };
    
    const handleSaveShop = (newShop: string) => {
        onAddShopName(newShop);
        setShopName(newShop);
        setShowAddShopModal(false);
    };

    const handleSaveBank = (newBank: string) => {
        onAddBankName(newBank);
        setBankName(newBank);
        setShowAddBankModal(false);
    };
    
    const handleMainShopNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '_add_new_') {
            setShowAddShopModal(true);
        } else {
            setShopName(value);
        }
    };

    const handleBankNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '_add_new_') {
            setShowAddBankModal(true);
        } else {
            setBankName(value);
        }
    };

    const commonInputClasses = "block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";


    return (
        <>
            {showAddShopModal && <AddShopModal onClose={() => setShowAddShopModal(false)} onSave={handleSaveShop} existingShopNames={shopNames} />}
            {showAddBankModal && <AddBankModal onClose={() => setShowAddBankModal(false)} onSave={handleSaveBank} existingBankNames={bankNames} />}
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start p-4 pt-20" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl animate-fade-in-down overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-gray-200">
                        <h2 id="modal-title" className="text-xl font-bold text-gray-800">Create New Purchase Order</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
                                <select id="shopName" value={shopName} onChange={handleMainShopNameChange} className={commonInputClasses}>
                                    {shopNames.map(c => <option key={c} value={c}>{c}</option>)}
                                    <option value="_add_new_" className="text-blue-600 font-semibold">++ Add New Shop ++</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="po-date" className="block text-sm font-medium text-gray-700 mb-1">PO Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input id="po-date" type="date" value={poDate} onChange={e => setPoDate(e.target.value)} className={`${commonInputClasses} pr-10`} />
                                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div>
                                <label htmlFor="gstNo" className="block text-sm font-medium text-gray-700 mb-1">GST NO</label>
                                <input id="gstNo" type="text" value={gstNo} onChange={e => setGstNo(e.target.value)} className={commonInputClasses} placeholder="e.g. 27ABCDE1234F1Z5" />
                            </div>
                            <div>
                                <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                                <select id="paymentMode" value={paymentMode} onChange={e => setPaymentMode(e.target.value as PaymentMode)} className={commonInputClasses}>
                                    <option value="Cash">Cash</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="NEFT">NEFT</option>
                                    <option value="GPay">GPay</option>
                                </select>
                            </div>
                             <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select id="status" value={status} onChange={e => setStatus(e.target.value as OrderStatus)} className={commonInputClasses}>
                                    <option value="Unpaid">Unpaid</option>
                                    <option value="Paid">Paid</option>
                                </select>
                            </div>
                        </div>

                        {paymentMode === 'Cheque' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                                <div>
                                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                    <select id="bankName" value={bankName} onChange={handleBankNameChange} className={commonInputClasses}>
                                        {bankNames.map(b => <option key={b} value={b}>{b}</option>)}
                                        <option value="_add_new_" className="text-blue-600 font-semibold">++ Add New Bank ++</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="cheque-date" className="block text-sm font-medium text-gray-700 mb-1">Cheque Date</label>
                                    <div className="relative">
                                        <input id="cheque-date" type="date" value={chequeDate} onChange={e => setChequeDate(e.target.value)} className={`${commonInputClasses} pr-10`} />
                                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        )}


                        <div className="space-y-2 pt-4">
                            <h3 className="text-base font-semibold text-gray-800">Line Items</h3>
                            <div className="grid grid-cols-12 gap-4 px-3 py-2 bg-gray-50 rounded-md text-xs font-medium text-gray-500 tracking-wider uppercase">
                                <div className="col-span-4">Master Item</div>
                                <div className="col-span-3">Description</div>
                                <div className="col-span-1 text-right">Qty</div>
                                <div className="col-span-2 text-right">Rate</div>
                                <div className="col-span-1 text-right">Amount</div>
                                <div className="col-span-1"></div>
                            </div>

                            <div className="space-y-3 pt-2">
                                {lineItems.map((item) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-4">
                                            <input type="text" value={item.name} onChange={e => updateLineItem(item.id, 'name', e.target.value)} placeholder="Enter item name" className={commonInputClasses} aria-label="Master Item" />
                                        </div>
                                        <div className="col-span-3">
                                            <input type="text" value={item.description || ''} onChange={e => updateLineItem(item.id, 'description', e.target.value)} placeholder="Description" className={commonInputClasses} aria-label="Item Description" />
                                        </div>
                                        <div className="col-span-1">
                                            <input type="number" value={item.quantity} min="0" onChange={e => updateLineItem(item.id, 'quantity', e.target.value)} className={`${commonInputClasses} text-right`} aria-label="Quantity" />
                                        </div>
                                        <div className="col-span-2">
                                            <input type="number" value={item.rate} min="0" step="0.01" onChange={e => updateLineItem(item.id, 'rate', e.target.value)} className={`${commonInputClasses} text-right`} aria-label="Rate" />
                                        </div>
                                        <div className="col-span-1 text-right text-sm text-gray-800 font-medium">
                                            ${item.amount.toFixed(2)}
                                        </div>
                                        <div className="col-span-1 flex justify-end">
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
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-5 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                        <div>
                            <span className="text-sm text-gray-600">Total Amount: </span>
                            <span className="text-xl font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Create PO
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PurchaseOrderForm;
