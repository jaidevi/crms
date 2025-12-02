
import React from 'react';
import type { Client, Invoice, DeliveryChallan, ProcessType, CompanyDetails } from '../App';
import { PrintIcon } from './Icons';

interface ClientStatementScreenProps {
    client: Client;
    invoices: Invoice[];
    challans: DeliveryChallan[];
    processTypes: ProcessType[];
    onBack: () => void;
    companyDetails: CompanyDetails;
}

const formatDate = (dateStr: string) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'N/A';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
};

// Default Logo (Fallback)
const VEL_LOGO_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTUwIj48cmVjdCB4PSI0NiIgeT0iMTAwIiB3aWR0aD0iOCIgaGVpZ2h0PSI1MCIgZmlsbD0iI2I0NTMwOSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjE0OCIgcj0iNCIgZmlsbD0iI2I0NTMwOSIgLz48cGF0aCBkPSJNNDAgMTAwIFE1MCAxMTAgNjAgMTAwIiBzdHJva2U9IiNiNDUzMDkiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48cGF0aCBkPSJNNDIgMTA1IFE1MCAxMTUgNTggMTA1IiBzdHJva2U9IiNiNDUzMDkiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48cGF0aCBkPSJNNDQgMTEwIFE1MCAxMTggNTYgMTEwIiBzdHJva2U9IiNiNDUzMDkiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48cGF0aCBkPSJNNTAgNSBDIDg1IDQwIDg1IDgwIDUwIDEwMCBDIDE1IDgwIDE1IDQwIDUwIDUgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjk3MzE2IiBzdHJva2Utd2lkdGg9IjQiIC8+PHBhdGggZD0iTTUwIDQ1IEMgNjUgNjAgNjUgODAgNTAgOTAgQyAzNSA4MCAzNSA2MCA1MCA0NSBaIiBmaWxsPSIjMWQ0ZWQ4IiAvPjxsaW5lIHgxPSIzNSIgeTE9IjI1IiB4Mj0iNjUiIHkyPSIyNSIgc3Ryb2tlPSIjOWNhM2FmIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgLz48bGluZSB4MT0iMzIiIHkxPSIzMiIgeDI9IjY4IiB5Mj0iMzIiIHN0cm9rZT0iIzljYTNhZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIC8+PGxpbmUgeDE9IjM1IiB5MT0iMzkiIHgyPSI2NSIgeTI9IjM5IiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzIiIHI9IjQiIGZpbGw9IiNkYzI2MjYiIC8+PC9zdmc+";

const ClientStatementScreen: React.FC<ClientStatementScreenProps> = ({ client, invoices, challans, processTypes, onBack, companyDetails }) => {
    
    const handlePrint = () => {
        window.print();
    };

    const getRateForChallan = (challan: DeliveryChallan): number => {
        if (!challan.process || challan.process.length === 0) {
            return 0;
        }
        
        let totalRate = 0;
        const normalize = (s: string) => s.trim().toLowerCase().replace(/^"/, '').replace(/"$/, '');

        // Robustly split processes by comma, even if they are inside array elements
        const individualProcesses = challan.process
            .flatMap(p => p.split(','))
            .map(p => p.trim())
            .filter(p => p !== '');

        individualProcesses.forEach(procName => {
            const normalizedProcName = normalize(procName);

            // 1. Check for client-specific rate
            const clientProcess = client.processes?.find(p => normalize(p.processName) === normalizedProcName);
            
            if (clientProcess) {
                totalRate += clientProcess.rate;
            } else {
                // 2. Fallback to master process rate
                const masterProcess = processTypes.find(p => normalize(p.name) === normalizedProcName);
                totalRate += (masterProcess?.rate || 0);
            }
        });

        return totalRate;
    };
    
    return (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6 no-print">
                <h1 className="text-xl font-bold text-gray-800">Client Statement</h1>
                <div className="flex gap-3">
                    <button onClick={onBack} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300">
                        Back
                    </button>
                    <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-700">
                        <PrintIcon className="w-4 h-4 mr-2" /> Print Statement
                    </button>
                </div>
            </div>

            <div id="printable-statement" className="max-w-5xl mx-auto bg-white p-8 text-sm font-sans text-gray-800">
                {/* Company Header for Print */}
                <div className="flex justify-between items-start mb-8 border-b pb-4">
                     <div className="flex items-start">
                        <div className="w-20 h-20 mr-4">
                             <img src={companyDetails.logoUrl || VEL_LOGO_URL} alt="Company Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-primary-700">{companyDetails.name}</h2>
                            <p className="text-gray-600 whitespace-pre-line">{companyDetails.addressLine1}</p>
                            <p className="text-gray-600 whitespace-pre-line">{companyDetails.addressLine2}</p>
                            <div className="text-sm text-gray-600 mt-1">
                                <span className="font-semibold">Phone:</span> {companyDetails.phone}
                            </div>
                        </div>
                     </div>
                     <div className="text-right">
                        <h1 className="text-2xl font-bold text-gray-800 uppercase">Statement of Account</h1>
                        <p className="text-gray-600 mt-1">Date: {new Date().toLocaleDateString('en-GB')}</p>
                     </div>
                </div>

                {/* Client Info */}
                <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Statement for:</h3>
                    <p className="text-xl font-semibold text-primary-800">{client.name}</p>
                    <p className="text-gray-600">{client.address}</p>
                    <p className="text-gray-600">{client.city} - {client.pincode}</p>
                    {client.gstNo && <p className="text-gray-600 mt-1"><span className="font-semibold">GSTIN:</span> {client.gstNo}</p>}
                </div>

                {/* Invoices Section */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">Invoices</h2>
                    {invoices.length > 0 ? (
                        <div className="overflow-hidden border rounded-lg">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 border-b">Invoice #</th>
                                        <th className="px-6 py-3 border-b">Date</th>
                                        <th className="px-6 py-3 border-b text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map(invoice => (
                                        <tr key={invoice.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-3 font-medium text-primary-600">{invoice.invoiceNumber}</td>
                                            <td className="px-6 py-3">{formatDate(invoice.invoiceDate)}</td>
                                            <td className="px-6 py-3 text-right font-medium text-gray-900">₹{invoice.totalAmount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center p-4 border rounded-lg text-gray-500 italic">
                            No invoices found for this client.
                        </div>
                    )}
                </div>

                {/* Challans Section */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">Delivery Challans</h2>
                     {challans.length > 0 ? (
                        <div className="overflow-hidden border rounded-lg">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 border-b">Challan #</th>
                                        <th className="px-4 py-3 border-b">Date</th>
                                        <th className="px-4 py-3 border-b">Process</th>
                                        <th className="px-4 py-3 border-b">Design No</th>
                                        <th className="px-4 py-3 border-b text-right">Pcs</th>
                                        <th className="px-4 py-3 border-b text-right">Meters</th>
                                        <th className="px-4 py-3 border-b text-right">Unit Price</th>
                                        <th className="px-4 py-3 border-b text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {challans.map(challan => {
                                        const rate = getRateForChallan(challan);
                                        const totalAmount = challan.mtr * rate;
                                        return (
                                            <tr key={challan.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{challan.challanNumber}</td>
                                                <td className="px-4 py-3">{formatDate(challan.date)}</td>
                                                <td className="px-4 py-3">{challan.process.join(', ')}</td>
                                                <td className="px-4 py-3">{challan.designNo}</td>
                                                <td className="px-4 py-3 text-right">{challan.pcs}</td>
                                                <td className="px-4 py-3 text-right">{challan.mtr.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right">₹{rate.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900">₹{totalAmount.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                         <div className="text-center p-4 border rounded-lg text-gray-500 italic">
                            No challans found for this client.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientStatementScreen;
