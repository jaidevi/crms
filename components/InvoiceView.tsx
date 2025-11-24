
import React from 'react';
import type { Invoice, Client, CompanyDetails } from '../App';

interface InvoiceViewProps {
    invoice: Invoice;
    client: Client;
    companyDetails: CompanyDetails;
    onBack: () => void;
}

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const date = new Date(isoDate + 'T00:00:00');
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(date);
};

const numberFormat = (num: number, options?: Intl.NumberFormatOptions) => {
    const defaultOptions: Intl.NumberFormatOptions = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    return new Intl.NumberFormat('en-IN', { ...defaultOptions, ...options }).format(num);
};

// Vel Logo SVG Data URI
const VEL_LOGO_URL = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTUwIj48cmVjdCB4PSI0NiIgeT0iMTAwIiB3aWR0aD0iOCIgaGVpZ2h0PSI1MCIgZmlsbD0iI2I0NTMwOSIgLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjE0OCIgcj0iNCIgZmlsbD0iI2I0NTMwOSIgLz48cGF0aCBkPSJNNDAgMTAwIFE1MCAxMTAgNjAgMTAwIiBzdHJva2U9IiNiNDUzMDkiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48cGF0aCBkPSJNNDIgMTA1IFE1MCAxMTUgNTggMTA1IiBzdHJva2U9IiNiNDUzMDkiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48cGF0aCBkPSJNNDQgMTEwIFE1MCAxMTggNTYgMTEwIiBzdHJva2U9IiNiNDUzMDkiIHN0cm9rZS13aWR0aD0iMyIgZmlsbD0ibm9uZSIgLz48cGF0aCBkPSJNNTAgNSBDIDg1IDQwIDg1IDgwIDUwIDEwMCBDIDE1IDgwIDE1IDQwIDUwIDUgWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjk3MzE2IiBzdHJva2Utd2lkdGg9IjQiIC8+PHBhdGggZD0iTTUwIDQ1IEMgNjUgNjAgNjUgODAgNTAgOTAgQyAzNSA4MCAzNSA2MCA1MCA0NSBaIiBmaWxsPSIjMWQ0ZWQ4IiAvPjxsaW5lIHgxPSIzNSIgeTE9IjI1IiB4Mj0iNjUiIHkyPSIyNSIgc3Ryb2tlPSIjOWNhM2FmIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgLz48bGluZSB4MT0iMzIiIHkxPSIzMiIgeDI9IjY4IiB5Mj0iMzIiIHN0cm9rZT0iIzljYTNhZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIC8+PGxpbmUgeDE9IjM1IiB5MT0iMzkiIHgyPSI2NSIgeTI9IjM5IiBzdHJva2U9IiM5Y2EzYWYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiAvPjxjaXJjbGUgY3g9IjUwIiBjeT0iMzIiIHI9IjQiIGZpbGw9IiNkYzI2MjYiIC8+PC9zdmc+";

const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, client, companyDetails, onBack }) => {
    
    const handlePrint = () => {
        window.print();
    };

    const totalQty = invoice.items.reduce((sum, i) => sum + i.mtr, 0);

    // Safe parsing for display
    const getInvoiceNumberParts = (fullNumber: string) => {
        const match = fullNumber.match(/^(.*?)(\d+)$/);
        if (match) {
            return { prefix: match[1], number: match[2] };
        }
        return { prefix: fullNumber, number: '' };
    };
    
    const { prefix, number } = getInvoiceNumberParts(invoice.invoiceNumber);

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6 no-print">
                <h1 className="text-xl font-semibold text-secondary-800">Invoice Details</h1>
                <div>
                    <button onClick={onBack} className="px-4 py-2 mr-2 bg-secondary-200 text-secondary-800 rounded-md text-sm font-semibold hover:bg-secondary-300">
                        Back to List
                    </button>
                    <button 
                        type="button"
                        onClick={handlePrint} 
                        className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-700 shadow-sm"
                    >
                        Print Invoice
                    </button>
                </div>
            </div>

            <div id="printable-invoice" className="max-w-5xl mx-auto bg-white p-8 text-gray-800 font-sans border border-secondary-200">
                
                {/* Header Section */}
                <div className="flex justify-between items-start mb-4">
                     <div className="flex items-start">
                        <div className="w-24 h-32 mr-4">
                             <img src={VEL_LOGO_URL} alt="Company Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-blue-700 mb-1">{companyDetails.name}</h2>
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
                        </div>
                     </div>
                     
                     <div className="text-right min-w-[250px]">
                         {/* Invoice Number & Date Row moved here */}
                        <div className="mb-6">
                            <div className="flex items-baseline justify-end">
                                <h1 className="text-2xl font-bold text-blue-700 mr-2">
                                    {prefix}
                                </h1>
                                <span className="text-2xl font-bold text-gray-900">
                                     {number}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                Date: <span className="font-semibold text-gray-900">{formatDateForDisplay(invoice.invoiceDate)}</span>
                            </div>
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

                {/* Items Table */}
                <div className="mb-8">
                    <div className="w-full h-1 bg-blue-600 mb-0"></div>
                    <table className="w-full border-collapse">
                         <thead>
                            <tr className="bg-blue-600 text-white text-xs font-bold uppercase">
                               <th className="py-2 px-2 text-center w-12">S.NO</th>
                               <th className="py-2 px-2 text-left">PRODUCT/SERVICE NAME</th>
                               <th className="py-2 px-2 text-center w-24">HSN/SAC</th>
                               <th className="py-2 px-2 text-center w-20">QTY</th>
                               <th className="py-2 px-2 text-right w-24">UNIT PRICE</th>
                               <th className="py-2 px-2 text-right w-24">CGST</th>
                               <th className="py-2 px-2 text-right w-24">SGST</th>
                               <th className="py-2 px-2 text-right w-28">AMOUNT</th>
                            </tr>
                         </thead>
                         <tbody className="text-gray-800 text-sm">
                            {invoice.items.map((item, index) => (
                                <tr key={item.id} className="border-b border-gray-200">
                                    <td className="py-3 px-2 text-center">{index + 1}</td>
                                    <td className="py-3 px-2 font-semibold">{item.process}</td>
                                    <td className="py-3 px-2 text-center">{item.hsnSac}</td>
                                    <td className="py-3 px-2 text-center">{numberFormat(item.mtr)}</td>
                                    <td className="py-3 px-2 text-right">{numberFormat(item.rate)}</td>
                                    <td className="py-3 px-2 text-right">{numberFormat(item.cgst)}</td>
                                    <td className="py-3 px-2 text-right">{numberFormat(item.sgst)}</td>
                                    <td className="py-3 px-2 text-right font-bold">₹{numberFormat(item.amount)}</td>
                                </tr>
                            ))}
                         </tbody>
                         <tfoot>
                             <tr className="border-t-2 border-gray-300 font-bold text-sm">
                                 <td colSpan={3} className="py-2 px-2 text-right">Total</td>
                                 <td className="py-2 px-2 text-center">{numberFormat(totalQty)}</td>
                                 <td className="py-2 px-2"></td>
                                 <td className="py-2 px-2 text-right">{numberFormat(invoice.totalCgst)}</td>
                                 <td className="py-2 px-2 text-right">{numberFormat(invoice.totalSgst)}</td>
                                 <td className="py-2 px-2 text-right">₹{numberFormat(invoice.totalAmount - invoice.roundedOff)}</td>
                             </tr>
                         </tfoot>
                    </table>
                </div>

                {/* Footer Section */}
                <div className="grid grid-cols-2 gap-8">
                     <div className="flex flex-col justify-between">
                        {/* Signature Area */}
                        <div className="mt-8">
                           <p className="text-sm font-semibold text-gray-800">Authorized Signature</p>
                           <div className="h-16 border-b border-gray-300 w-48"></div>
                        </div>
                        
                        {/* Bank Details */}
                        <div className="mt-8 text-sm">
                            <div className="text-gray-800">
                                <div className="font-bold mb-1">Note:</div>
                                <p className="font-semibold">{companyDetails.bankName}: {companyDetails.bankAccountNumber}</p>
                                <p>IFSC CODE: {companyDetails.bankIfscCode}</p>
                            </div>
                        </div>
                     </div>

                     <div>
                        <table className="w-full text-right text-sm">
                            <tbody>
                                <tr>
                                   <td className="py-1 text-gray-600 pr-4">Total Before Tax</td>
                                   <td className="py-1 font-medium">₹{numberFormat(invoice.subTotal)}</td>
                                </tr>
                                <tr>
                                   <td className="py-1 text-gray-600 pr-4">Total Tax Amount</td>
                                   <td className="py-1 font-medium">₹{numberFormat(invoice.totalTaxAmount)}</td>
                                </tr>
                                <tr>
                                   <td className="py-1 text-gray-600 pr-4">Rounded Off</td>
                                   <td className="py-1 font-medium">{invoice.roundedOff > 0 ? '+' : ''}{invoice.roundedOff.toFixed(2)}</td>
                                </tr>
                                <tr className="border-t border-gray-300">
                                   <td className="py-2 text-gray-800 font-bold pr-4 text-base">Total Amount</td>
                                   <td className="py-2 text-gray-800 font-bold text-base">₹{numberFormat(invoice.totalAmount, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
                                </tr>
                            </tbody>
                        </table>
                     </div>
                </div>

            </div>
        </div>
    );
};

export default InvoiceView;