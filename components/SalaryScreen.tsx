
import React, { useState, useMemo } from 'react';
import PayslipGenerator from './PayslipGenerator';
import { TrashIcon, PrintIcon, SearchIcon } from './Icons';
import PayslipView from './PayslipView';
import type { Employee, AttendanceRecord, EmployeeAdvance, CompanyDetails, Payslip } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface SalaryScreenProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onUpdateEmployee: (id: string, employee: Employee) => Promise<void>;
  advances: EmployeeAdvance[];
  onSavePayslip: (payslip: Omit<Payslip, 'id'>) => Promise<void>;
  onDeletePayslip: (id: string) => void;
  companyDetails: CompanyDetails;
  payslips: Payslip[];
}

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const SalaryScreen: React.FC<SalaryScreenProps> = ({
    employees, attendanceRecords, onUpdateEmployee, advances, onSavePayslip, onDeletePayslip, companyDetails, payslips
}) => {
    const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
    const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);
    const [payslipToDelete, setPayslipToDelete] = useState<Payslip | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPayslips = useMemo(() => {
        const sorted = [...payslips].sort((a, b) => new Date(b.payslipDate).getTime() - new Date(a.payslipDate).getTime());
        if (!searchTerm) return sorted;
        const lowercasedTerm = searchTerm.toLowerCase();
        return sorted.filter(p =>
            p.employeeName.toLowerCase().includes(lowercasedTerm)
        );
    }, [payslips, searchTerm]);

    if (viewingPayslip) {
        // Construct a safe employee object even if the employee was deleted
        const employeeForView = employees.find(e => e.id === viewingPayslip.employeeId) || {
            id: viewingPayslip.employeeId,
            name: viewingPayslip.employeeName,
            designation: 'N/A',
            phone: '',
            dailyWage: 0,
            ratePerMeter: 0
        } as Employee;

        return (
            <PayslipView
                employee={employeeForView}
                payslip={viewingPayslip}
                companyDetails={companyDetails}
                onBack={() => setViewingPayslip(null)}
            />
        );
    }

    const tabButtonClasses = (tabName: 'generate' | 'history') => 
        `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm ${
            activeTab === tabName 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {payslipToDelete && (
                <ConfirmationModal
                    isOpen={!!payslipToDelete}
                    onClose={() => setPayslipToDelete(null)}
                    onConfirm={() => {
                        onDeletePayslip(payslipToDelete.id);
                        setPayslipToDelete(null);
                    }}
                    title="Delete Payslip"
                    message={`Are you sure you want to delete the payslip for ${payslipToDelete.employeeName}? This action cannot be undone.`}
                />
            )}

            <div className="p-5 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800">Salary & Payslips</h1>
                <p className="text-gray-500 mt-1">Generate and manage employee payslips.</p>
            </div>

            <div className="border-b border-gray-200 px-5">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('generate')} className={tabButtonClasses('generate')}>
                        Generate Payslip
                    </button>
                    <button onClick={() => setActiveTab('history')} className={tabButtonClasses('history')}>
                        Payslip History
                    </button>
                </nav>
            </div>

            {activeTab === 'generate' && (
                <PayslipGenerator
                    employees={employees}
                    attendanceRecords={attendanceRecords}
                    advances={advances}
                    onSave={onSavePayslip}
                    companyDetails={companyDetails}
                />
            )}

            {activeTab === 'history' && (
                <div className="p-5 space-y-5">
                    <div className="flex justify-between items-center">
                        <div className="relative w-full md:w-64">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by employee name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Payslip Date</th>
                                    <th scope="col" className="px-6 py-3">Employee</th>
                                    <th scope="col" className="px-6 py-3">Pay Period</th>
                                    <th scope="col" className="px-6 py-3 text-right">Net Salary</th>
                                    <th scope="col" className="px-6 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayslips.map((payslip) => (
                                    <tr key={payslip.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4">{formatDateForDisplay(payslip.payslipDate)}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{payslip.employeeName}</td>
                                        <td className="px-6 py-4">
                                            {formatDateForDisplay(payslip.payPeriodStart)} - {formatDateForDisplay(payslip.payPeriodEnd)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">₹{payslip.netSalary.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                <button onClick={() => setViewingPayslip(payslip)} className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50" title="View/Print">
                                                    <PrintIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => setPayslipToDelete(payslip)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50" title="Delete">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredPayslips.length === 0 && (
                            <div className="text-center p-8 text-gray-500">
                                No payslip history found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalaryScreen;
