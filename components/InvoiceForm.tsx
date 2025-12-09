
import React, { useState, useEffect } from 'react';
import { CloseIcon, CalendarIcon } from './Icons';
import type { DeliveryChallan, ProcessType, Invoice, InvoiceItem, InvoiceNumberConfig } from '../types';
import DatePicker from './DatePicker';

interface InvoiceFormProps {
    onClose: () => void;
    onSave: (invoice: Omit<Invoice, 'id'>) => void;
    clientName: string;
    challansToInvoice: DeliveryChallan[];
    invoiceNumberConfig: InvoiceNumberConfig;
    processTypes: ProcessType[];
}

const formatDateForInput = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onClose, onSave, clientName, challansToInvoice, invoiceNumberConfig, processTypes }) => {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);

    useEffect(() => {
        if (invoiceNumberConfig.mode === 'auto') {
            setInvoiceNumber(`${invoiceNumberConfig.prefix}${invoiceNumberConfig.nextNumber}`);
        }
    }, [invoiceNumberConfig]);

    const handleSave = () => {
        // Basic placeholder implementation for saving
        // In a real scenario, this would aggregate challan items similar to InvoiceCreateScreen
        const items: InvoiceItem[] = []; 
        
        onSave({
            invoiceNumber,
            invoiceDate,
            clientName,
            items,
            subTotal: 0,
            totalCgst: 0,
            totalSgst: 0,
            totalTaxAmount: 0,
            roundedOff: 0,
            totalAmount: 0,
            taxType: 'GST'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl animate-fade-in-down">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">New Invoice</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                        <CloseIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                        <input 
                            type="text" 
                            value={invoiceNumber} 
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <div className="relative">
                            <button 
                                onClick={() => setDatePickerOpen(!isDatePickerOpen)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-left flex justify-between items-center bg-white sm:text-sm"
                            >
                                <span className={invoiceDate ? 'text-gray-900' : 'text-gray-500'}>
                                    {formatDateForInput(invoiceDate)}
                                </span>
                                <CalendarIcon className="w-5 h-5 text-gray-400" />
                            </button>
                            {isDatePickerOpen && (
                                <DatePicker 
                                    value={invoiceDate} 
                                    onChange={(d) => { setInvoiceDate(d); setDatePickerOpen(false); }} 
                                    onClose={() => setDatePickerOpen(false)} 
                                />
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                        <input 
                            type="text" 
                            value={clientName} 
                            readOnly 
                            className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-gray-500 sm:text-sm" 
                        />
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-md border border-yellow-200">
                        <p className="text-sm text-yellow-700">
                            <strong>Note:</strong> {challansToInvoice.length} challans selected. 
                            Please use the main Invoice creation screen for full item breakdown and tax calculation.
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceForm;
