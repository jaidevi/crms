
import React, { useState, useMemo } from 'react';
import type { Client, DeliveryChallan, ProcessType, Invoice, InvoiceNumberConfig, CompanyDetails } from '../App';
import { CalendarIcon, SearchIcon } from './Icons';
import DatePicker from './DatePicker';
import InvoiceCreateScreen from './InvoiceCreateScreen';
import InvoiceView from './InvoiceView';
import ClientStatementScreen from './ClientStatementScreen';

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
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

    const [isFromDatePickerOpen, setFromDatePickerOpen] = useState(false);
    const [isToDatePickerOpen, setToDatePickerOpen] = useState(false);
    
    const [filteredChallans, setFilteredChallans] = useState<DeliveryChallan[]>([]);
    const [selectedChallanIds, setSelectedChallanIds] = useState<Set<string>>(new Set());
    const [hasSearched, setHasSearched] = useState(false);
    
    const [creationData, setCreationData] = useState<{ client: Client, challans: DeliveryChallan[] } | null>(null);
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
            if (challan.status !== 'Ready to Invoice') {
                return false;
            }
            if (invoicedChallanNumbers.has(challan.challanNumber)) {
                return false; // Filter out already invoiced challans
            }
            if (!challan.date || !/^\d{4}-\d{2}-\d{2}$/.test(challan.date)) return false;
            
            const challanDate = parseAsLocalDate(challan.date);

            return challan.partyName === selectedClient && challanDate >= from && challanDate <= to;
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
        setCreationData({ client, challans: selected });
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
        />;
    }

    if (invoiceToView && clientForInvoice) {
        return <InvoiceView invoice={invoiceToView} client={clientForInvoice} companyDetails={companyDetails} onBack={() => setViewingInvoiceId(null)} />;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-4">
                    <h1 className="text-xl font-semibold text-gray-800">Select Challans for Invoice</h1>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="client-select" className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                        <select
                            id="client-select"
                            value={selectedClient}
                            onChange={e => setSelectedClient(e.target.value)}
                            className="block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">-- Select a Client --</option>
                            {clients.map(client => (
                                <option key={client.name} value={client.name}>{client.name}</option>
                            ))}
                        </select>
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