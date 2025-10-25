import React, { useState, useMemo } from 'react';
import type { Employee, AttendanceRecord, EmployeeAdvance, CompanyDetails, AttendanceStatus } from '../App';
import DatePicker from './DatePicker';
import PayslipView from './PayslipView';
import { CalendarIcon, SearchIcon } from './Icons';

interface PayslipGeneratorProps {
    employees: Employee[];
    attendanceRecords: AttendanceRecord[];
    advances: EmployeeAdvance[];
    onFinalizeSalary: (employeeId: string, deductionAmount: number) => Promise<void>;
    companyDetails: CompanyDetails;
}

export interface PayslipData {
    payslipDate: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    totalWorkingDays: number;
    otHours: number;
    grossSalary: number;
    totalOutstandingAdvance: number;
    advanceDeduction: number;
    netSalary: number;
}

const toYMDString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};


const PayslipGenerator: React.FC<PayslipGeneratorProps> = ({ employees, attendanceRecords, advances, onFinalizeSalary, companyDetails }) => {
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [error, setError] = useState('');
    
    const [payslipData, setPayslipData] = useState<PayslipData | null>(null);

    const [isStartDatePickerOpen, setStartDatePickerOpen] = useState(false);
    const [isEndDatePickerOpen, setEndDatePickerOpen] = useState(false);

    const sortedEmployees = useMemo(() => [...employees].sort((a, b) => a.name.localeCompare(b.name)), [employees]);
    const selectedEmployee = useMemo(() => employees.find(e => e.id === selectedEmployeeId), [employees, selectedEmployeeId]);
    
    const attendanceMap = useMemo(() => {
        const map = new Map<string, AttendanceRecord>();
        attendanceRecords.forEach(rec => {
            const key = `${rec.employee_id}|${rec.date}`;
            map.set(key, rec);
        });
        return map;
    }, [attendanceRecords]);

    const handleGenerate = () => {
        setError('');
        setPayslipData(null);

        if (!selectedEmployeeId || !startDate || !endDate || !selectedEmployee) {
            setError('Please select an employee and a valid date range.');
            return;
        }

        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');

        if (start > end) {
            setError('Start date cannot be after the end date.');
            return;
        }

        let totalPresentDays = 0;
        let totalOvertimeHours = 0;

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateString = toYMDString(d);
            const key = `${selectedEmployeeId}|${dateString}`;
            const record = attendanceMap.get(key);
            
            if (record) {
                if (record.morningStatus === 'Present' || record.morningStatus === 'Holiday') totalPresentDays += 0.5;
                if (record.eveningStatus === 'Present' || record.eveningStatus === 'Holiday') totalPresentDays += 0.5;
                totalOvertimeHours += (record.morningOvertimeHours || 0) + (record.eveningOvertimeHours || 0);
            }
        }

        const advancesInPeriod = advances.filter(adv => {
            if (adv.employeeId !== selectedEmployeeId) return false;
            const advanceDate = new Date(adv.date + 'T00:00:00');
            return advanceDate >= start && advanceDate <= end;
        });
        const advanceDeduction = advancesInPeriod.reduce((sum, adv) => sum + adv.amount, 0);
        
        const allAdvancesForEmployee = advances.filter(adv => adv.employeeId === selectedEmployeeId);
        const totalOutstandingBefore = allAdvancesForEmployee.reduce((sum, adv) => sum + (adv.amount - adv.paidAmount), 0);
        
        // The outstanding balance shown on the payslip should be the remaining balance *after* this deduction.
        const finalOutstandingBalance = totalOutstandingBefore - advanceDeduction;

        const grossSalary = totalPresentDays * selectedEmployee.dailyWage;
        const netSalary = grossSalary - advanceDeduction;
        
        setPayslipData({
            payslipDate: toYMDString(new Date()),
            payPeriodStart: startDate,
            payPeriodEnd: endDate,
            totalWorkingDays: totalPresentDays,
            otHours: totalOvertimeHours,
            grossSalary,
            totalOutstandingAdvance: finalOutstandingBalance,
            advanceDeduction,
            netSalary,
        });
    };

    if (payslipData && selectedEmployee) {
        return (
            <PayslipView
                employee={selectedEmployee}
                payslip={payslipData}
                companyDetails={companyDetails}
                onBack={() => setPayslipData(null)}
                onFinalizeSalary={onFinalizeSalary}
            />
        );
    }
    
    return (
        <div className="p-6 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                    <select
                        value={selectedEmployeeId}
                        onChange={e => setSelectedEmployeeId(e.target.value)}
                        className="block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="">-- Select an Employee --</option>
                        {sortedEmployees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <div className="relative">
                        <button type="button" onClick={() => setStartDatePickerOpen(p => !p)} className="block w-full text-sm rounded-md border shadow-sm bg-white px-3 py-2.5 flex items-center justify-between text-left font-normal border-gray-300">
                            <span className={startDate ? 'text-gray-900' : 'text-gray-500'}>{formatDateForDisplay(startDate) || 'Select date'}</span>
                            <CalendarIcon className="w-5 h-5 text-gray-400" />
                        </button>
                        {isStartDatePickerOpen && <DatePicker value={startDate} onChange={d => { setStartDate(d); setStartDatePickerOpen(false); }} onClose={() => setStartDatePickerOpen(false)} />}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <div className="relative">
                        <button type="button" onClick={() => setEndDatePickerOpen(p => !p)} className="block w-full text-sm rounded-md border shadow-sm bg-white px-3 py-2.5 flex items-center justify-between text-left font-normal border-gray-300">
                            <span className={endDate ? 'text-gray-900' : 'text-gray-500'}>{formatDateForDisplay(endDate) || 'Select date'}</span>
                            <CalendarIcon className="w-5 h-5 text-gray-400" />
                        </button>
                        {isEndDatePickerOpen && <DatePicker value={endDate} onChange={d => { setEndDate(d); setEndDatePickerOpen(false); }} onClose={() => setEndDatePickerOpen(false)} />}
                    </div>
                </div>
                <div className="md:col-start-4">
                    <button onClick={handleGenerate} className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-blue-700">
                        <SearchIcon className="w-5 h-5 mr-2" />
                        Generate Payslip
                    </button>
                </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
};

export default PayslipGenerator;