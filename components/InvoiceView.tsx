
import React from 'react';
import type { Invoice, Client, CompanyDetails } from '../App';
import { InvoiceIcon } from './Icons'; 

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
        year: 'numeric',
        month: 'long',
        day: '2-digit',
    }).format(date);
};

const numberFormat = (num: number, options?: Intl.NumberFormatOptions) => {
    const defaultOptions: Intl.NumberFormatOptions = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    return new Intl.NumberFormat('en-IN', { ...defaultOptions, ...options }).format(num);
};

const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice, client, companyDetails, onBack }) => {
    
    const handlePrint = () => {
        window.print();
    };

    const totalQty = invoice.items.reduce((sum, i) => sum + i.mtr, 0);

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6 no-print">
                <h1 className="text-xl font-semibold text-gray-800">Invoice Details</h1>
                <div>
                    <button onClick={onBack} className="px-4 py-2 mr-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300">
                        Back to List
                    </button>
                    <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">
                        Print Invoice
                    </button>
                </div>
            </div>

            <div id="printable-invoice" className="max-w-4xl mx-auto bg-white p-8 text-sm font-sans text-gray-800">
                {/* Header */}
                <header className="flex justify-between items-start pb-4">
                    <div className="flex items-center">
                         <div className="w-12 h-20 mr-4">
                            <svg viewBox="0 0 64 100" xmlns="http://www.w3.org/2000/svg">
                                <path d="M32,0 C12,25 12,45 32,70 C52,45 52,25 32,0 Z" fill="#c7a44a"/>
                                <rect x="30" y="68" width="4" height="32" fill="#c7a44a"/>
                                <path d="M24 25 Q 32 24 40 25" stroke="#F5F5F5" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <path d="M24 29 Q 32 28 40 29" stroke="#F5F5F5" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <path d="M24 33 Q 32 32 40 33" stroke="#F5F5F5" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                                <circle cx="32" cy="29" r="3" fill="#E53935"/>
                                <path d="M32,38 C25,42 25,55 32,60 C39,55 39,42 32,38 Z" fill="#283593"/>
                                <path d="M32 44 V 50 C 32 54 30 55 29 52 M 32 50 C 32 54 34 55 35 52" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-orange-500">{companyDetails.name}</h2>
                            <p className="text-gray-600 whitespace-pre-line">{companyDetails.addressLine1}</p>
                            <p className="text-gray-600 whitespace-pre-line">{companyDetails.addressLine2}</p>
                            <p className="text-gray-600 mt-2">
                                <span role="img" aria-label="phone">☎️</span> {companyDetails.phone}
                            </p>
                            <p className="text-gray-600">
                                <span role="img" aria-label="email">@</span> {companyDetails.email}
                            </p>
                            <p className="text-gray-600">
                                <span role="img" aria-label="gst">ⓘ</span> GSTIN: {companyDetails.gstin}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-bold tracking-wide uppercase">
                            <span className="text-orange-500">{invoice.invoiceNumber.replace(/\d/g, '').trim()}</span>
                            <span className="text-gray-800"> {invoice.invoiceNumber.match(/\d+/g)}</span>
                        </h1>
                        <p className="text-gray-600 mt-1">Date: {formatDateForDisplay(invoice.invoiceDate)}</p>
                    </div>
                </header>
                
                <div className="w-full h-1 bg-orange-400 my-4"></div>

                {/* Bill To Section */}
                <section className="mt-6 pb-6">
                    <div>
                        <h3 className="font-semibold text-blue-600 mb-2">Bill to:</h3>
                        <p className="font-bold text-gray-800 text-base">{client.name}</p>
                        <p className="text-gray-600 whitespace-pre-line">{client.address}</p>
                        <p className="text-gray-600">{client.city}, {client.state}, PIN Code {client.pincode}, India</p>
                        <p className="text-gray-600 mt-2">
                            <span role="img" aria-label="supply">ⓘ</span> Place of Supply: {client.state} (TN)
                        </p>
                        <p className="text-gray-600">GSTIN: {client.gstNo}</p>
                    </div>
                </section>

                {/* Items Table */}
                <section>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-orange-400 text-white text-xs uppercase">
                                <th className="p-2 w-12 text-center font-semibold">NO</th>
                                <th className="p-2 font-semibold">PRODUCT / SERVICE NAME</th>
                                <th className="p-2 w-24 text-center font-semibold">HSN/SAC</th>
                                <th className="p-2 w-24 text-right font-semibold">QTY</th>
                                <th className="p-2 w-28 text-right font-semibold">UNIT PRICE</th>
                                <th className="p-2 w-24 text-right font-semibold">CGST</th>
                                <th className="p-2 w-24 text-right font-semibold">SGST</th>
                                <th className="p-2 w-32 text-right font-semibold">AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {invoice.items.map((item, index) => (
                                <tr key={item.id} className="border-b border-gray-200">
                                    <td className="p-2 text-center">{index + 1}</td>
                                    <td className="p-2">
                                        <p className="font-medium">{item.process}</p>
                                        {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                                    </td>
                                    <td className="p-2 text-center">{item.hsnSac}</td>
                                    <td className="p-2 text-right">{numberFormat(item.mtr)}</td>
                                    <td className="p-2 text-right">{numberFormat(item.rate)}</td>
                                    <td className="p-2 text-right">{numberFormat(item.cgst)}</td>
                                    <td className="p-2 text-right">{numberFormat(item.sgst)}</td>
                                    <td className="p-2 text-right font-semibold text-gray-800">₹{numberFormat(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-bold bg-gray-50 border-t-2 border-gray-300">
                                <td colSpan={3} className="p-2 text-right">TOTAL</td>
                                <td className="p-2 text-right">{numberFormat(totalQty)}</td>
                                <td className="p-2"></td>
                                <td className="p-2 text-right">{numberFormat(invoice.totalCgst)}</td>
                                <td className="p-2 text-right">{numberFormat(invoice.totalSgst)}</td>
                                <td className="p-2 text-right">₹{numberFormat(invoice.subTotal + invoice.totalTaxAmount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </section>
                
                {/* Footer Section */}
                <section className="grid grid-cols-2 gap-8 mt-8">
                    <div className="pt-8">
                        <p className="font-semibold mb-12">AUTHORIZED SIGNATORY</p>
                        <div className="border-t-2 border-gray-300 w-48 pt-2"></div>
                         <div className="mt-4 text-xs text-gray-500 space-y-1">
                            <h4 className="font-bold mb-1 text-gray-700">Note:</h4>
                            <p className="mt-2 font-semibold">{companyDetails.bankName}: {companyDetails.bankAccountNumber}</p>
                            <p>IFSC CODE: {companyDetails.bankIfscCode}</p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col justify-end">
                       <table className="w-full text-right">
                           <tbody className="text-gray-700">
                               <tr>
                                   <td className="py-1.5 pr-4">TOTAL BEFORE TAX</td>
                                   <td className="py-1.5 font-medium">₹{numberFormat(invoice.subTotal)}</td>
                               </tr>
                               <tr>
                                   <td className="py-1.5 pr-4">TOTAL TAX AMOUNT</td>
                                   <td className="py-1.5 font-medium">₹{numberFormat(invoice.totalTaxAmount)}</td>
                               </tr>
                               <tr>
                                   <td className="py-1.5 pr-4">ROUNDED OFF</td>
                                   <td className="py-1.5 font-medium">{invoice.roundedOff.toFixed(2)}</td>
                               </tr>
                               <tr className="text-base font-bold text-gray-900 border-t-2 border-gray-300">
                                   <td className="py-2 pr-4">TOTAL AMOUNT</td>
                                   <td className="py-2">₹{numberFormat(invoice.totalAmount, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
                               </tr>
                               <tr className="text-base font-bold text-orange-500">
                                   <td className="py-1.5 pr-4">AMOUNT DUE</td>
                                   <td className="py-1.5">₹{numberFormat(invoice.totalAmount, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
                               </tr>
                           </tbody>
                       </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default InvoiceView;
