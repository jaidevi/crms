import React, { useState, useEffect } from 'react';
import { CloseIcon, QuestionMarkIcon, PlusIcon } from './Icons';
import type { PurchaseOrder } from '../App';
import AddBankModal from './AddBankModal';

interface FormLabelProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  hasInfo?: boolean;
  labelColor?: string;
}

const FormLabel: React.FC<FormLabelProps> = ({ htmlFor, label, required = false, hasInfo = false, labelColor = "text-gray-700"}) => {
  return (
    <label htmlFor={htmlFor} className={`flex items-center text-sm font-medium mb-1 ${labelColor}`}>
      <span>{label}</span>
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {hasInfo && <QuestionMarkIcon className="w-4 h-4 text-gray-400 ml-1" />}
    </label>
  );
};

interface PurchaseOrderFormProps {
    onClose: () => void;
    onSave: (newOrder: PurchaseOrder) => void;
    banks: string[];
    onAddBank: (bank: string) => void;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ onClose, onSave, banks, onAddBank }) => {
  const [poNumber, setPoNumber] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [shopName, setShopName] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [gstPercentage, setGstPercentage] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [bankName, setBankName] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [status, setStatus] = useState<'Pending' | 'Approved' | 'Shipped' | 'Delivered' | 'Cancelled'>('Pending');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddBankModal, setShowAddBankModal] = useState(false);

  const resetForm = () => {
    const generatedPoNumber = `PO-${Date.now()}`;
    setPoNumber(generatedPoNumber);
    const today = new Date().toISOString().split('T')[0];
    setOrderDate(today);
    setShopName('');
    setGstNo('');
    setItemDescription('');
    setQuantity('');
    setGstPercentage('');
    setPaymentMode('Cash');
    setBankName('');
    setChequeDate('');
    setStatus('Pending');
    setErrors({});
    setSuccessMessage('');
  };

  useEffect(() => {
    resetForm();
  }, []);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!poNumber.trim()) newErrors.poNumber = 'PO Number is required.';
    if (!shopName.trim()) newErrors.shopName = 'Shop Name is required.';
    if (!itemDescription.trim()) newErrors.itemDescription = 'Item Description is required.';
    
    if (!quantity.trim()) {
      newErrors.quantity = 'Quantity is required.';
    } else if (parseFloat(quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number.';
    }

    if (gstPercentage.trim()) {
      const gstValue = parseFloat(gstPercentage);
      if (isNaN(gstValue) || gstValue < 0 || gstValue > 100) {
        newErrors.gstPercentage = 'GST must be a number between 0 and 100.';
      }
    }

    if (paymentMode === 'Cheque') {
      if (!bankName.trim()) newErrors.bankName = 'Bank Name is required.';
      if (!chequeDate.trim()) newErrors.chequeDate = 'Cheque Date is required.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      setIsSaving(true);
      setSuccessMessage('');
      
      const newOrder: PurchaseOrder = {
        poNumber,
        orderDate,
        shopName,
        gstNo,
        itemDescription,
        quantity: parseFloat(quantity),
        gstPercentage: gstPercentage ? parseFloat(gstPercentage) : null,
        paymentMode,
        status,
      };

      if (paymentMode === 'Cheque') {
        newOrder.bankName = bankName;
        newOrder.chequeDate = chequeDate;
      }

      // Simulate API call
      setTimeout(() => {
        onSave(newOrder);
        setIsSaving(false);
        setSuccessMessage('Purchase Order saved successfully!');
        setTimeout(() => {
            onClose();
        }, 1500); // Wait 1.5s before closing to show success message
      }, 1000);
    }
  };

  const handleCancel = () => {
    onClose();
  };
  
  const createChangeHandler = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, errorKey?: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setter(e.target.value as T);
    if (errorKey && errors[errorKey]) {
        setErrors(prev => ({...prev, [errorKey]: ''}));
    }
    if (successMessage) setSuccessMessage('');
  };

  const handlePaymentModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value;
    setPaymentMode(newMode);

    if (newMode !== 'Cheque') {
        setBankName('');
        setChequeDate('');
        if (errors.bankName || errors.chequeDate) {
            setErrors(prev => {
                const updatedErrors = { ...prev };
                delete updatedErrors.bankName;
                delete updatedErrors.chequeDate;
                return updatedErrors;
            });
        }
    } else {
      setBankName('');
    }
    if (successMessage) setSuccessMessage('');
  };

  const handleSaveBank = (newBankName: string) => {
      if (newBankName && !banks.includes(newBankName)) {
          onAddBank(newBankName);
          setBankName(newBankName);
          if (errors.bankName) {
            setErrors(prev => ({...prev, bankName: ''}));
          }
      }
      setShowAddBankModal(false);
  };


  return (
    <>
      {showAddBankModal && <AddBankModal onClose={() => setShowAddBankModal(false)} onSave={handleSaveBank} />}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">New Purchase Order</h1>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <CloseIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-8">
          {successMessage && (
              <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
                  <span className="font-medium">Success!</span> {successMessage}
              </div>
          )}
          <div className="space-y-8">
            {/* Section 1: Order & Vendor Details */}
            <div className="border-b border-gray-900/10 pb-8">
              <h2 className="text-base font-semibold leading-7 text-gray-900">Order & Vendor Information</h2>
              <p className="mt-1 text-sm leading-6 text-gray-600">Basic details about the purchase order and the vendor.</p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <FormLabel htmlFor="po-number" label="PO Number" required/>
                  <input 
                    id="po-number" 
                    type="text" 
                    value={poNumber}
                    onChange={createChangeHandler(setPoNumber, 'poNumber')}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${errors.poNumber ? 'border-red-500' : ''}`} 
                  />
                  {errors.poNumber && <p className="mt-1 text-sm text-red-500">{errors.poNumber}</p>}
                </div>
                
                <div>
                  <FormLabel htmlFor="order-date" label="Date" required />
                  <input 
                    id="order-date" 
                    type="date" 
                    value={orderDate}
                    onChange={createChangeHandler(setOrderDate)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                  />
                </div>

                <div>
                  <FormLabel htmlFor="shop-name" label="Shop Name" required />
                  <input 
                    id="shop-name" 
                    type="text" 
                    value={shopName}
                    onChange={createChangeHandler(setShopName, 'shopName')}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${errors.shopName ? 'border-red-500' : ''}`} 
                  />
                  {errors.shopName && <p className="mt-1 text-sm text-red-500">{errors.shopName}</p>}
                </div>

                <div>
                  <FormLabel htmlFor="gst-no" label="GST NO" />
                  <input 
                    id="gst-no" 
                    type="text" 
                    value={gstNo}
                    onChange={createChangeHandler(setGstNo)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Item Details */}
            <div className="border-b border-gray-900/10 pb-8">
                <h2 className="text-base font-semibold leading-7 text-gray-900">Item Details</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">Describe the item and quantity being purchased.</p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2">
                        <FormLabel htmlFor="item-description" label="Item Description" required />
                        <textarea 
                            id="item-description" 
                            rows={4} 
                            value={itemDescription}
                            onChange={createChangeHandler(setItemDescription, 'itemDescription')}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${errors.itemDescription ? 'border-red-500' : ''}`}
                        ></textarea>
                        {errors.itemDescription && <p className="mt-1 text-sm text-red-500">{errors.itemDescription}</p>}
                    </div>
                    <div>
                        <FormLabel htmlFor="quantity" label="Quantity" required />
                        <input 
                            id="quantity" 
                            type="number" 
                            step="0.01"
                            value={quantity}
                            onChange={createChangeHandler(setQuantity, 'quantity')}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${errors.quantity ? 'border-red-500' : ''}`}
                        />
                        {errors.quantity && <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>}
                    </div>
                </div>
            </div>

            {/* Section 3: Financials & Status */}
            <div>
                <h2 className="text-base font-semibold leading-7 text-gray-900">Financials & Status</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">Specify payment details and the current order status.</p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-6">
                    <div>
                      <FormLabel htmlFor="gst-percentage" label="GST (%)" />
                      <input 
                        id="gst-percentage" 
                        type="number"
                        value={gstPercentage}
                        onChange={createChangeHandler(setGstPercentage, 'gstPercentage')}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${errors.gstPercentage ? 'border-red-500' : ''}`} 
                      />
                       {errors.gstPercentage && <p className="mt-1 text-sm text-red-500">{errors.gstPercentage}</p>}
                    </div>

                    <div>
                        <FormLabel htmlFor="payment-mode" label="Payment Mode" />
                        <select 
                            id="payment-mode" 
                            value={paymentMode}
                            onChange={handlePaymentModeChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                            <option>Cash</option>
                            <option>NEFT</option>
                            <option>GPay</option>
                            <option>Cheque</option>
                        </select>
                    </div>

                    <div>
                        <FormLabel htmlFor="status" label="Status" />
                        <select 
                            id="status" 
                            value={status}
                            onChange={(e) => setStatus(e.target.value as PurchaseOrder['status'])}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Shipped</option>
                            <option>Delivered</option>
                            <option>Cancelled</option>
                        </select>
                    </div>
                    
                    {paymentMode === 'Cheque' && (
                      <>
                        <div className="sm:col-span-1">
                          <FormLabel htmlFor="bank-name" label="Bank Name" required />
                          <div className="flex items-center space-x-2">
                            <select
                              id="bank-name"
                              value={bankName}
                              onChange={createChangeHandler(setBankName, 'bankName')}
                              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${errors.bankName ? 'border-red-500' : ''}`}
                            >
                                <option value="">Select a bank</option>
                                {banks.map((bank) => (
                                    <option key={bank} value={bank}>{bank}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setShowAddBankModal(true)}
                                className="mt-1 p-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500"
                                title="Add new bank"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>
                          </div>
                          {errors.bankName && <p className="mt-1 text-sm text-red-500">{errors.bankName}</p>}
                        </div>

                        <div>
                          <FormLabel htmlFor="cheque-date" label="Cheque Date" required />
                          <input
                            id="cheque-date"
                            type="date"
                            value={chequeDate}
                            onChange={createChangeHandler(setChequeDate, 'chequeDate')}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${errors.chequeDate ? 'border-red-500' : ''}`}
                          />
                          {errors.chequeDate && <p className="mt-1 text-sm text-red-500">{errors.chequeDate}</p>}
                        </div>
                      </>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white py-4 px-8 mt-4 rounded-lg shadow-sm">
        <div className="flex justify-start space-x-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button 
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default PurchaseOrderForm;