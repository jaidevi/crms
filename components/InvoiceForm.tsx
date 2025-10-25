

import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, CalendarIcon } from './Icons';
import type { DeliveryChallan, ProcessType, Invoice, InvoiceItem, InvoiceNumberConfig } from '../App';
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
    const [lineItems, setLineItems] = useState<InvoiceItem[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        setInvoiceNumber(`${invoiceNumberConfig.prefix}${String(invoiceNumberConfig.nextNumber)}`);
        
        const initialLineItems = challansToInvoice.map(challan => {
            const primaryProcessName = challan.process.length > 0 ? challan.process[0] : '';
            const processType = processTypes.find(p => p.name === primaryProcessName);
            const rate = processType?.rate || 0;
            const subtotal = challan.mtr * rate;
            const cgst = subtotal * 0.025;
            const sgst = subtotal * 0.025;

            return {
                id: challan.id,
                challanNumber: challan.challanNumber,
                challanDate: challan.date,
                process: challan.process.join(', '),
                designNo: challan.designNo,
                hsnSac: '998821', // Default HSN/SAC
                pcs: challan.pcs,
                mtr: challan.mtr,
                rate: rate,
                subtotal: subtotal,
                cgst: cgst,
                sgst: sgst,
                amount: subtotal + cgst + sgst,
            };
        });
        setLineItems(initialLineItems);
    }, [challansToInvoice, invoiceNumberConfig, processTypes]);

    const handleItemChange = (itemId: string, field: 'rate' | 'pcs' | 'mtr' | 'hsnSac', value: string | number) => {
        setLineItems(prevItems =>
            prevItems.map(item => {
                if (item.id === itemId) {
                    const updatedItem = { ...item, [field]: value };
                    
                    if (field === 'rate' || field === 'mtr' || field === 'pcs') {
                        updatedItem[field] = Math.max(0, Number(value));
                    }

                    const subtotal = updatedItem.mtr * updatedItem.rate;
                    const cgst = subtotal * 0.025;
                    const sgst = subtotal * 0.025;
                    updatedItem.subtotal = subtotal;
                    updatedItem.cgst = cgst;
                    updatedItem.sgst = sgst;
                    updatedItem.amount = subtotal + cgst + sgst;
                    
                    return updatedItem;
                }
                return item;
            })
        );
    };

    const subTotal = useMemo(() => lineItems.reduce((total, item) => total + item.subtotal, 0), [lineItems]);
    const totalCgst = useMemo(() => lineItems.reduce((total, item) => total + item.cgst, 0), [lineItems]);
    const totalSgst = useMemo(() => lineItems.reduce((total, item) => total + item.sgst, 0), [lineItems]);
    const totalTaxAmount = totalCgst + totalSgst;
    const totalAmountBeforeRounding = subTotal + totalTaxAmount;
    const roundedTotal = Math.round(totalAmountBeforeRounding);
    const roundedOff = roundedTotal - totalAmountBeforeRounding;

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!invoiceDate) newErrors.date = 'Invoice date is required.';
        if (lineItems.length === 0) newErrors.items = 'At least one item is required for the invoice.';
        lineItems.forEach(item => {
            if (item.rate <= 0) {
                newErrors[`rate_${item.id}`] = 'Rate must be positive.';
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;

        const invoiceData: Omit<Invoice, 'id'> = {
            invoiceNumber,
            invoiceDate,
            clientName,
            items: lineItems,
            subTotal,
            totalCgst,
            totalSgst,
            totalTaxAmount,
            roundedOff,
            totalAmount: roundedTotal,
        };
        onSave(invoiceData);
    };

    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start p-4 pt-10" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl animate-fade-in-down overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Create New Invoice</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                            <input type="text" value={invoiceNumber} readOnly className={`${commonInputClasses} bg-gray-100`} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                            <div className="relative">
                                <button type="button" onClick={() => setDatePickerOpen(p => !p)} className={`block w-full text-left ${commonInputClasses}`}>
                                    {formatDateForInput(invoiceDate) || 'Select date'}
                                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </button>
                                {isDatePickerOpen && <DatePicker value={invoiceDate} onChange={d => { setInvoiceDate(d); setDatePickerOpen(false); }} onClose={() => setDatePickerOpen(false)} />}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                            <input type="text" value={clientName} readOnly className={`${commonInputClasses} bg-gray-100`} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Invoice Items</h3>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3">Challan #</th>
                                        <th className="px-4 py-3">Process</th>
                                        <th className="px-4 py-3">HSN/SAC</th>
                                        <th className="px-4 py-3 text-right">Mtr (Qty)</th>
                                        <th className="px-4 py-3 text-right">Rate</th>
                                        <th className="px-4 py-3 text-right">Subtotal</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map(item => (
                                        <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-4 py-2 font-medium text-gray-900">{item.challanNumber}</td>
                                            <td className="px-4 py-2">{item.process}</td>
                                            <td className="px-4 py-2">
                                                <input type="text" value={item.hsnSac} onChange={e => handleItemChange(item.id, 'hsnSac', e.target.value)} className={`${commonInputClasses} w-24`} />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input type="number" value={item.mtr} onChange={e => handleItemChange(item.id, 'mtr', Number(e.target.value))} className={`${commonInputClasses} text-right w-24`} />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input type="number" value={item.rate} onChange={e => handleItemChange(item.id, 'rate', Number(e.target.value))} className={`${commonInputClasses} text-right w-24 ${errors[`rate_${item.id}`] ? 'border-red-500' : ''}`} />
                                            </td>
                                            <td className="px-4 py-2 text-right">₹{item.subtotal.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-right font-medium text-gray-900">₹{item.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                         {errors.items && <p className="mt-2 text-sm text-red-500">{errors.items}</p>}
                    </div>
                </div>

                <div className="flex items-start justify-between p-5 bg-gray-50 border-t">
                    <div className="text-sm text-gray-600">
                        <p>Subtotal: <span className="font-medium text-gray-800">₹{subTotal.toFixed(2)}</span></p>
                        <p>CGST (2.5%): <span className="font-medium text-gray-800">₹{totalCgst.toFixed(2)}</span></p>
                        <p>SGST (2.5%): <span className="font-medium text-gray-800">₹{totalSgst.toFixed(2)}</span></p>
                        <p>Tax Amount: <span className="font-medium text-gray-800">₹{totalTaxAmount.toFixed(2)}</span></p>
                         <p>Rounded Off: <span className="font-medium text-gray-800">₹{roundedOff.toFixed(2)}</span></p>
                    </div>
                    <div className="text-right">
                        <span className="text-sm text-gray-600">Total Amount:</span>
                        <p className="text-2xl font-bold text-gray-900">₹{roundedTotal.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">Save Invoice</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceForm;