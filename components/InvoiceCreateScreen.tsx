
import React, { useState, useEffect, useMemo } from 'react';
import type { DeliveryChallan, ProcessType, Invoice, InvoiceItem, InvoiceNumberConfig, Client, CompanyDetails } from '../types';
import DatePicker from './DatePicker';
import { CloseIcon, CalendarIcon, PrintIcon } from './Icons';

interface InvoiceCreateScreenProps {
    onCancel: () => void;
    onSave: (invoice: Omit<Invoice, 'id'>) => void;
    client: Client;
    challansToInvoice: DeliveryChallan[];
    invoiceNumberConfig: InvoiceNumberConfig;
    processTypes: ProcessType[];
    companyDetails: CompanyDetails;
}

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const date = new Date(isoDate + 'T00:00:00');
    return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'long', day: '2-digit' }).format(date);
};

const numberFormat = (num: number, options?: Intl.NumberFormatOptions) => {
    const defaultOptions: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    return new Intl.NumberFormat('en-IN', { ...defaultOptions, ...options }).format(num);
};

// Default Logo (Fallback)
const VEL_LOGO_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTUwIj48cmVjdCB4PSI0NiIgeT0iMTAwIiB3aWR0aD0iOCIgaGVpZ2h0PSI1MCIgZmlsbD0iI2I0NTMwOSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjE0OCIgcj0iNCIgZmlsbD0iI2I0NTMwOSIgLz48cGF0aCBkPSJNNDAgMTAwIFE1MCAxMTAgNjAgMTAwIiBzdHJva2U9IiNiNDUzMDkiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48cGF0aCBkPSJNNDIgMTA1IFE1MCAxMTUgNTggMTA1IiBzdHJva2U9IiNiNDUzMDkiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48cGF0aCBkPSJNNDQgMTEwIFE1MCAxMTggNTYgMTEwIiBzdHJva2U9IiNiNDUzMDkiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48cGF0aCBkPSJNNTAgNSBDIDg1IDQwIDg1IDgwIDUwIDEwMCBDIDE1IDgwIDE1IDQwIDUwIDUgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjk3MzE2IiBzdHJva2Utd2lkdGg9IjQiIC8+PHBhdGggZD0iTTUwIDQ1IEMgNjUgNjAgNjUgODAgNTAgOTAgQyAzNSA4MCAzNSA2MCA1MCA0NSBaIiBmaWxsPSIjMWQ0ZWQ4IiAvPjxsaW5lIHgxPSIzNSIgeTE9IjI1IiB4Mj0iNjUiIHkyPSIyNSIgc3Ryb2tlPSIjOWNhM2FmIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgLz48bGluZSB4MT0iMzIiIHkxPSIzMiIgeDI9IjY4IiB5Mj0iMzIiIHN0cm9rZT0iIzljYTNhZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIC8+PGxpbmUgeDE9IjM1IiB5MT0iMzkiIHgyPSI2NSIgeTI9IjM5IiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzIiIHI9IjQiIGZpbGw9IiNkYzI2MjYiIC8+PC9zdmc+";

const InvoiceCreateScreen: React.FC<InvoiceCreateScreenProps> = ({ onCancel, onSave, client, challansToInvoice, invoiceNumberConfig, processTypes, companyDetails }) => {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [lineItems, setLineItems] = useState<InvoiceItem[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (invoiceNumberConfig.mode === 'auto') {
            const prefix = invoiceNumberConfig.prefix;
            setInvoiceNumber(`${prefix}${invoiceNumberConfig.nextNumber}`);
        } else {
            setInvoiceNumber('');
        }
        
        const sortedChallans = [...challansToInvoice].sort((a, b) => {
            const processA = a.process.join(', ');
            const processB = b.process.join(', ');
            if (processA !== processB) {
                return processA.localeCompare(processB);
            }
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        const groupedItemsMap = new Map<string, any>();

        // Helper to normalize strings for comparison (case-insensitive, trimmed)
        const normalize = (str: string) => str.trim().toLowerCase().replace(/^"/, '').replace(/"$/, '');

        sortedChallans.forEach(challan => {
            const processName = challan.process.join(', ');
            
            // Calculate cumulative rate for all processes
            let totalRate = 0;
            
            // Robustly split processes by comma, even if they are inside array elements
            // This handles cases like ["Process A, Process B"] or ["Process A", "Process B"]
            const individualProcesses = challan.process
                .flatMap(p => p.split(','))
                .map(p => p.trim())
                .filter(p => p !== '');

            individualProcesses.forEach(procName => {
                const normalizedProcName = normalize(procName);

                // 1. Check if client has a specific rate for this process
                const clientProcessRate = client.processes.find(p => normalize(p.processName) === normalizedProcName);
                
                if (clientProcessRate) {
                    totalRate += clientProcessRate.rate;
                } else {
                    // 2. Fallback to master process rate
                    const masterProcess = processTypes.find(p => normalize(p.name) === normalizedProcName);
                    totalRate += (masterProcess?.rate || 0);
                }
            });

            // Use configured HSN/SAC or default to 998821
            const hsnSac = companyDetails.hsnSac || '998821';
            // Include totalRate in key to differentiate if somehow rate calculation varies
            const groupKey = `${processName}|${totalRate}|${hsnSac}`;

            if (!groupedItemsMap.has(groupKey)) {
                groupedItemsMap.set(groupKey, {
                    process: processName,
                    rate: totalRate,
                    hsnSac: hsnSac,
                    pcs: 0,
                    mtr: 0,
                    _challanIds: [],
                    _challanNumbers: [],
                    _challanDates: [],
                    _designNos: new Set<string>()
                });
            }

            const group = groupedItemsMap.get(groupKey);
            group.pcs += challan.pcs;
            group.mtr += challan.mtr;
            group._challanIds.push(challan.id);
            group._challanNumbers.push(challan.challanNumber);
            group._challanDates.push(challan.date);
            group._designNos.add(challan.designNo);
        });

        const initialLineItems: InvoiceItem[] = Array.from(groupedItemsMap.entries()).map(([groupKey, group]) => {
            const subtotal = group.mtr * group.rate;
            const cgst = subtotal * 0.025;
            const sgst = subtotal * 0.025;
            const amount = subtotal + cgst + sgst;

            return {
                id: groupKey,
                challanNumber: group._challanNumbers.sort().join(', '),
                challanDate: group._challanDates.sort().pop() || '',
                process: group.process,
                description: '',
                designNo: Array.from(group._designNos).sort().join(', '),
                hsnSac: group.hsnSac,
                pcs: group.pcs,
                mtr: group.mtr,
                rate: group.rate,
                subtotal,
                cgst,
                sgst,
                amount,
            };
        });

        setLineItems(initialLineItems);
    }, [client, challansToInvoice, invoiceNumberConfig, processTypes, companyDetails]);

    const handleItemChange = (itemId: string, field: 'rate' | 'mtr' | 'hsnSac', value: string | number) => {
        setLineItems(prevItems =>
            prevItems.map(item => {
                if (item.id === itemId) {
                    const updatedItem = { ...item, [field]: value };
                    
                    if (field === 'rate' || field === 'mtr') {
                        const numValue = Math.max(0, Number(value));
                        updatedItem[field] = numValue;
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

    const totalQty = useMemo(() => lineItems.reduce((sum, i) => sum + i.mtr, 0), [lineItems]);
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
        lineItems.forEach(item => { if (item.rate <= 0) newErrors[`rate_${item.id}`] = 'Rate must be positive.'; });
        if (invoiceNumberConfig.mode === 'manual' && !invoiceNumber.trim()) {
            newErrors.invoiceNumber = 'Invoice Number is required.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveAndPrint = () => {
        if (!validate()) return;
        
        // Trigger print dialog for the current view
        window.print();

        // Then proceed to save
        onSave({ 
            invoiceNumber, 
            invoiceDate, 
            clientName: client.name, 
            items: lineItems, 
            subTotal, 
            totalCgst, 
            totalSgst, 
            totalTaxAmount, 
            roundedOff, 
            totalAmount: roundedTotal 
        });
    };
    
    const handlePrintDraft = () => {
        window.print();
    };

    // Helper to split invoice number for display
    const getInvoiceNumberParts = (fullNumber: string) => {
        const match = fullNumber.match(/^(.*?)(\d+)$/);
        if (match) {
            return { prefix: match[1], number: match[2] };
        }
        return { prefix: fullNumber, number: '' };
    };

    const { prefix: displayPrefix, number: displayNumber } = getInvoiceNumberParts(invoiceNumber);

    // Removed border-b to remove line under input
    const editableInputClasses = "w-full text-right bg-transparent focus:border-blue-500 focus:outline-none focus:ring-0 p-1";
    
    return (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
            {/* Top Toolbar - Hidden in Print */}
            <div className="flex justify-end items-center mb-6 no-print space-x-2">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300">
                    Cancel
                </button>
                <button onClick={handlePrintDraft} className="px-4 py-2 bg-secondary-600 text-white rounded-md text-sm font-semibold hover:bg-secondary-700">
                    <span className="flex items-center"><PrintIcon className="w-4 h-4 mr-1"/> Print Draft</span>
                </button>
                <button onClick={handleSaveAndPrint} className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 shadow-sm">
                    Save & Print Invoice
                </button>
            </div>

            <div id="printable-invoice" className="max-w-7xl mx-auto bg-white p-8 text-sm font-sans text-gray-800 border rounded-lg relative">
                {/* Header */}
                <header className="flex justify-between items-start pb-4">
                     <div className="flex items-start w-1/2">
                        <div className="w-24 h-32 mr-4 flex-shrink-0">
                             <img src={companyDetails.logoUrl || VEL_LOGO_URL} alt="Company Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-blue-700">{companyDetails.name}</h2>
                            <p className="text-gray-600 whitespace-pre-line">{companyDetails.addressLine1}</p>
                            <p className="text-gray-600 whitespace-pre-line">{companyDetails.addressLine2}</p>
                            <p className="text-gray-600 mt-2"><span role="img" aria-label="phone">☎️</span> {companyDetails.phone}</p>
                            <p className="text-gray-600"><span role="img" aria-label="email">@</span> {companyDetails.email}</p>
                            <p className="text-gray-600"><span role="img" aria-label="gst">ⓘ</span> GSTIN: {companyDetails.gstin}</p>
                            <p className="text-gray-600 font-bold">HSN/SAC: {companyDetails.hsnSac}</p>
                        </div>
                    </div>
                    <div className="w-1/2 text-right">
                        {/* Invoice Number and Date Section */}
                        <div className="mb-6">
                            {invoiceNumberConfig.mode === 'auto' ? (
                                 <h1 className="text-xl font-bold tracking-wide uppercase">
                                    <span className="text-blue-700">{displayPrefix} </span>
                                    <span className="text-gray-800">{displayNumber}</span>
                                </h1>
                            ) : (
                                <div className="flex justify-end">
                                    <div className="w-full max-w-xs">
                                        <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1 text-right no-print">Invoice Number <span className="text-red-500">*</span></label>
                                        <input
                                            id="invoiceNumber"
                                            type="text"
                                            value={invoiceNumber}
                                            onChange={e => setInvoiceNumber(e.target.value)}
                                            className={`block w-full px-3 py-2 text-xl rounded-md border shadow-sm focus:border-blue-500 focus:ring-blue-500 text-right ${errors.invoiceNumber ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Enter Invoice #"
                                        />
                                        {errors.invoiceNumber && <p className="mt-1 text-sm text-red-500 text-right no-print">{errors.invoiceNumber}</p>}
                                    </div>
                                </div>
                            )}
                            <div className="relative inline-block mt-1">
                                <span className="text-gray-600 mr-1">Date:</span>
                                <button className="font-medium text-gray-700 hover:text-blue-600 border-b border-dashed no-print" onClick={() => setDatePickerOpen(p => !p)}>
                                    {formatDateForDisplay(invoiceDate)}
                                </button>
                                <span className="font-medium text-gray-900 hidden print:inline">{formatDateForDisplay(invoiceDate)}</span>
                                {isDatePickerOpen && (
                                    <DatePicker
                                        value={invoiceDate}
                                        onChange={d => { setInvoiceDate(d); setDatePickerOpen(false); }}
                                        onClose={() => setDatePickerOpen(false)}
                                        align="right"
                                    />
                                )}
                            </div>
                        </div>

                        <h3 className="font-semibold text-gray-600 mb-2">Bill to:</h3>
                        <p className="font-bold text-gray-900 text-base uppercase">{client.name}</p>
                        <p className="text-gray-600 whitespace-pre-line">{client.address}</p>
                        <p className="text-gray-600">{client.city}, {client.state} - {client.pincode}</p>
                        <p className="text-gray-600 mt-2"><span role="img" aria-label="Place of Supply">ⓘ</span> Place of Supply: {client.state} (TN)</p>
                        <p className="text-gray-600">GSTIN: {client.gstNo}</p>
                    </div>
                </header>
                
                <div className="w-full h-1 bg-blue-600 my-4"></div>

                <section>
                    <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="border-b-2 border-blue-600 text-blue-600 text-sm uppercase">
                                <th className="py-1 px-2 w-12 text-center font-bold">S.No</th>
                                <th className="py-1 px-2 font-bold">Product/Service Name</th>
                                <th className="py-1 px-2 w-24 text-right font-bold">Qty</th>
                                <th className="py-1 px-2 w-28 text-right font-bold">Unit Price</th>
                                <th className="py-1 px-2 w-24 text-right font-bold">CGST (2.5%)</th>
                                <th className="py-1 px-2 w-24 text-right font-bold">SGST (2.5%)</th>
                                <th className="py-1 px-2 w-32 text-right font-bold">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                             {lineItems.map((item, index) => (
                                <tr key={item.id} className="border-b border-gray-200">
                                    <td className="p-2 text-center">{index + 1}</td>
                                    <td className="p-2 font-medium">{item.process}</td>
                                    <td className="p-2 text-right">
                                        <input type="number" value={item.mtr} onChange={e => handleItemChange(item.id, 'mtr', Number(e.target.value))} className={`${editableInputClasses} no-print`} />
                                        <span className="hidden print:inline">{numberFormat(item.mtr)}</span>
                                    </td>
                                    <td className="p-2 text-right">
                                        <input type="number" value={item.rate} onChange={e => handleItemChange(item.id, 'rate', Number(e.target.value))} className={`${editableInputClasses} no-print ${errors[`rate_${item.id}`] ? 'border-red-500' : ''}`} />
                                        <span className="hidden print:inline">{numberFormat(item.rate)}</span>
                                    </td>
                                    <td className="p-2 text-right">{numberFormat(item.cgst)}</td>
                                    <td className="p-2 text-right">{numberFormat(item.sgst)}</td>
                                    <td className="p-2 text-right font-semibold text-gray-900">₹{numberFormat(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                         <tfoot>
                            <tr className="font-bold bg-gray-50 border-t-2 border-gray-300">
                                <td colSpan={2} className="p-2 text-right">Total</td>
                                <td className="p-2 text-right">{numberFormat(totalQty)}</td>
                                <td className="p-2"></td>
                                <td className="p-2 text-right">{numberFormat(totalCgst)}</td>
                                <td className="p-2 text-right">{numberFormat(totalSgst)}</td>
                                <td className="p-2 text-right">₹{numberFormat(totalAmountBeforeRounding)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </section>
                
                <section className="grid grid-cols-2 gap-8 mt-8">
                    <div className="pt-4">
                         <div className="text-xs text-gray-500 space-y-1 mb-8">
                            <p className="font-bold text-gray-700 mb-2">Authorized Signature</p>
                            <div className="h-16 border-b border-gray-300 w-48"></div>
                        </div>
                        <div className="text-xs text-gray-500">
                            <h4 className="font-bold mb-1 text-gray-700">Note:</h4>
                            <p className="font-semibold text-gray-800">{companyDetails.bankName}</p>
                            <p>A/C No: {companyDetails.bankAccountNumber}</p>
                            <p>IFSC CODE: {companyDetails.bankIfscCode}</p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col justify-end">
                    <table className="w-full text-right">
                        <tbody className="text-gray-700">
                            <tr>
                                <td className="py-1.5 pr-4 text-gray-600">Total Before Tax</td>
                                <td className="py-1.5 font-medium">₹{numberFormat(subTotal)}</td>
                            </tr>
                            <tr>
                                <td className="py-1.5 pr-4 text-gray-600">Total Tax Amount</td>
                                <td className="py-1.5 font-medium">₹{numberFormat(totalTaxAmount)}</td>
                            </tr>
                            <tr className="text-base font-bold text-gray-900 border-t border-gray-200">
                                <td className="py-2 pr-4">Total Amount</td>
                                <td className="py-2">₹{numberFormat(roundedTotal, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
                            </tr>
                        </tbody>
                    </table>
                    </div>
                </section>
            </div>
            {/* Bottom Toolbar - Also hidden in print, duplicate functionality for convenience */}
            <div className="bg-gray-50 p-4 mt-4 border-t rounded-b-lg flex justify-end space-x-3 no-print">
                 <button onClick={onCancel} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50">Cancel</button>
                 <button onClick={handleSaveAndPrint} className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">Save & Print Invoice</button>
            </div>
        </div>
    );
};

export default InvoiceCreateScreen;
