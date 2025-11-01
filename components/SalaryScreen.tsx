import React, { useState, useMemo } from 'react';
import type { Employee, AttendanceRecord, AttendanceStatus, EmployeeAdvance, CompanyDetails, Payslip } from '../App';
import { CalendarIcon, SearchIcon, SpinnerIcon, CheckIcon } from './Icons';
import DatePicker from './DatePicker';
import PayslipView from './PayslipView';


interface SalaryScreenProps {
    employees: Employee[];
    attendanceRecords: AttendanceRecord[];
    onUpdateEmployee: (id: string, employee: Employee) => Promise<void>;
    advances: EmployeeAdvance[];
    onSavePayslip: (payslip: Omit<Payslip, 'id'>) => Promise<void>;
    companyDetails: CompanyDetails;
    payslips: Payslip[];
}

interface CalculationResult {
    details: {
        date: string;
        morningStatus: string;
        eveningStatus: string;
        overtimeHours: number;
        presentDays: number;
        metersProduced: number;
    }[];
    summary: {
        totalPresentDays: number;
        totalOvertimeHours: number;
        dailyWage: number;
        ratePerMeter: number;
        advancesInPeriod: number;
        totalOutstandingAdvance: number;
        totalMetersProduced: number;
    };
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

const SalaryScreen: React.FC<SalaryScreenProps> = ({ employees, attendanceRecords, onUpdateEmployee, advances, onSavePayslip, companyDetails, payslips }) => {
    const [activeTab, setActiveTab] = useState('calculator');

    // == SALARY CALCULATOR LOGIC ==
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isStartDatePickerOpen, setStartDatePickerOpen] = useState(false);
    const [isEndDatePickerOpen, setEndDatePickerOpen] = useState(false);
    const [result, setResult] = useState<CalculationResult | null>(null);
    const [error, setError] = useState<string>('');
    
    const [editableWage, setEditableWage] = useState<string>('');
    const [wageSaveState, setWageSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [editableRatePerMeter, setEditableRatePerMeter] = useState<string>('');
    const [rateSaveState, setRateSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

    const [editableDeduction, setEditableDeduction] = useState<string>('0');
    const [isCalculated, setIsCalculated] = useState(false);
    const [finalizeState, setFinalizeState] = useState<'idle' | 'saving' | 'saved'>('idle');


    const attendanceMap = useMemo(() => {
        const map = new Map<string, AttendanceRecord>();
        attendanceRecords.forEach(rec => {
            const key = `${rec.employee_id}|${rec.date}`;
            map.set(key, rec);
        });
        return map;
    }, [attendanceRecords]);
    
    const sortedEmployees = useMemo(() => [...employees].sort((a,b) => a.name.localeCompare(b.name)), [employees]);
    const selectedEmployee = useMemo(() => employees.find(e => e.id === selectedEmployeeId), [employees, selectedEmployeeId]);

    const handleCalculate = () => {
        setError('');
        setResult(null);
        setIsCalculated(false);
        setFinalizeState('idle');
        if (!selectedEmployeeId || !startDate || !endDate) {
            setError('Please select an employee and a valid date range.');
            return;
        }

        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');

        if (start > end) {
            setError('Start date cannot be after the end date.');
            return;
        }

        // Check for overlapping payslips
        const employeePayslips = payslips.filter(p => p.employeeId === selectedEmployeeId);
        const selectedStart = new Date(startDate + 'T00:00:00');
        const selectedEnd = new Date(endDate + 'T00:00:00');

        for (const payslip of employeePayslips) {
            const payslipStart = new Date(payslip.payPeriodStart + 'T00:00:00');
            const payslipEnd = new Date(payslip.payPeriodEnd + 'T00:00:00');

            // Overlap check: (StartA <= EndB) and (StartB <= EndA)
            if (selectedStart <= payslipEnd && payslipStart <= selectedEnd) {
                setError(`A payslip already exists for this employee within the selected date range. The existing payslip covers ${formatDateForDisplay(payslip.payPeriodStart)} to ${formatDateForDisplay(payslip.payPeriodEnd)}.`);
                return;
            }
        }


        const details: CalculationResult['details'] = [];
        let totalPresentDays = 0;
        let totalOvertimeHours = 0;
        let totalMetersProduced = 0;

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateString = toYMDString(d);
            const key = `${selectedEmployeeId}|${dateString}`;
            const record = attendanceMap.get(key);
            
            let morningStatus: AttendanceStatus | 'N/A' = 'N/A';
            let eveningStatus: AttendanceStatus | 'N/A' = 'N/A';
            let overtimeHours = 0;
            let presentDays = 0;
            let metersProduced = 0;

            if (record) {
                morningStatus = record.morningStatus;
                eveningStatus = record.eveningStatus;
                overtimeHours = record.morningOvertimeHours + record.eveningOvertimeHours;
                metersProduced = record.metersProduced || 0;
                
                if (record.morningStatus === 'Present' || record.morningStatus === 'Holiday') presentDays += 0.5;
                if (record.eveningStatus === 'Present' || record.eveningStatus === 'Holiday') presentDays += 0.5;
            }
            
            totalPresentDays += presentDays;
            totalOvertimeHours += overtimeHours;
            totalMetersProduced += metersProduced;

            details.push({
                date: dateString,
                morningStatus,
                eveningStatus,
                overtimeHours,
                presentDays,
                metersProduced,
            });
        }

        const advancesInPeriod = advances.filter(adv => {
            if (adv.employeeId !== selectedEmployeeId) return false;
            const advanceDate = new Date(adv.date + 'T00:00:00');
            return advanceDate >= start && advanceDate <= end;
        });

        const advancesInPeriodSum = advancesInPeriod.reduce((sum, adv) => sum + adv.amount, 0);

        const allAdvancesForEmployee = advances.filter(adv => adv.employeeId === selectedEmployeeId);
        const totalOutstandingAdvanceBefore = allAdvancesForEmployee.reduce((sum, adv) => sum + (adv.amount - adv.paidAmount), 0);
        
        const dailyWage = selectedEmployee?.dailyWage || 0;
        const ratePerMeter = selectedEmployee?.ratePerMeter || 0;
        setEditableWage(String(dailyWage));
        setEditableRatePerMeter(String(ratePerMeter));
        setEditableDeduction(String(Math.min(
            (totalPresentDays * dailyWage) + (totalMetersProduced * ratePerMeter),
            totalOutstandingAdvanceBefore
        )));

        setIsCalculated(true);

        setResult({
            details,
            summary: {
                totalPresentDays,
                totalOvertimeHours,
                dailyWage,
                ratePerMeter,
                advancesInPeriod: advancesInPeriodSum,
                totalOutstandingAdvance: totalOutstandingAdvanceBefore,
                totalMetersProduced,
            }
        });
    };

    const handleWageUpdate = async () => {
        if (!selectedEmployee) return;

        setWageSaveState('saving');
        const updatedEmployee = {
            ...selectedEmployee,
            dailyWage: Number(editableWage) || 0,
        };

        try {
            await onUpdateEmployee(selectedEmployee.id, updatedEmployee);
            setWageSaveState('saved');
            if (result) {
                setResult(prev => prev ? ({ ...prev, summary: { ...prev.summary, dailyWage: updatedEmployee.dailyWage }}) : null);
            }
            setTimeout(() => setWageSaveState('idle'), 2000);
        } catch (e) {
            console.error("Failed to update wage", e);
            setWageSaveState('idle');
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred. See console for details.";
            alert(`Failed to update daily wage. ${errorMessage}`);
        }
    };

    const handleRatePerMeterUpdate = async () => {
        if (!selectedEmployee) return;

        setRateSaveState('saving');
        const updatedEmployee = {
            ...selectedEmployee,
            ratePerMeter: Number(editableRatePerMeter) || 0,
        };

        try {
            await onUpdateEmployee(selectedEmployee.id, updatedEmployee);
            setRateSaveState('saved');
            if (result) {
                setResult(prev => prev ? ({ ...prev, summary: { ...prev.summary, ratePerMeter: updatedEmployee.ratePerMeter }}) : null);
            }
            setTimeout(() => setRateSaveState('idle'), 2000);
        } catch (e) {
            console.error("Failed to update rate per meter", e);
            setRateSaveState('idle');
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred. See console for details.";
            alert(`Failed to update rate per meter. ${errorMessage}`);
        }
    };
    
    const handleFinalize = async () => {
        if (!selectedEmployeeId || !selectedEmployee || Number(editableDeduction) < 0 || !result) return;
        setFinalizeState('saving');
        
        const wageEarnings = result.summary.totalPresentDays * (Number(editableWage) || 0);
        const productionEarnings = result.summary.totalMetersProduced * (Number(editableRatePerMeter) || 0);
        const grossSalary = wageEarnings + productionEarnings;
        const deductionValue = Number(editableDeduction) || 0;
        const netSalary = grossSalary - deductionValue;

        const payslipToSave: Omit<Payslip, 'id'> = {
            employeeId: selectedEmployeeId,
            employeeName: selectedEmployee.name,
            payPeriodStart: startDate,
            payPeriodEnd: endDate,
            payslipDate: toYMDString(new Date()),
            totalWorkingDays: result.summary.totalPresentDays,
            otHours: result.summary.totalOvertimeHours,
            wageEarnings: wageEarnings,
            productionEarnings: productionEarnings,
            grossSalary: grossSalary,
            advanceDeduction: deductionValue,
            netSalary: netSalary,
            totalOutstandingAdvance: result.summary.totalOutstandingAdvance - deductionValue,
        };

        try {
            await onSavePayslip(payslipToSave);
            setFinalizeState('saved');
            setTimeout(() => {
                setResult(null);
                setIsCalculated(false);
                setFinalizeState('idle');
                setEditableDeduction('0');
                setActiveTab('payslips');
            }, 1500);
        } catch (e: any) {
            setFinalizeState('idle');
            alert(`Failed to finalize payment: ${e.message}`);
        }
    };


    const getStatusChip = (status: string) => {
        const baseClasses = "px-2 py-0.5 text-xs font-medium rounded-full";
        switch (status) {
            case 'Present': return <span className={`${baseClasses} bg-green-100 text-green-800`}>Present</span>;
            case 'Absent': return <span className={`${baseClasses} bg-red-100 text-red-800`}>Absent</span>;
            case 'Leave': return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Leave</span>;
            case 'Holiday': return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Holiday</span>;
            default: return <span className={`${baseClasses} bg-gray-100 text-gray-600`}>N/A</span>;
        }
    };
    
    const isWageUnchanged = !selectedEmployee || Number(editableWage) === selectedEmployee.dailyWage;
    const isRatePerMeterUnchanged = !selectedEmployee || Number(editableRatePerMeter) === selectedEmployee.ratePerMeter;


    // == PAYSLIPS LIST LOGIC ==
    const [payslipSearchTerm, setPayslipSearchTerm] = useState('');
    const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);

    const filteredPayslips = useMemo(() => {
        const sorted = [...payslips].sort((a,b) => new Date(b.payslipDate).getTime() - new Date(a.payslipDate).getTime());
        if (!payslipSearchTerm) return sorted;
        const lower = payslipSearchTerm.toLowerCase();
        return sorted.filter(p => p.employeeName.toLowerCase().includes(lower));
    }, [payslips, payslipSearchTerm]);

    const employeeForPayslip = useMemo(() => {
        if (!viewingPayslip) return null;
        return employees.find(e => e.id === viewingPayslip.employeeId);
    }, [viewingPayslip, employees]);

    const payslipDataForView = useMemo(() => {
        if (!viewingPayslip) return null;
        return {
            payslipDate: viewingPayslip.payslipDate,
            payPeriodStart: viewingPayslip.payPeriodStart,
            payPeriodEnd: viewingPayslip.payPeriodEnd,
            totalWorkingDays: viewingPayslip.totalWorkingDays,
            otHours: viewingPayslip.otHours,
            wageEarnings: viewingPayslip.wageEarnings,
            productionEarnings: viewingPayslip.productionEarnings,
            grossSalary: viewingPayslip.grossSalary,
            advanceDeduction: viewingPayslip.advanceDeduction,
            netSalary: viewingPayslip.netSalary,
            totalOutstandingAdvance: viewingPayslip.totalOutstandingAdvance,
        };
    }, [viewingPayslip]);

    const tabButtonClasses = (tabName: string) => 
        `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm ${
            activeTab === tabName 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm">
                 <div className="p-5">
                    <h1 className="text-2xl font-bold text-gray-800">Salary &amp; Payslips</h1>
                    <p className="text-gray-500 mt-1">Calculate salaries and manage employee advances.</p>
                </div>
                 <div className="border-b border-gray-200 px-5">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('calculator')} className={tabButtonClasses('calculator')}>
                            Salary Calculator
                        </button>
                        <button onClick={() => setActiveTab('payslips')} className={tabButtonClasses('payslips')}>
                            Saved Payslips
                        </button>
                    </nav>
                </div>
                
                {activeTab === 'calculator' && (
                    <div className="space-y-6">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={e => { setSelectedEmployeeId(e.target.value); setResult(null); setEditableWage(''); setIsCalculated(false); }}
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
                                    <button onClick={handleCalculate} className="w-full flex items-center justify-center bg-blue-600 text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-blue-700">
                                        <SearchIcon className="w-5 h-5 mr-2" />
                                        Calculate
                                    </button>
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        </div>

                        {result && selectedEmployee && (
                            <div className="bg-white animate-fade-in-down">
                                <div className="p-5 border-t">
                                    <h2 className="text-lg font-semibold text-gray-800">Salary Details for {selectedEmployee.name}</h2>
                                    <p className="text-sm text-gray-500">{formatDateForDisplay(startDate)} to {formatDateForDisplay(endDate)}</p>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div>
                                            <h3 className="font-semibold text-gray-700 mb-2">Attendance Breakdown</h3>
                                            <div className="overflow-x-auto border rounded-lg max-h-96">
                                                <table className="w-full text-sm text-left text-gray-500">
                                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                                        <tr>
                                                            <th className="px-4 py-3">Date</th>
                                                            <th className="px-4 py-3 text-center">Morning</th>
                                                            <th className="px-4 py-3 text-center">Evening</th>
                                                            <th className="px-4 py-3 text-right">OT Hours</th>
                                                            <th className="px-4 py-3 text-right">Meters</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white">
                                                        {result.details.map(d => (
                                                            <tr key={d.date} className="border-b hover:bg-gray-50">
                                                                <td className="px-4 py-2 font-medium text-gray-900">{formatDateForDisplay(d.date)}</td>
                                                                <td className="px-4 py-2 text-center">{getStatusChip(d.morningStatus)}</td>
                                                                <td className="px-4 py-2 text-center">{getStatusChip(d.eveningStatus)}</td>
                                                                <td className="px-4 py-2 text-right">{d.overtimeHours}</td>
                                                                <td className="px-4 py-2 text-right">{d.metersProduced || 0}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-lg self-start">
                                        <h3 className="font-semibold text-gray-800 mb-4 text-lg">Calculation Summary</h3>
                                        
                                        {(() => {
                                            const wageEarnings = result.summary.totalPresentDays * (Number(editableWage) || 0);
                                            const productionEarnings = result.summary.totalMetersProduced * (Number(editableRatePerMeter) || 0);
                                            const grossSalary = wageEarnings + productionEarnings;
                                            const deductionValue = Number(editableDeduction) || 0;
                                            const netSalary = grossSalary - deductionValue;

                                            return (
                                                <div className="space-y-4 text-sm">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-600">Total Working Days:</span>
                                                        <span className="font-semibold text-gray-800">{result.summary.totalPresentDays}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-600">Total Meters Produced:</span>
                                                        <span className="font-semibold text-gray-800">{result.summary.totalMetersProduced}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <label htmlFor="dailyWage" className="text-gray-600">Daily Wage:</label>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-gray-800">₹</span>
                                                            <input id="dailyWage" type="number" value={editableWage} onChange={(e) => { setEditableWage(e.target.value); if (wageSaveState !== 'idle') setWageSaveState('idle'); }} className="w-24 p-1 text-sm text-right font-semibold text-gray-800 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent" />
                                                            <button onClick={handleWageUpdate} disabled={isWageUnchanged || wageSaveState !== 'idle'} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed">
                                                                {wageSaveState === 'saving' ? <SpinnerIcon className="w-4 h-4" /> : wageSaveState === 'saved' ? <CheckIcon className="w-4 h-4 text-green-600" /> : 'Save'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                     <div className="flex justify-between items-center">
                                                        <label htmlFor="ratePerMeter" className="text-gray-600">Amount per Meter:</label>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-gray-800">₹</span>
                                                            <input id="ratePerMeter" type="number" value={editableRatePerMeter} onChange={(e) => { setEditableRatePerMeter(e.target.value); if (rateSaveState !== 'idle') setRateSaveState('idle'); }} className="w-24 p-1 text-sm text-right font-semibold text-gray-800 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent" />
                                                            <button onClick={handleRatePerMeterUpdate} disabled={isRatePerMeterUnchanged || rateSaveState !== 'idle'} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold hover:bg-blue-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed">
                                                                {rateSaveState === 'saving' ? <SpinnerIcon className="w-4 h-4" /> : rateSaveState === 'saved' ? <CheckIcon className="w-4 h-4 text-green-600" /> : 'Save'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-600">Total Overtime:</span>
                                                        <span className="font-semibold text-gray-800">{result.summary.totalOvertimeHours} hours</span>
                                                    </div>

                                                    <div className="border-t pt-4 mt-4 space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-600">Wage Earnings:</span>
                                                            <span className="font-medium text-gray-800">₹{wageEarnings.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-600">Production Earnings:</span>
                                                            <span className="font-medium text-gray-800">₹{productionEarnings.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-base">
                                                            <span className="font-semibold text-gray-800">Gross Salary:</span>
                                                            <span className="font-semibold text-gray-800">₹{grossSalary.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <label htmlFor="advanceDeduction" className="text-gray-600">Advance Deduction:</label>
                                                             <div className="flex items-center gap-1">
                                                                <span className="font-semibold text-red-600">- ₹</span>
                                                                <input id="advanceDeduction" type="number" value={editableDeduction} onChange={(e) => { setError(''); setEditableDeduction(e.target.value); }} className="w-24 p-1 text-sm text-right font-semibold text-red-600 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent" />
                                                            </div>
                                                        </div>
                                                         <div className="flex justify-between items-center">
                                                            <span className="text-gray-600">Total Outstanding Advance:</span>
                                                            <span className="font-semibold text-gray-800">₹{result.summary.totalOutstandingAdvance.toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-lg border-t pt-2 mt-2">
                                                            <span className="font-bold text-gray-800">Net Salary:</span>
                                                            <span className={`font-bold text-xl ${netSalary < 0 ? 'text-red-600' : 'text-green-600'}`}>₹{netSalary.toFixed(2)}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 text-right pt-1">(Overtime pay not included)</p>
                                                    </div>
                                                     {isCalculated && (
                                                        <div className="mt-6 text-center">
                                                            <button
                                                                onClick={handleFinalize}
                                                                disabled={finalizeState !== 'idle'}
                                                                className="w-full px-4 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center transition-colors"
                                                            >
                                                                {finalizeState === 'saving' && <SpinnerIcon className="w-5 h-5 mr-2" />}
                                                                {finalizeState === 'saved' && <CheckIcon className="w-5 h-5 mr-2" />}
                                                                {finalizeState === 'idle' ? 'Finalize & Save' : finalizeState === 'saving' ? 'Saving...' : 'Saved!'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                 {activeTab === 'payslips' && (
                    viewingPayslip && employeeForPayslip ? (
                         <PayslipView
                            employee={employeeForPayslip}
                            payslip={payslipDataForView!}
                            companyDetails={companyDetails}
                            onBack={() => setViewingPayslip(null)}
                        />
                    ) : (
                    <div className="p-5 space-y-5">
                        <div className="relative flex-grow w-full md:w-auto">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by employee..."
                                value={payslipSearchTerm}
                                onChange={(e) => setPayslipSearchTerm(e.target.value)}
                                className="w-full md:w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Payslip Date</th>
                                        <th scope="col" className="px-6 py-3">Employee Name</th>
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
                                            <td className="px-6 py-4">{formatDateForDisplay(payslip.payPeriodStart)} - {formatDateForDisplay(payslip.payPeriodEnd)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-green-600">₹{payslip.netSalary.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => setViewingPayslip(payslip)} className="font-medium text-blue-600 hover:underline">
                                                    View / Print
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredPayslips.length === 0 && <div className="text-center p-8 text-gray-500">No saved payslips found.</div>}
                        </div>
                    </div>
                    )
                )}
            </div>
        </div>
    );
};

export default SalaryScreen;