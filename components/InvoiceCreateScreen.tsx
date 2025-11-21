
import React, { useState, useEffect, useMemo } from 'react';
import type { DeliveryChallan, ProcessType, Invoice, InvoiceItem, InvoiceNumberConfig, Client, CompanyDetails } from '../App';
import DatePicker from './DatePicker';
import { CloseIcon, CalendarIcon } from './Icons';

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

// Vel Logo SVG Data URI
const VEL_LOGO_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTUwIj4KICA8cGF0aCBkPSJNNDUgMTUwIEw0NSA5MCBMNTUgOTAgTDU1IDE1MCBaIiBmaWxsPSIjZjk3MzE2IiAvPgogIDxjaXJjbGUgY3g9IjUwIiBjeT0iMTQ1IiByPSI1IiBmaWxsPSIjZjk3MzE2IiAvPgogIDxwYXRoIGQ9Ik01MCAxMCBDIDkwIDYwIDkwIDkwIDUwIDExMCBDIDEwIDkwIDEwIDYwIDUwIDEwIFoiIGZpbGw9IiNmOTczMTYiIHN0cm9rZT0iI2I0NTMwOSIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHBhdGggZD0iTTUwIDQwIEMgNjAgNjAgNjAgODAgNTAgOTAgQyA0MCA4MCA0MCA2MCA1MCA0MCBaIiBmaWxsPSIjMTk3NmQyIiAvPgogIDxsaW5lIHgxPSIzNSIgeTE9IjI1IiB4Mj0iNjUiIHkyPSIyNSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIC8+CiAgPGxpbmUgeDE9IjMyIiB5MT0iMzIiIHgyPSI2OCIgeTI9IjMyIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIgLz4KICA8bGluZSB4MT0iMzUiIHkxPSIzOSIgeDI9IjY1IiB5Mj0iMzkiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIyIiAvPgogIDxjaXJjbGUgY3g9IjUwIiBjeT0iMzIiIHI9IjIuNSIgZmlsbD0iI2RjMjYyNiIgLz4KPC9zdmc+";

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

        sortedChallans.forEach(challan => {
            const processName = challan.process.join(', ');
            
            // Calculate cumulative rate for all processes
            let totalRate = 0;
            challan.process.forEach(procName => {
                // 1. Check if client has a specific rate for this process
                const clientProcessRate = client.processes.find(p => p.processName === procName);
                
                if (clientProcessRate) {
                    totalRate += clientProcessRate.rate;
                } else {
                    // 2. Fallback to master process rate
                    const masterProcess = processTypes.find(p => p.name === procName);
                    totalRate += (masterProcess?.rate || 0);
                }
            });

            const hsnSac = '998821';
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
    }, [client, challansToInvoice, invoiceNumberConfig, processTypes]);

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

    const handleSave = () => {
        if (!validate()) return;
        onSave({ invoiceNumber, invoiceDate, clientName: client.name, items: lineItems, subTotal, totalCgst, totalSgst, totalTaxAmount, roundedOff, totalAmount: roundedTotal });
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

    const editableInputClasses = "w-full text-right bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-0 p-1";
    
    return (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                </div>
                <div>
                    <button onClick={onCancel} className="px-4 py-2 mr-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">
                        Save Invoice
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto bg-white p-8 text-sm font-sans text-gray-800 border rounded-lg">
                {/* Header mimicking InvoiceView */}
                <header className="flex justify-between items-start pb-4">
                     <div className="flex items-start w-1/2">
                        <div className="w-24 h-32 mr-4 flex-shrink-0">
                             <img src={VEL_LOGO_URL} alt="Company Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-blue-700">{companyDetails.name}</h2>
                            <p className="text-gray-600 whitespace-pre-line">{companyDetails.addressLine1}</p>
                            <p className="text-gray-600 whitespace-pre-line">{companyDetails.addressLine2}</p>
                            <p className="text-gray-600 mt-2"><span role="img" aria-label="phone">☎️</span> {companyDetails.phone}</p>
                            <p className="text-gray-600"><span role="img" aria-label="email">@</span> {companyDetails.email}</p>
                            <p className="text-gray-600"><span role="img" aria-label="gst">ⓘ</span> GSTIN: {companyDetails.gstin}</p>
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
                                        <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-700 mb-1 text-right">Invoice Number <span className="text-red-500">*</span></label>
                                        <input
                                            id="invoiceNumber"
                                            type="text"
                                            value={invoiceNumber}
                                            onChange={e => setInvoiceNumber(e.target.value)}
                                            className={`block w-full px-3 py-2 text-xl rounded-md border shadow-sm focus:border-blue-500 focus:ring-blue-500 text-right ${errors.invoiceNumber ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Enter Invoice #"
                                        />
                                        {errors.invoiceNumber && <p className="mt-1 text-sm text-red-500 text-right">{errors.invoiceNumber}</p>}
                                    </div>
                                </div>
                            )}
                            <div className="relative inline-block mt-1">
                                <span className="text-gray-600 mr-1">Date:</span>
                                <button className="font-medium text-gray-700 hover:text-blue-600 border-b border-dashed" onClick={() => setDatePickerOpen(p => !p)}>
                                    {formatDateForDisplay(invoiceDate)}
                                </button>
                                {isDatePickerOpen && (
                                    <div className="absolute right-0 z-10">
                                        <DatePicker value={invoiceDate} onChange={d => { setInvoiceDate(d); setDatePickerOpen(false); }} onClose={() => setDatePickerOpen(false)} />
                                    </div>
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
                           <tr className="bg-blue-600 text-white text-xs uppercase">
                                <th className="p-2 w-12 text-center font-semibold">S.No</th>
                                <th className="p-2 font-semibold">Product/Service Name</th>
                                <th className="p-2 w-24 text-center font-semibold">HSN/SAC</th>
                                <th className="p-2 w-24 text-right font-semibold">Qty</th>
                                <th className="p-2 w-28 text-right font-semibold">Unit Price</th>
                                <th className="p-2 w-24 text-right font-semibold">CGST</th>
                                <th className="p-2 w-24 text-right font-semibold">SGST</th>
                                <th className="p-2 w-32 text-right font-semibold">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                             {lineItems.map((item, index) => (
                                <tr key={item.id} className="border-b border-gray-200">
                                    <td className="p-2 text-center">{index + 1}</td>
                                    <td className="p-2 font-medium">{item.process}</td>
                                    <td className="p-2 text-center">
                                        <input type="text" value={item.hsnSac} onChange={e => handleItemChange(item.id, 'hsnSac', e.target.value)} className={`${editableInputClasses} text-center`} />
                                    </td>
                                    <td className="p-2 text-right">
                                        <input type="number" value={item.mtr} onChange={e => handleItemChange(item.id, 'mtr', Number(e.target.value))} className={editableInputClasses} />
                                    </td>
                                    <td className="p-2 text-right">
                                        <input type="number" value={item.rate} onChange={e => handleItemChange(item.id, 'rate', Number(e.target.value))} className={`${editableInputClasses} ${errors[`rate_${item.id}`] ? 'border-red-500' : ''}`} />
                                    </td>
                                    <td className="p-2 text-right">{numberFormat(item.cgst)}</td>
                                    <td className="p-2 text-right">{numberFormat(item.sgst)}</td>
                                    <td className="p-2 text-right font-semibold text-gray-900">₹{numberFormat(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                         <tfoot>
                            <tr className="font-bold bg-gray-50 border-t-2 border-gray-300">
                                <td colSpan={3} className="p-2 text-right">Total</td>
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
                            <tr className="text-lg font-bold text-blue-600">
                                <td className="py-1.5 pr-4">Amount Due</td>
                                <td className="py-1.5">₹{numberFormat(roundedTotal, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
                            </tr>
                        </tbody>
                    </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default InvoiceCreateScreen;
