import React from 'react';
import type { Client, Invoice, DeliveryChallan, ProcessType } from '../App';

interface ClientStatementScreenProps {
    client: Client;
    invoices: Invoice[];
    challans: DeliveryChallan[];
    processTypes: ProcessType[];
    onBack: () => void;
}

const formatDate = (dateStr: string) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return 'N/A';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
};

const ClientStatementScreen: React.FC<ClientStatementScreenProps> = ({ client, invoices, challans, processTypes, onBack }) => {
    
    const getRateForChallan = (challan: DeliveryChallan): number => {
        if (!challan.process || challan.process.length === 0) {
            return 0;
        }
        // Use the first process to determine the rate, consistent with invoice creation.
        const primaryProcessName = challan.process[0];
        
        // Check for a client-specific rate first
        const clientProcess = client.processes.find(p => p.processName === primaryProcessName);
        if (clientProcess) {
            return clientProcess.rate;
        }

        // Fallback to the master process rate
        const masterProcess = processTypes.find(p => p.name === primaryProcessName);
        return masterProcess?.rate || 0;
    };
    
    return (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Statement for {client.name}</h1>
                    <p className="text-gray-500 mt-1">{client.address}, {client.city}</p>
                </div>
                <button onClick={onBack} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300">
                    Back
                </button>
            </div>

            {/* Invoices Section */}
            <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Invoices</h2>
                {invoices.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Invoice #</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(invoice => (
                                    <tr key={invoice.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-blue-600">{invoice.invoiceNumber}</td>
                                        <td className="px-6 py-4">{formatDate(invoice.invoiceDate)}</td>
                                        <td className="px-6 py-4 text-right font-medium">₹{invoice.totalAmount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center p-8 border rounded-lg text-gray-500">
                        No invoices found for this client.
                    </div>
                )}
            </div>

            {/* Challans Section */}
            <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Delivery Challans</h2>
                 {challans.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Challan #</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Process</th>
                                    <th className="px-6 py-3">Design No</th>
                                    <th className="px-6 py-3 text-right">Pcs</th>
                                    <th className="px-6 py-3 text-right">Meters</th>
                                    <th className="px-6 py-3 text-right">Unit Price</th>
                                    <th className="px-6 py-3 text-right">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {challans.map(challan => {
                                    const rate = getRateForChallan(challan);
                                    const totalAmount = challan.mtr * rate;
                                    return (
                                        <tr key={challan.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{challan.challanNumber}</td>
                                            <td className="px-6 py-4">{formatDate(challan.date)}</td>
                                            <td className="px-6 py-4">{challan.process.join(', ')}</td>
                                            <td className="px-6 py-4">{challan.designNo}</td>
                                            <td className="px-6 py-4 text-right">{challan.pcs}</td>
                                            <td className="px-6 py-4 text-right">{challan.mtr.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right">₹{rate.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-right font-medium">₹{totalAmount.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                     <div className="text-center p-8 border rounded-lg text-gray-500">
                        No challans found for this client.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientStatementScreen;