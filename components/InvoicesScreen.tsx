
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Client, DeliveryChallan, ProcessType, Invoice, InvoiceNumberConfig, CompanyDetails } from '../types';
import { CalendarIcon, SearchIcon, ChevronDownIcon } from './Icons';
import DatePicker from './DatePicker';
import InvoiceCreateScreen from './InvoiceCreateScreen';
import InvoiceView from './InvoiceView';
import ClientStatementScreen from './ClientStatementScreen';

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler();
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

interface InvoicesScreenProps {
    clients: Client[];
    deliveryChallans: DeliveryChallan[];
    processTypes: ProcessType[];
    onAddInvoice: (newInvoice: Omit<Invoice, 'id'>) => void;
    invoiceNumberConfig: InvoiceNumberConfig;
    invoices: Invoice[];
    companyDetails: CompanyDetails;
}

const InvoicesScreen: React.FC<InvoicesScreenProps> = ({ clients, deliveryChallans, processTypes, onAddInvoice, invoiceNumberConfig, invoices, companyDetails }) => {
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');
    const [invoiceType, setInvoiceType] = useState<'process' | 'design'>('process');
    const [taxType, setTaxType] = useState<'GST' | 'NGST'>('GST');

    const [isFromDatePickerOpen, setFromDatePickerOpen] = useState(false);
    const [isToDatePickerOpen, setToDatePickerOpen] = useState(false);
    
    // Client Dropdown State
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const clientDropdownRef = useRef<HTMLDivElement>(null);
    useClickOutside(clientDropdownRef, () => setIsClientDropdownOpen(false));
    
    const [filteredChallans, setFilteredChallans] = useState<DeliveryChallan[]>([]);
    const [selectedChallanIds, setSelectedChallanIds] = useState<Set<string>>(new Set());
    const [hasSearched, setHasSearched] = useState(false);
    
    const [creationData, setCreationData] = useState<{ client: Client, challans: DeliveryChallan[], invoiceType: 'process' | 'design', taxType: 'GST' | 'NGST' } | null>(null);
    const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
    const [viewingStatementForClient, setViewingStatementForClient] = useState<Client | null>(null);

    const invoiceToView = useMemo(() => {
        if (!viewingInvoiceId) return null;
        return invoices.find(inv => inv.id === viewingInvoiceId);
    }, [viewingInvoiceId, invoices]);

    const clientForInvoice = useMemo(() => {
        if (!invoiceToView) return null;
        return clients.find(c => c.name === invoiceToView.clientName);
    }, [invoiceToView, clients]);

    const invoicedChallanNumbers = useMemo(() => {
        return new Set(
            invoices.flatMap(invoice => 
                invoice.items.flatMap(item => item.challanNumber.split(',').map(s => s.trim()))
            )
        );
    }, [invoices]);

    const filteredClients = useMemo(() => {
        const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name));
        if (!clientSearchTerm) return sorted;
        return sorted.filter(c => c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()));
    }, [clients, clientSearchTerm]);

    const handleSearch = () => {
        if (!selectedClient || !fromDate || !toDate) {
            alert("Please select a client and a date range.");
            return;
        }

        // Helper to parse date string as local date to avoid timezone issues.
        const parseAsLocalDate = (dateString: string): Date => {
            const [year, month, day] = dateString.split('-').map(Number);
            // new Date(year, monthIndex, day) creates a date at midnight in the local timezone.
            return new Date(year, month - 1, day);
        };

        const from = parseAsLocalDate(fromDate);
        // For the 'to' date, we want to include the entire day. So we set the time to the end of the day.
        const to = parseAsLocalDate(toDate);
        to.setHours(23, 59, 59, 999);

        const results = deliveryChallans.filter(challan => {
            if (invoicedChallanNumbers.has(challan.challanNumber)) {
                return false; // Filter out already invoiced challans
            }
            if (!challan.date || !/^\d{4}-\d{2}-\d{2}$/.test(challan.date)) return false;
            
            const challanDate = parseAsLocalDate(challan.date);
            
            let partyToCompare = challan.partyName;
            if (challan.isOutsourcing && challan.partyName.includes('|')) {
                const fromMatch = challan.partyName.match(/FROM: (.*?)\|/);
                if (fromMatch) {
                    partyToCompare = fromMatch[1].trim();
                }
            }

            return partyToCompare === selectedClient && challanDate >= from && challanDate <= to;
        });
        
        setFilteredChallans(results);
        setSelectedChallanIds(new Set());
        setHasSearched(true);
    };
    
    const handleViewStatement = () => {
        const client = clients.find(c => c.name === selectedClient);
        if (client) {
            setViewingStatementForClient(client);
        } else {
            alert("Could not find client details.");
        }
    };

    const handleSelectChallan = (challanId: string) => {
        setSelectedChallanIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(challanId)) {
                newSet.delete(challanId);
            } else {
                newSet.add(challanId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = new Set(filteredChallans.map(c => c.id));
            setSelectedChallanIds(allIds);
        } else {
            setSelectedChallanIds(new Set());
        }
    };

    const handleCreateInvoiceClick = () => {
        const client = clients.find(c => c.name === selectedClient);
        if (!client) {
            alert("Client not found.");
            return;
        }
        const selected = deliveryChallans.filter(c => selectedChallanIds.has(c.id));
        setCreationData({ client, challans: selected, invoiceType, taxType });
    };

    const handleCancelCreation = () => {
        setCreationData(null);
    };
    
    const handleSaveInvoice = (invoiceData: Omit<Invoice, 'id'>) => {
        onAddInvoice(invoiceData);
        setCreationData(null);
        setFilteredChallans([]);
        setSelectedChallanIds(new Set());
        setHasSearched(false);
        alert(`Invoice ${invoiceData.invoiceNumber} created successfully!`);
    };
    
    const isAllSelected = filteredChallans.length > 0 && selectedChallanIds.size === filteredChallans.length;

    if (viewingStatementForClient) {
        return <ClientStatementScreen
            client={viewingStatementForClient}
            invoices={invoices.filter(inv => inv.clientName === viewingStatementForClient.name)}
            challans={deliveryChallans.filter(c => c.partyName === viewingStatementForClient.name)}
            processTypes={processTypes}
            companyDetails={companyDetails}
            onBack={() => setViewingStatementForClient(null)}
        />
    }

    if (creationData) {
        return <InvoiceCreateScreen
            onCancel={handleCancelCreation}
            onSave={handleSaveInvoice}
            client={creationData.client}
            challansToInvoice={creationData.challans}
            invoiceNumberConfig={invoiceNumberConfig}
            processTypes={processTypes}
            companyDetails={companyDetails}
            invoiceType={creationData.invoiceType}
            taxType={creationData.taxType}
        />;
    }

    if (invoiceToView && clientForInvoice) {
        return <InvoiceView invoice={invoiceToView} client={clientForInvoice} companyDetails={companyDetails} onBack={() => setViewingInvoiceId(null)} />;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <h1 className="text-xl font-semibold text-gray-800">Select Challans for Invoice</h1>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-700">Invoice Type:</span>
                            <label className="inline-flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" 
                                    name="invoiceType" 
                                    value="process" 
                                    checked={invoiceType === 'process'} 
                                    onChange={() => setInvoiceType('process')} 
                                />
                                <span className="ml-2 text-sm text-gray-700">Process Based</span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" 
                                    name="invoiceType" 
                                    value="design" 
                                    checked={invoiceType === 'design'} 
                                    onChange={() => setInvoiceType('design')} 
                                />
                                <span className="ml-2 text-sm text-gray-700">Design Based</span>
                            </label>
                        </div>

                        <div className="flex items-center space-x-4 border-l pl-4 border-gray-300">
                            <span className="text-sm font-medium text-gray-700">Tax Type:</span>
                            <label className="inline-flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" 
                                    name="taxType" 
                                    value="GST" 
                                    checked={taxType === 'GST'} 
                                    onChange={() => setTaxType('GST')} 
                                />
                                <span className="ml-2 text-sm text-gray-700">GST</span>
                            </label>
                            <label className="inline-flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" 
                                    name="taxType" 
                                    value="NGST" 
                                    checked={taxType === 'NGST'} 
                                    onChange={() => setTaxType('NGST')} 
                                />
                                <span className="ml-2 text-sm text-gray-700">NGST</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2" ref={clientDropdownRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                        <div className="relative">
                            <button
                                type="button"
                                className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2.5 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                            >
                                <span className={`block truncate ${selectedClient ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {selectedClient || '-- Select a Client --'}
                                </span>
                                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </span>
                            </button>

                            {isClientDropdownOpen && (
                                <div className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                    <div className="sticky top-0 z-10 bg-white px-2 py-1.5 border-b border-gray-200">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                <SearchIcon className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                className="block w-full pl-8 pr-3 py-1 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                placeholder="Search client..."
                                                value={clientSearchTerm}
                                                onChange={(e) => setClientSearchTerm(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    {filteredClients.map((client) => (
                                        <div
                                            key={client.name}
                                            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${selectedClient === client.name ? 'text-blue-900 bg-blue-100 font-medium' : 'text-gray-900'}`}
                                            onClick={() => {
                                                setSelectedClient(client.name);
                                                setIsClientDropdownOpen(false);
                                                setClientSearchTerm('');
                                            }}
                                        >
                                            <span className="block truncate">{client.name}</span>
                                        </div>
                                    ))}
                                    {filteredClients.length === 0 && (
                                        <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500 text-center">
                                            No clients found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setFromDatePickerOpen(p => !p)}
                                className="block w-full text-sm rounded-md border shadow-sm bg-white px-3 py-2.5 flex items-center justify-between text-left font-normal border-gray-300"
                            >
                                <span className={fromDate ? 'text-gray-900' : 'text-gray-500'}>{formatDateForDisplay(fromDate) || 'Select date'}</span>
                                <CalendarIcon className="w-5 h-5 text-gray-400" />
                            </button>
                            {isFromDatePickerOpen && <DatePicker value={fromDate} onChange={d => { setFromDate(d); setFromDatePickerOpen(false); }} onClose={() => setFromDatePickerOpen(false)} />}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setToDatePickerOpen(p => !p)}
                                className="block w-full text-sm rounded-md border shadow-sm bg-white px-3 py-2.5 flex items-center justify-between text-left font-normal border-gray-300"
                            >
                                <span className={toDate ? 'text-gray-900' : 'text-gray-500'}>{formatDateForDisplay(toDate) || 'Select date'}</span>
                                <CalendarIcon className="w-5 h-5 text-gray-400" />
                            </button>
                            {isToDatePickerOpen && <DatePicker value={toDate} onChange={d => { setToDate(d); setToDatePickerOpen(false); }} onClose={() => setToDatePickerOpen(false)} />}
                        </div>
                    </div>
                    <div className="md:col-start-4">
                        <button
                            onClick={handleSearch}
                            className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-blue-700"
                        >
                            <SearchIcon className="w-5 h-5 mr-2" />
                            List Challans
                        </button>
                    </div>
                </div>
            </div>

            {hasSearched && (
                <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-5 border-b flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Delivery Challans</h2>
                            <p className="text-sm text-gray-500 mt-1">Found {filteredChallans.length} challan(s) for {selectedClient}.</p>
                        </div>
                        <button
                            onClick={handleViewStatement}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700"
                        >
                            View Statement
                        </button>
                    </div>
                    {filteredChallans.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th scope="col" className="p-4">
                                                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" onChange={handleSelectAll} checked={isAllSelected} />
                                            </th>
                                            <th scope="col" className="px-6 py-3">Challan #</th>
                                            <th scope="col" className="px-6 py-3">Date</th>
                                            <th scope="col" className="px-6 py-3">Party DC No</th>
                                            <th scope="col" className="px-6 py-3">Process</th>
                                            <th scope="col" className="px-6 py-3">Design No</th>
                                            <th scope="col" className="px-6 py-3 text-right">Pcs</th>
                                            <th scope="col" className="px-6 py-3 text-right">Mtr</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredChallans.map(challan => (
                                            <tr key={challan.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="w-4 p-4">
                                                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={selectedChallanIds.has(challan.id)} onChange={() => handleSelectChallan(challan.id)} />
                                                </td>
                                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{challan.challanNumber}</th>
                                                <td className="px-6 py-4">{formatDateForDisplay(challan.date)}</td>
                                                <td className="px-6 py-4">{challan.partyDCNo || '-'}</td>
                                                <td className="px-6 py-4">{challan.process.join(', ')}</td>
                                                <td className="px-6 py-4">{challan.designNo}</td>
                                                <td className="px-6 py-4 text-right">{challan.pcs}</td>
                                                <td className="px-6 py-4 text-right">{challan.mtr.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-5 flex justify-end">
                                <button
                                    onClick={handleCreateInvoiceClick}
                                    disabled={selectedChallanIds.size === 0}
                                    className="px-5 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Create Invoice ({selectedChallanIds.size})
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-8 text-gray-500">
                            No delivery challans found for the selected criteria.
                        </div>
                    )}
                </div>
            )}

             <div className="bg-white rounded-lg shadow-sm mt-6">
                <div className="p-5 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Generated Invoices</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                         <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Invoice #</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Client</th>
                                <th scope="col" className="px-6 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(invoice => (
                                <tr key={invoice.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <button onClick={() => setViewingInvoiceId(invoice.id)} className="font-medium text-blue-600 hover:underline">
                                            {invoice.invoiceNumber}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">{formatDateForDisplay(invoice.invoiceDate)}</td>
                                    <td className="px-6 py-4">{invoice.clientName}</td>
                                    <td className="px-6 py-4 text-right font-medium">₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {invoices.length === 0 && (
                         <div className="text-center p-8 text-gray-500">
                            No invoices have been generated yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoicesScreen;
