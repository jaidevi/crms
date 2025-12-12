
import React from 'react';
import type { DeliveryChallan, CompanyDetails } from '../types';

interface ChallanViewProps {
    challan: DeliveryChallan;
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

const ChallanView: React.FC<ChallanViewProps> = ({ challan, companyDetails, onBack }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
            <div className="flex justify-end items-center mb-6 no-print">
                <div>
                    <button onClick={onBack} className="px-4 py-2 mr-2 bg-secondary-200 text-secondary-800 rounded-md text-sm font-semibold hover:bg-secondary-300">
                        Back to List
                    </button>
                    <button onClick={handlePrint} className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-700">
                        Print Challan
                    </button>
                </div>
            </div>

            <div id="printable-challan" className="max-w-4xl mx-auto bg-white p-8 text-sm font-sans text-secondary-800 border border-secondary-300">
                {/* Header */}
                <header className="flex justify-between items-start pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-primary-700">{companyDetails.name}</h2>
                        <p className="text-secondary-600">{companyDetails.addressLine1}</p>
                        <p className="text-secondary-600">{companyDetails.addressLine2}</p>
                        <p className="text-secondary-600 mt-2">GSTIN: {companyDetails.gstin}</p>
                    </div>
                    <div className="text-right">
                        <h1 className="text-2xl font-bold tracking-wide uppercase text-secondary-800">
                            JOB WORK CHALLAN
                        </h1>
                        <p className="text-secondary-600 mt-2">Challan No: <span className="font-semibold">{challan.challanNumber}</span></p>
                        <p className="text-secondary-600">Date: <span className="font-semibold">{formatDateForDisplay(challan.date)}</span></p>
                    </div>
                </header>

                <div className="border-b border-secondary-200 my-4"></div>
                
                {/* From and To section removed as per user request */}
                
                <section className="my-6">
                    <table className="w-full text-left border-collapse border">
                        <thead>
                           <tr className="bg-secondary-100 text-xs uppercase">
                                <th className="p-2 w-12 text-center font-semibold border">S.NO</th>
                                <th className="p-2 font-semibold border">DESCRIPTION OF GOODS</th>
                                <th className="p-2 w-24 text-right font-semibold border">PCS</th>
                                <th className="p-2 w-24 text-right font-semibold border">METERS</th>
                            </tr>
                        </thead>
                        <tbody className="text-secondary-700">
                             <tr className="border-b">
                                <td className="p-2 text-center border align-top">1</td>
                                <td className="p-2 font-medium border align-top leading-relaxed">
                                    {/* Logic: If split process exists, show ONLY split process. Else show main process. */}
                                    {challan.splitProcess && challan.splitProcess.length > 0 ? (
                                        <>
                                            <span className="font-semibold">Process:</span> {challan.splitProcess.join(', ')} <br/>
                                        </>
                                    ) : (
                                        <>
                                            <span className="font-semibold">Process:</span> {challan.process.join(', ')} <br/>
                                        </>
                                    )}
                                    <span className="font-semibold">Design No:</span> {challan.designNo} <br/>
                                    <span className="font-semibold">Party DC No:</span> {challan.partyDCNo}
                                    {challan.percentage && (
                                        <>
                                            <br/>
                                            <span className="font-semibold">Percentage:</span> {challan.percentage}
                                        </>
                                    )}
                                </td>
                                <td className="p-2 text-right border align-top">{challan.pcs}</td>
                                <td className="p-2 text-right border align-top">{challan.mtr.toFixed(2)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="font-bold bg-secondary-50">
                                <td colSpan={2} className="p-2 text-right border font-bold">TOTAL</td>
                                <td className="p-2 text-right border font-bold">{challan.pcs}</td>
                                <td className="p-2 text-right border font-bold">{challan.mtr.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </section>
                
                <section className="flex justify-between mt-12">
                     <div className="text-xs text-secondary-500 space-y-1">
                        <h4 className="font-bold mb-1 text-secondary-700">Terms & Conditions:</h4>
                        <p>1. Interest @18% p.a. will be charged if the bill is not paid within the due date.</p>
                        <p>2. This is a computer generated challan.</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <div className="mt-20 w-56 text-center">
                             <p className="font-semibold">For {companyDetails.name}</p>
                             <div className="mt-16 border-t border-secondary-300 pt-1">
                                <p>Authorized Signatory</p>
                             </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ChallanView;
