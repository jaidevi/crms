
import React from 'react';
import type { Employee, CompanyDetails, Payslip } from '../types';

type PayslipData = Pick<Payslip, 
    'payslipDate' | 
    'payPeriodStart' | 
    'payPeriodEnd' | 
    'totalWorkingDays' | 
    'otHours' | 
    'wageEarnings' |
    'productionEarnings' |
    'grossSalary' | 
    'advanceDeduction' | 
    'netSalary' | 
    'totalOutstandingAdvance'
>;

interface PayslipViewProps {
    employee: Employee;
    payslip: PayslipData;
    companyDetails: CompanyDetails;
    onBack: () => void;
    // FIX: Added optional onFinalizeSalary prop to support PayslipGenerator component.
    onFinalizeSalary?: (employeeId: string, deductionAmount: number) => Promise<void>;
}

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const numberFormat = (num: number) => {
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

const PayslipView: React.FC<PayslipViewProps> = ({ employee, payslip, companyDetails, onBack, onFinalizeSalary }) => {
    
    const handlePrint = () => {
        window.print();
    };

    const handleFinalize = async () => {
        if (onFinalizeSalary) {
            await onFinalizeSalary(employee.id, payslip.advanceDeduction);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6 no-print">
                <h1 className="text-xl font-semibold text-secondary-800">Payslip Preview</h1>
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="px-4 py-2 bg-secondary-200 text-secondary-800 rounded-md text-sm font-semibold hover:bg-secondary-300">
                        Back
                    </button>
                    {onFinalizeSalary && (
                        <button onClick={handleFinalize} className="px-4 py-2 bg-success-600 text-white rounded-md text-sm font-semibold hover:bg-success-700">
                            Finalize Salary
                        </button>
                    )}
                    <button onClick={handlePrint} className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-700">
                        Print
                    </button>
                </div>
            </div>

            <div id="printable-payslip" className="max-w-4xl mx-auto bg-white p-8 text-sm font-sans text-secondary-800 border">
                <header className="text-center border-b pb-4">
                    <h2 className="text-2xl font-bold">{companyDetails.name}</h2>
                    <p className="text-secondary-600">{companyDetails.addressLine1}, {companyDetails.addressLine2}</p>
                    <h3 className="text-xl font-semibold mt-4">Payslip for the Period of {formatDateForDisplay(payslip.payPeriodStart)} to {formatDateForDisplay(payslip.payPeriodEnd)}</h3>
                </header>

                <section className="grid grid-cols-2 gap-8 my-6 text-sm">
                    <div>
                        <p><strong className="w-28 inline-block">Employee ID:</strong> {employee.id.substring(0,8)}</p>
                        <p><strong className="w-28 inline-block">Employee Name:</strong> {employee.name}</p>
                        <p><strong className="w-28 inline-block">Designation:</strong> {employee.designation}</p>
                    </div>
                    <div className="text-right">
                        <p><strong className="w-28 inline-block text-left">Payslip Date:</strong> {formatDateForDisplay(payslip.payslipDate)}</p>
                        <p><strong className="w-28 inline-block text-left">Working Days:</strong> {payslip.totalWorkingDays}</p>
                        <p><strong className="w-28 inline-block text-left">OT Hours:</strong> {payslip.otHours}</p>
                    </div>
                </section>

                <section>
                    <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="bg-secondary-100 text-xs uppercase">
                                <th className="p-2 w-1/2 font-semibold border">Earnings</th>
                                <th className="p-2 w-1/4 text-right font-semibold border">Amount</th>
                                <th className="p-2 w-1/2 font-semibold border">Deductions</th>
                                <th className="p-2 w-1/4 text-right font-semibold border">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="p-2 border-l">Wage Earnings</td>
                                <td className="p-2 text-right border-r">₹{numberFormat(payslip.wageEarnings)}</td>
                                <td className="p-2 border-l">Advance Deduction</td>
                                <td className="p-2 text-right border-r">₹{numberFormat(payslip.advanceDeduction)}</td>
                            </tr>
                             <tr className="border-b">
                                <td className="p-2 border-l">Production Earnings</td>
                                <td className="p-2 text-right border-r">₹{numberFormat(payslip.productionEarnings)}</td>
                                <td className="p-2 border-l"></td>
                                <td className="p-2 text-right border-r"></td>
                            </tr>
                            <tr className="font-semibold bg-secondary-50">
                                <td className="p-2 border-l">Gross Earnings</td>
                                <td className="p-2 text-right border-r">₹{numberFormat(payslip.grossSalary)}</td>
                                <td className="p-2 border-l">Total Deductions</td>
                                <td className="p-2 text-right border-r">₹{numberFormat(payslip.advanceDeduction)}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
                
                <section className="mt-6 flex justify-end">
                    <div className="w-1/2 space-y-2 text-sm">
                         <div className="flex justify-between">
                            <span>Total Outstanding Advance:</span>
                            <span className="font-medium">₹{numberFormat(payslip.totalOutstandingAdvance)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                            <span>Net Salary Payable:</span>
                            <span>₹{numberFormat(payslip.netSalary)}</span>
                        </div>
                    </div>
                </section>

                <footer className="mt-12 pt-6 border-t text-xs text-secondary-500">
                    <p>This is a computer-generated payslip and does not require a signature.</p>
                </footer>
            </div>
        </div>
    );
};

export default PayslipView;
