
import React, { useMemo } from 'react';
import type { Client, Invoice, DeliveryChallan, ProcessType, CompanyDetails } from '../types';
import { PrintIcon, DownloadIcon } from './Icons';
import * as XLSX from 'xlsx';

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

    const sortedChallans = useMemo(() => {
        return [...challans].sort((a, b) => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date); // Ascending date
            }
            // Secondary sort by challan number ascending for stability
            return a.challanNumber.localeCompare(b.challanNumber, undefined, { numeric: true });
        });
    }, [challans]);

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new();
        
        // Prepare data for Excel
        const wsData: any[][] = [
            [companyDetails.name],
            [companyDetails.addressLine1],
            [companyDetails.addressLine2],
            [`Phone: ${companyDetails.phone}`],
            [],
            ["ACCOUNT SUMMARY"],
            [],
            [`Client: ${client.name}`],
            [`Address: ${client.address}`],
            [`${client.city} - ${client.pincode}`],
            [`GSTIN: ${client.gstNo || ''}`],
            [],
            ["Challan #", "Date", "Party DC No", "Process", "Design No", "Pcs", "Meters", "Unit Price", "Total Amount"]
        ];

        let totalPcs = 0;
        let totalMtr = 0;
        let totalVal = 0;

        sortedChallans.forEach(challan => {
            const rate = getRateForChallan(challan);
            const totalAmount = challan.mtr * rate;
            
            totalPcs += challan.pcs;
            totalMtr += challan.mtr;
            totalVal += totalAmount;

            wsData.push([
                challan.challanNumber,
                formatDate(challan.date),
                challan.partyDCNo || '-',
                challan.process.join(', '),
                challan.designNo,
                challan.pcs,
                parseFloat(challan.mtr.toFixed(2)),
                parseFloat(rate.toFixed(2)),
                parseFloat(totalAmount.toFixed(2))
            ]);
        });

        // Add Totals Row
        wsData.push([
            "TOTAL", "", "", "", "", 
            totalPcs, 
            parseFloat(totalMtr.toFixed(2)), 
            "", 
            parseFloat(totalVal.toFixed(2))
        ]);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Basic Merging for Header
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Company Name
            { s: { r: 5, c: 0 }, e: { r: 5, c: 8 } }, // Statement Title
        ];

        // Column widths
        ws['!cols'] = [
            { wch: 15 }, // Challan #
            { wch: 12 }, // Date
            { wch: 15 }, // Party DC
            { wch: 30 }, // Process
            { wch: 15 }, // Design
            { wch: 10 }, // Pcs
            { wch: 12 }, // Meters
            { wch: 10 }, // Rate
            { wch: 15 }  // Amount
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Statement");
        XLSX.writeFile(wb, `Statement_${client.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
    
    return (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6 no-print">
                <h1 className="text-xl font-bold text-gray-800">Client Statement</h1>
                <div className="flex gap-3">
                    <button onClick={onBack} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300">
                        Back
                    </button>
                    <button onClick={handleDownloadExcel} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-semibold hover:bg-green-700">
                        <DownloadIcon className="w-4 h-4 mr-2" /> Download Excel
                    </button>
                    <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-700">
                        <PrintIcon className="w-4 h-4 mr-2" /> Print / PDF
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
                        <h1 className="text-2xl font-bold text-gray-800 uppercase">Account SUMMARY</h1>
                     </div>
                </div>

                {/* Client Info (Restyled) */}
                <div className="mb-8">
                    <p className="text-sm text-gray-500 mb-1">To,</p>
                    <h3 className="text-lg font-bold text-gray-900 uppercase">{client.name}</h3>
                    <p className="text-gray-600">{client.address}</p>
                    <p className="text-gray-600">{client.city} - {client.pincode}</p>
                    {client.gstNo && <p className="text-gray-600 mt-1"><span className="font-semibold">GSTIN:</span> {client.gstNo}</p>}
                </div>

                {/* Delivery Challans Section */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-1">Delivery Challans</h2>
                     {sortedChallans.length > 0 ? (
                        <div className="overflow-hidden border rounded-lg">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 border-b">Challan #</th>
                                        <th className="px-4 py-3 border-b">Date</th>
                                        <th className="px-4 py-3 border-b">Party DC No</th>
                                        <th className="px-4 py-3 border-b">Process</th>
                                        <th className="px-4 py-3 border-b">Design No</th>
                                        <th className="px-4 py-3 border-b text-right">Pcs</th>
                                        <th className="px-4 py-3 border-b text-right">Meters</th>
                                        <th className="px-4 py-3 border-b text-right">Unit Price</th>
                                        <th className="px-4 py-3 border-b text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedChallans.map(challan => {
                                        const rate = getRateForChallan(challan);
                                        const totalAmount = challan.mtr * rate;
                                        return (
                                            <tr key={challan.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{challan.challanNumber}</td>
                                                <td className="px-4 py-3">{formatDate(challan.date)}</td>
                                                <td className="px-4 py-3">{challan.partyDCNo || '-'}</td>
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
