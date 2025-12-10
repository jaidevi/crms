
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
    invoiceType?: 'process' | 'design';
    taxType?: 'GST' | 'NGST';
    invoiceToEdit?: Invoice | null;
}

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const date = new Date(isoDate + 'T00:00:00');
    return new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'long', day: '2-digit' }).format(date);
};

const numberFormat = (num: number, options?: Intl.NumberFormatOptions) => {
    const defaultOptions: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    return new Intl.NumberFormat('en-IN', { ...defaultOptions, ...options }).format(num || 0);
};

const numberToWords = (num: number): string => {
    if (isNaN(num) || num === undefined || num === null) return 'Zero Rupees Only';
    
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const format = (n: number): string => {
        if (n === 0) return '';
        if (n < 20) return a[n] + ' ';
        if (n < 100) return b[Math.floor(n / 10)] + ' ' + format(n % 10);
        if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + (n % 100 !== 0 ? 'and ' : '') + format(n % 100);
        if (n < 100000) return format(Math.floor(n / 1000)) + 'Thousand ' + format(n % 1000);
        if (n < 10000000) return format(Math.floor(n / 100000)) + 'Lakh ' + format(n % 100000);
        return format(Math.floor(n / 10000000)) + 'Crore ' + format(n % 10000000);
    };

    if (num === 0) return 'Zero Rupees Only';
    
    const intPart = Math.floor(num);
    return format(intPart).trim() + ' Rupees Only';
};

const VEL_LOGO_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTUwIj48cmVjdCB4PSI0NiIgeT0iMTAwIiB3aWR0aD0iOCIgaGVpZ2h0PSI1MCIgZmlsbD0iI2I0NTMwOSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjE0OCIgcj0iNCIgZmlsbD0iI2I0NTMwOSIgLz48cGF0aCBkPSJNNDAgMTAwIFE1MCAxMTAgNjAgMTAwIiBzdHJva2U9IiNiNDUzMDkiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48cGF0aCBkPSJNNDIgMTA1IFE1MCAxMTUgNTggMTA1IiBzdHJva2U9IiNiNDUzMDkiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48cGF0aCBkPSJNNDQgMTEwIFE1MCAxMTggNTYgMTEwIiBzdHJva2U9IiNiNDUzMDkiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48cGF0aCBkPSJNNTAgNSBDIDg1IDQwIDg1IDgwIDUwIDEwMCBDIDE1IDgwIDE1IDQwIDUwIDUgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjk3MzE2IiBzdHJva2Utd2lkdGg9IjQiIC8+PHBhdGggZD0iTTUwIDQ1IEMgNjUgNjAgNjUgODAgNTAgOTAgQyAzNSA4MCAzNSA2MCA1MCA0NSBaIiBmaWxsPSIjMWQ0ZWQ4IiAvPjxsaW5lIHgxPSIzNSIgeTE9IjI1IiB4Mj0iNjUiIHkyPSIyNSIgc3Ryb2tlPSIjOWNhM2FmIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgLz48bGluZSB4MT0iMzIiIHkxPSIzMiIgeDI9IjY4IiB5Mj0iMzIiIHN0cm9rZT0iIzljYTNhZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIC8+PGxpbmUgeDE9IjM1IiB5MT0iMzkiIHgyPSI2NSIgeTI9IjM5IiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzIiIHI9IjQiIGZpbGw9IiNkYzI2MjYiIC8+PC9zdmc+";

const InvoiceCreateScreen: React.FC<InvoiceCreateScreenProps> = ({ 
    onCancel, 
    onSave, 
    client, 
    challansToInvoice, 
    invoiceNumberConfig, 
    processTypes, 
    companyDetails, 
    invoiceType = 'process', 
    taxType = 'GST',
    invoiceToEdit
}) => {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [lineItems, setLineItems] = useState<InvoiceItem[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (invoiceToEdit) {
            setInvoiceNumber(invoiceToEdit.invoiceNumber);
            setInvoiceDate(invoiceToEdit.invoiceDate);
            setLineItems(invoiceToEdit.items);
        } else {
            if (invoiceNumberConfig.mode === 'auto') {
                const prefix = invoiceNumberConfig.prefix;
                setInvoiceNumber(`${prefix}${invoiceNumberConfig.nextNumber}`);
            } else {
                setInvoiceNumber('');
            }
            
            const sortedChallans = [...challansToInvoice].sort((a, b) => {
                if (invoiceType === 'design') {
                    const designA = a.designNo || '';
                    const designB = b.designNo || '';
                    if (designA !== designB) return designA.localeCompare(designB);
                } else {
                    const processA = a.process.join(', ');
                    const processB = b.process.join(', ');
                    if (processA !== processB) return processA.localeCompare(processB);
                }
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            });

            const groupedItemsMap = new Map<string, any>();
            const normalize = (str: string) => str.trim().toLowerCase().replace(/^"/, '').replace(/"$/, '');

            sortedChallans.forEach(challan => {
                // Determine processes to use: splitProcess if available, else standard process list
                const processList = (challan.splitProcess && challan.splitProcess.length > 0) 
                    ? challan.splitProcess 
                    : challan.process;

                const processName = processList.join(', ');
                let totalRate = 0;
                
                const individualProcesses = processList
                    .flatMap(p => p.split(','))
                    .map(p => p.trim())
                    .filter(p => p !== '');

                individualProcesses.forEach(procName => {
                    const normalizedProcName = normalize(procName);
                    const clientProcessRate = client.processes?.find(p => normalize(p.processName) === normalizedProcName);
                    
                    if (clientProcessRate) {
                        totalRate += clientProcessRate.rate;
                    } else {
                        const masterProcess = processTypes.find(p => normalize(p.name) === normalizedProcName);
                        totalRate += (masterProcess?.rate || 0);
                    }
                });

                const hsnSac = companyDetails.hsnSac || '998821';
                let groupIdentifier = processName;
                if (invoiceType === 'design') {
                    const designPart = challan.designNo ? `${challan.designNo}` : 'N/A';
                    groupIdentifier = `${designPart} - ${processName}`;
                }

                // Group key includes rate to separate items if rates differ
                const groupKey = `${groupIdentifier}|${totalRate}|${hsnSac}`;

                if (!groupedItemsMap.has(groupKey)) {
                    groupedItemsMap.set(groupKey, {
                        displayName: groupIdentifier,
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
                const roundedMtr = Math.round(group.mtr); // Initial round for grouping, user can edit
                // Since user asked not to round off, maybe we should NOT round initial mtr either?
                // But generally initial values from challans might be summed. Challan MTRs are usually decimals.
                // Let's use exact sum for better accuracy if user requested "no roundoff"
                const exactMtr = group.mtr; 
                const subtotal = exactMtr * group.rate;
                const cgst = taxType === 'GST' ? subtotal * 0.025 : 0;
                const sgst = taxType === 'GST' ? subtotal * 0.025 : 0;
                const amount = subtotal + cgst + sgst;

                return {
                    id: groupKey,
                    challanNumber: group._challanNumbers.sort().join(', '),
                    challanDate: group._challanDates.sort().pop() || '',
                    process: group.displayName,
                    description: '',
                    designNo: Array.from(group._designNos).sort().join(', '),
                    hsnSac: group.hsnSac,
                    pcs: group.pcs,
                    mtr: exactMtr, // Use exact meter sum
                    rate: group.rate,
                    subtotal,
                    cgst,
                    sgst,
                    amount,
                };
            });

            setLineItems(initialLineItems);
        }
    }, [client, challansToInvoice, invoiceNumberConfig, processTypes, companyDetails, invoiceType, taxType, invoiceToEdit]);

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
                    const cgst = taxType === 'GST' ? subtotal * 0.025 : 0;
                    const sgst = taxType === 'GST' ? subtotal * 0.025 : 0;
                    
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
    // Safeguard against NaN
    const roundedTotal = Math.round(totalAmountBeforeRounding) || 0;
    const roundedOff = roundedTotal - (totalAmountBeforeRounding || 0);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!invoiceDate) newErrors.date = 'Invoice date is required.';
        if (lineItems.length === 0) newErrors.items = 'At least one item is required for the invoice.';
        lineItems.forEach(item => { if (item.rate < 0) newErrors[`rate_${item.id}`] = 'Rate cannot be negative.'; });
        if (invoiceNumberConfig.mode === 'manual' && !invoiceNumber.trim()) {
            newErrors.invoiceNumber = 'Invoice Number is required.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveAndPrint = () => {
        if (!validate()) {
            alert('Please check the form for errors. Ensure all required fields are filled and rates are valid.');
            return;
        }
        
        try {
            // Print first
            window.print();
            
            const finalTaxType: 'GST' | 'NGST' = taxType === 'NGST' ? 'NGST' : 'GST';
            const invoiceData: Omit<Invoice, 'id'> = { 
                invoiceNumber, 
                invoiceDate, 
                clientName: client.name, 
                items: lineItems, 
                subTotal, 
                totalCgst, 
                totalSgst, 
                totalTaxAmount, 
                roundedOff, 
                totalAmount: roundedTotal,
                taxType: finalTaxType
            };

            // Use setTimeout to allow the print dialog to handle focus/closing before state update unmounts this component
            setTimeout(() => {
                onSave(invoiceData);
            }, 500);

        } catch (error) {
            console.error("Error during save and print:", error);
            alert("An error occurred while saving. Please try again.");
        }
    };
    
    const handlePrintDraft = () => {
        window.print();
    };

    const getInvoiceNumberParts = (fullNumber: string) => {
        const match = fullNumber.match(/^(.*?)(\d+)$/);
        if (match) {
            return { prefix: match[1], number: match[2] };
        }
        return { prefix: fullNumber, number: '' };
    };

    const { prefix: displayPrefix, number: displayNumber } = getInvoiceNumberParts(invoiceNumber);
    const editableInputClasses = "w-full text-right bg-transparent focus:border-blue-500 focus:outline-none focus:ring-0 p-1";
    const showTax = taxType === 'GST';

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
            <div className="flex justify-end items-center mb-6 no-print space-x-2">
                <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300">
                    Cancel
                </button>
                <button onClick={handlePrintDraft} className="px-4 py-2 bg-secondary-600 text-white rounded-md text-sm font-semibold hover:bg-secondary-700">
                    <span className="flex items-center"><PrintIcon className="w-4 h-4 mr-1"/> Print Draft</span>
                </button>
                <button 
                    onClick={handleSaveAndPrint} 
                    type="button"
                    className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 shadow-sm"
                >
                    {invoiceToEdit ? 'Update & Print Invoice' : 'Save & Print Invoice'}
                </button>
            </div>

            <div id="printable-invoice" className="max-w-7xl mx-auto bg-white p-8 text-gray-800 font-sans border border-secondary-200">
                <div className="flex justify-between items-start mb-4">
                     <div className="flex items-start">
                        <div className="w-24 h-32 mr-4">
                             <img src={companyDetails.logoUrl || VEL_LOGO_URL} alt="Company Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-blue-700 mb-1">{companyDetails.name}</h2>
                            <p className="text-gray-700 text-sm whitespace-pre-line">{companyDetails.addressLine1}</p>
                            <p className="text-gray-700 text-sm whitespace-pre-line">{companyDetails.addressLine2}</p>
                            <div className="flex items-center text-sm text-gray-700 mt-2">
                                <span className="mr-1">☎</span> {companyDetails.phone}
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                                <span className="mr-1">@</span> {companyDetails.email}
                            </div>
                             <div className="text-sm text-gray-700 mt-1">
                                <span className="font-semibold">GSTIN:</span> {companyDetails.gstin}
                            </div>
                            {companyDetails.hsnSac && (
                                <div className="text-sm text-gray-700">
                                    <span className="font-semibold">HSN/SAC:</span> {companyDetails.hsnSac}
                                </div>
                            )}
                        </div>
                     </div>
                     
                     <div className="text-right min-w-[250px]">
                        <div className="mb-6">
                            <div className="flex items-baseline justify-end">
                                {invoiceNumberConfig.mode === 'manual' ? (
                                    <div className="flex flex-col items-end">
                                        <input
                                            type="text"
                                            value={invoiceNumber}
                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                            className={`text-2xl font-bold text-gray-900 text-right border-b border-gray-300 focus:border-blue-500 focus:outline-none w-48 ${errors.invoiceNumber ? 'border-red-500' : ''}`}
                                            placeholder="INV-XXXX"
                                        />
                                        {errors.invoiceNumber && <span className="text-xs text-red-500 mt-1">{errors.invoiceNumber}</span>}
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-2xl font-bold text-blue-700 mr-2">{displayPrefix}</h1>
                                        <span className="text-2xl font-bold text-gray-900">{displayNumber}</span>
                                    </>
                                )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1 flex items-center justify-end">
                                <span className="mr-2">Date:</span>
                                <div className="relative w-32">
                                    <button 
                                        onClick={() => setDatePickerOpen(!isDatePickerOpen)}
                                        className="text-gray-900 font-semibold border-b border-gray-300 hover:border-blue-500 focus:outline-none w-full text-right print:border-none"
                                    >
                                        {formatDateForDisplay(invoiceDate)}
                                    </button>
                                    {isDatePickerOpen && (
                                        <DatePicker 
                                            value={invoiceDate} 
                                            onChange={(d) => { setInvoiceDate(d); setDatePickerOpen(false); }} 
                                            onClose={() => setDatePickerOpen(false)} 
                                            align="right"
                                        />
                                    )}
                                </div>
                            </div>
                            {errors.date && <p className="text-xs text-red-500 text-right no-print">{errors.date}</p>}
                        </div>

                        <p className="text-gray-600 font-semibold mb-1">Bill to:</p>
                        <h3 className="text-xl font-bold text-gray-900 uppercase">{client.name}</h3>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{client.address}</p>
                        <p className="text-sm text-gray-600">{client.city} - {client.pincode}, India</p>
                        <p className="text-sm text-gray-600 mt-1">
                            <span className="font-semibold">Place of Supply:</span> {client.state} (TN)
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold">GSTIN:</span> {client.gstNo}
                        </p>
                     </div>
                </div>

                <div className="mb-8">
                    <div className="w-full h-1 bg-blue-600 mb-0"></div>
                    <table className="w-full border-collapse">
                         <thead>
                            <tr className="border-b-2 border-blue-600 text-blue-600 text-sm uppercase">
                               <th className="py-2 px-2 text-center w-10 font-bold">S.NO</th>
                               <th className="py-2 px-2 text-left font-bold">PRODUCT/SERVICE NAME</th>
                               <th className="py-2 px-2 text-center w-16 font-bold">QTY</th>
                               <th className="py-2 px-2 text-right w-20 font-bold">UNIT PRICE</th>
                               {showTax && <th className="py-2 px-2 text-right w-24 font-bold">TAXABLE VALUE</th>}
                               {showTax && <th className="py-2 px-2 text-right w-20 font-bold">CGST (2.5%)</th>}
                               {showTax && <th className="py-2 px-2 text-right w-20 font-bold">SGST (2.5%)</th>}
                               <th className="py-2 px-2 text-right w-24 font-bold">AMOUNT</th>
                            </tr>
                         </thead>
                         <tbody className="text-gray-800 text-sm">
                            {lineItems.map((item, index) => (
                                <tr key={item.id} className="border-b border-gray-200">
                                    <td className="py-3 px-2 text-center">{index + 1}</td>
                                    <td className="py-3 px-2 font-semibold">
                                        {item.process}
                                        {item.designNo && invoiceType !== 'design' && <div className="text-xs font-normal text-gray-500">Design: {item.designNo}</div>}
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                        <input
                                            type="number"
                                            value={item.mtr}
                                            onChange={(e) => handleItemChange(item.id, 'mtr', e.target.value)}
                                            className={`${editableInputClasses} text-center`}
                                        />
                                    </td>
                                    <td className="py-3 px-2 text-right">
                                        <input
                                            type="number"
                                            value={item.rate}
                                            onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                                            className={editableInputClasses}
                                            step="0.01"
                                        />
                                        {errors[`rate_${item.id}`] && <div className="text-xs text-red-500 no-print">{errors[`rate_${item.id}`]}</div>}
                                    </td>
                                    {showTax && <td className="py-3 px-2 text-right">{numberFormat(item.subtotal)}</td>}
                                    {showTax && <td className="py-3 px-2 text-right">{numberFormat(item.cgst)}</td>}
                                    {showTax && <td className="py-3 px-2 text-right">{numberFormat(item.sgst)}</td>}
                                    <td className="py-3 px-2 text-right font-bold">₹{numberFormat(item.amount)}</td>
                                </tr>
                            ))}
                         </tbody>
                         <tfoot>
                             <tr className="border-t-2 border-gray-300 font-bold text-sm">
                                 <td colSpan={2} className="py-2 px-2 text-right">Total</td>
                                 <td className="py-2 px-2 text-center">{numberFormat(totalQty, { minimumFractionDigits: 0, maximumFractionDigits: 3 })}</td>
                                 <td className="py-2 px-2"></td>
                                 {showTax && <td className="py-2 px-2 text-right">{numberFormat(subTotal)}</td>}
                                 {showTax && <td className="py-2 px-2 text-right">{numberFormat(totalCgst)}</td>}
                                 {showTax && <td className="py-2 px-2 text-right">{numberFormat(totalSgst)}</td>}
                                 <td className="py-2 px-2 text-right">₹{numberFormat(totalAmountBeforeRounding + roundedOff)}</td>
                             </tr>
                         </tfoot>
                    </table>
                </div>

                <div className="grid grid-cols-2 gap-8">
                     <div className="flex flex-col justify-between">
                        <div className="mt-4">
                            <p className="text-sm font-semibold text-gray-700">Amount in Words:</p>
                            <p className="text-sm font-medium text-gray-900">{numberToWords(roundedTotal)}</p>
                        </div>

                        <div className="mt-8">
                           <p className="text-sm font-semibold text-gray-800">Authorized Signature</p>
                           <div className="h-16 border-b border-gray-300 w-48"></div>
                        </div>
                        
                        <div className="mt-8 text-sm">
                            <div className="text-gray-800">
                                <div className="font-bold mb-1">Note:</div>
                                <p className="font-semibold">{companyDetails.bankName}: {companyDetails.bankAccountNumber}</p>
                                <p>IFSC CODE: {companyDetails.bankIfscCode}</p>
                            </div>
                        </div>

                        <div className="mt-6 text-xs text-gray-600">
                            <div className="font-bold mb-1 text-gray-800">Terms & Conditions:</div>
                            <ol className="list-decimal list-inside space-y-0.5">
                                <li>Interest : @18% P.A will be charged if the payment is not within 45 days.</li>
                                <li>Subject to "SALEM JURISDICTION" only.</li>
                            </ol>
                        </div>
                     </div>

                     <div>
                        <table className="w-full text-right text-sm">
                            <tbody>
                                {showTax && (
                                    <>
                                        <tr>
                                           <td className="py-1 text-gray-600 pr-4">Total Before Tax</td>
                                           <td className="py-1 font-medium">₹{numberFormat(subTotal)}</td>
                                        </tr>
                                        <tr>
                                           <td className="py-1 text-gray-600 pr-4">Total Tax Amount</td>
                                           <td className="py-1 font-medium">₹{numberFormat(totalTaxAmount)}</td>
                                        </tr>
                                    </>
                                )}
                                {!showTax && (
                                    <tr>
                                       <td className="py-1 text-gray-600 pr-4">Total Before Tax</td>
                                       <td className="py-1 font-medium">₹{numberFormat(subTotal)}</td>
                                    </tr>
                                )}
                                <tr>
                                   <td className="py-1 text-gray-600 pr-4">Rounded Off</td>
                                   <td className="py-1 font-medium">{roundedOff > 0 ? '+' : ''}{roundedOff.toFixed(2)}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                   <td className="py-2 text-gray-800 font-bold pr-4 text-base">Total Amount</td>
                                   <td className="py-2 text-gray-800 font-bold text-base">₹{numberFormat(roundedTotal, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
                                </tr>
                            </tbody>
                        </table>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceCreateScreen;
