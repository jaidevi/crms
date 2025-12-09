import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, CalendarIcon } from './Icons';
import DatePicker from './DatePicker';
import type { Invoice, Client, DeliveryChallan, InvoiceItem, InvoiceNumberConfig, ProcessType, CompanyDetails } from '../types';

interface InvoiceCreateScreenProps {
    onCancel: () => void;
    onSave: (invoice: Omit<Invoice, 'id'>) => void;
    client: Client;
    challansToInvoice: DeliveryChallan[];
    invoiceNumberConfig: InvoiceNumberConfig;
    processTypes: ProcessType[];
    companyDetails: CompanyDetails;
    invoiceType: 'process' | 'design';
    taxType: 'GST' | 'NGST';
}

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const InvoiceCreateScreen: React.FC<InvoiceCreateScreenProps> = ({
    onCancel,
    onSave,
    client,
    challansToInvoice,
    invoiceNumberConfig,
    processTypes,
    companyDetails,
    invoiceType,
    taxType
}) => {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Initialize Invoice Number
    useEffect(() => {
        if (invoiceNumberConfig.mode === 'auto') {
            setInvoiceNumber(`${invoiceNumberConfig.prefix}${invoiceNumberConfig.nextNumber}`);
        }
    }, [invoiceNumberConfig]);

    // Aggregate Challans
    useEffect(() => {
        const aggregatedItems: InvoiceItem[] = [];
        const processMap = new Map<string, number>();

        // Build a map of rates for quick lookup
        processTypes.forEach(p => processMap.set(p.name.toLowerCase(), p.rate));
        client.processes?.forEach(p => processMap.set(p.processName.toLowerCase(), p.rate));

        challansToInvoice.forEach(challan => {
            const challanSplitProcesses = challan.splitProcess;
            
            const processList = (challanSplitProcesses && challanSplitProcesses.length > 0) 
                ? challanSplitProcesses 
                : challan.process;

            processList.forEach(proc => {
                const normalizedProc = proc.trim();
                const rate = processMap.get(normalizedProc.toLowerCase()) || 0;
                
                let description = '';
                
                if (invoiceType === 'process') {
                    description = normalizedProc;
                } else {
                    description = `Design: ${challan.designNo} (${normalizedProc})`;
                }

                // Check if we can aggregate into an existing item
                const existingItemIndex = aggregatedItems.findIndex(i => 
                    i.process === normalizedProc && 
                    i.rate === rate && 
                    (invoiceType === 'process' ? true : i.designNo === challan.designNo)
                );

                if (existingItemIndex > -1) {
                    const existing = aggregatedItems[existingItemIndex];
                    existing.pcs += challan.pcs; 
                    // Note: We are adding meters for each process occurrence. 
                    // This assumes billing is per process per meter.
                    existing.mtr += challan.mtr;
                    if (!existing.challanNumber.includes(challan.challanNumber)) {
                        existing.challanNumber += `, ${challan.challanNumber}`;
                    }
                } else {
                    aggregatedItems.push({
                        id: `item-${Date.now()}-${Math.random()}`,
                        challanNumber: challan.challanNumber,
                        challanDate: challan.date,
                        process: normalizedProc,
                        description: description,
                        designNo: challan.designNo,
                        hsnSac: companyDetails.hsnSac || '',
                        pcs: challan.pcs,
                        mtr: challan.mtr,
                        rate: rate,
                        subtotal: 0,
                        cgst: 0,
                        sgst: 0,
                        amount: 0
                    });
                }
            });
        });
        
        setItems(aggregatedItems);
    }, [challansToInvoice, client, processTypes, invoiceType, companyDetails.hsnSac]);

    // Calculations
    const calculatedTotals = useMemo(() => {
        let subTotal = 0;
        let totalCgst = 0;
        let totalSgst = 0;

        const updatedItems = items.map(item => {
            const itemSubtotal = item.mtr * item.rate;
            let itemCgst = 0;
            let itemSgst = 0;

            if (taxType === 'GST') {
                itemCgst = itemSubtotal * 0.025; // 2.5%
                itemSgst = itemSubtotal * 0.025; // 2.5%
            }

            subTotal += itemSubtotal;
            totalCgst += itemCgst;
            totalSgst += itemSgst;

            return {
                ...item,
                subtotal: itemSubtotal,
                cgst: itemCgst,
                sgst: itemSgst,
                amount: itemSubtotal + itemCgst + itemSgst
            };
        });

        const totalTaxAmount = totalCgst + totalSgst;
        const grossTotal = subTotal + totalTaxAmount;
        const roundedTotal = Math.round(grossTotal);
        const roundedOff = roundedTotal - grossTotal;

        return {
            items: updatedItems,
            subTotal,
            totalCgst,
            totalSgst,
            totalTaxAmount,
            roundedOff,
            totalAmount: roundedTotal
        };
    }, [items, taxType]);

    const handleSave = () => {
        const newErrors: { [key: string]: string } = {};
        if (!invoiceNumber) newErrors.invoiceNumber = "Invoice Number is required";
        if (!invoiceDate) newErrors.date = "Date is required";
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        onSave({
            invoiceNumber,
            invoiceDate,
            clientName: client.name,
            items: calculatedTotals.items,
            subTotal: calculatedTotals.subTotal,
            totalCgst: calculatedTotals.totalCgst,
            totalSgst: calculatedTotals.totalSgst,
            totalTaxAmount: calculatedTotals.totalTaxAmount,
            roundedOff: calculatedTotals.roundedOff,
            totalAmount: calculatedTotals.totalAmount,
            taxType
        });
    };

    const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 animate-fade-in-down">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Create Invoice</h2>
                <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-100">
                    <CloseIcon className="w-6 h-6 text-gray-600" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number</label>
                    <input 
                        type="text" 
                        value={invoiceNumber} 
                        onChange={(e) => setInvoiceNumber(e.target.value)} 
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.invoiceNumber && <p className="text-xs text-red-500 mt-1">{errors.invoiceNumber}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <div className="relative">
                        <button 
                            onClick={() => setDatePickerOpen(!isDatePickerOpen)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md text-left flex justify-between items-center bg-white"
                        >
                            <span>{formatDateForDisplay(invoiceDate)}</span>
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
                    {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <input 
                        type="text" 
                        value={client.name} 
                        readOnly 
                        className="block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600"
                    />
                </div>
            </div>

            <div className="overflow-x-auto border rounded-lg mb-6">
                <table className="w-full text-sm text-left text-gray-700">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right w-24">HSN</th>
                            <th className="px-4 py-3 text-right w-24">Qty (Mtr)</th>
                            <th className="px-4 py-3 text-right w-24">Rate</th>
                            <th className="px-4 py-3 text-right w-32">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {calculatedTotals.items.map((item) => (
                            <tr key={item.id}>
                                <td className="px-4 py-2">
                                    <input 
                                        type="text" 
                                        value={item.description || item.process} 
                                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                        className="w-full border-none focus:ring-0 bg-transparent p-0 text-sm"
                                    />
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        Challans: {item.challanNumber}
                                    </div>
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <input 
                                        type="text" 
                                        value={item.hsnSac} 
                                        onChange={(e) => handleItemChange(item.id, 'hsnSac', e.target.value)}
                                        className="w-full text-right border-none focus:ring-0 bg-transparent p-0 text-sm"
                                    />
                                </td>
                                <td className="px-4 py-2 text-right">{item.mtr.toFixed(2)}</td>
                                <td className="px-4 py-2 text-right">
                                    <input 
                                        type="number" 
                                        value={item.rate} 
                                        onChange={(e) => handleItemChange(item.id, 'rate', Number(e.target.value))}
                                        className="w-full text-right border rounded px-1 py-0.5 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                </td>
                                <td className="px-4 py-2 text-right font-medium">
                                    {item.subtotal.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                        <span>Sub Total</span>
                        <span>{calculatedTotals.subTotal.toFixed(2)}</span>
                    </div>
                    {taxType === 'GST' && (
                        <>
                            <div className="flex justify-between">
                                <span>CGST (2.5%)</span>
                                <span>{calculatedTotals.totalCgst.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>SGST (2.5%)</span>
                                <span>{calculatedTotals.totalSgst.toFixed(2)}</span>
                            </div>
                        </>
                    )}
                    <div className="flex justify-between">
                        <span>Rounded Off</span>
                        <span>{calculatedTotals.roundedOff.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-bold text-lg text-gray-900">
                        <span>Total</span>
                        <span>₹{calculatedTotals.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-8 space-x-3">
                <button 
                    onClick={onCancel}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm"
                >
                    Save Invoice
                </button>
            </div>
        </div>
    );
};

export default InvoiceCreateScreen;
