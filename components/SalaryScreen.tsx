import React, { useState, useMemo } from 'react';
import type { Employee, AttendanceRecord, AttendanceStatus, EmployeeAdvance, CompanyDetails, Payslip } from '../types';
import { CalendarIcon, SearchIcon, SpinnerIcon, CheckIcon, TrashIcon } from './Icons';
import DatePicker from './DatePicker';
import PayslipView from './PayslipView';
import ConfirmationModal from './ConfirmationModal';

interface SalaryScreenProps {
    employees: Employee[];
    attendanceRecords: AttendanceRecord[];
    onUpdateEmployee: (id: string, employee: Employee) => Promise<void>;
    advances: EmployeeAdvance[];
    onSavePayslip: (payslip: Omit<Payslip, 'id'>) => Promise<void>;
    onDeletePayslip: (id: string) => Promise<void>;
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

const SalaryScreen: React.FC<SalaryScreenProps> = ({ employees, attendanceRecords, onUpdateEmployee, advances, onSavePayslip, onDeletePayslip, companyDetails, payslips }) => {
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

    // == PAYSLIPS LIST LOGIC ==
    const [payslipSearchTerm, setPayslipSearchTerm] = useState('');
    const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);
    const [payslipToDelete, setPayslipToDelete] = useState<Payslip | null>(null);

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

    const confirmDeletePayslip = async () => {
        if (payslipToDelete) {
            await onDeletePayslip(payslipToDelete.id);
            setPayslipToDelete(null);
        }
    };

    const tabButtonClasses = (tabName: string) => 
        `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm ${
            activeTab === tabName 
            ? 'border-primary-500 text-primary-600' 
            : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
        }`;

    if (viewingPayslip && employeeForPayslip) {
        return <PayslipView employee={employeeForPayslip} payslip={viewingPayslip} companyDetails={companyDetails} onBack={() => setViewingPayslip(null)} />;
    }

    return (
        <div className="space-y-6">
            {payslipToDelete && (
                <ConfirmationModal
                    isOpen={!!payslipToDelete}
                    onClose={() => setPayslipToDelete(null)}
                    onConfirm={confirmDeletePayslip}
                    title="Delete Payslip"
                    message={`Are you sure you want to delete the payslip for ${payslipToDelete.employeeName} (${formatDateForDisplay(payslipToDelete.payslipDate)})? This action cannot be undone.`}
                />
            )}
            <div className="bg-white rounded-lg shadow-sm">
                 <div className="p-5">
                    <h1 className="text-2xl font-bold text-secondary-800">Salary &amp; Payslips</h1>
                    <p className="text-secondary-500 mt-1">Calculate salaries and manage employee advances.</p>
                </div>
                 <div className="border-b border-secondary-200 px-5">
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
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">Employee</label>
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={e => { setSelectedEmployeeId(e.target.value); setResult(null); setEditableWage(''); setIsCalculated(false); }}
                                        className="block w-full px-3 py-2.5 text-sm rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    >
                                        <option value="">-- Select an Employee --</option>
                                        {sortedEmployees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">Start Date</label>
                                    <div className="relative">
                                        <button type="button" onClick={() => setStartDatePickerOpen(p => !p)} className="block w-full text-sm rounded-md border shadow-sm bg-white px-3 py-2.5 flex items-center justify-between text-left font-normal border-secondary-300">
                                            <span className={startDate ? 'text-secondary-900' : 'text-secondary-500'}>{formatDateForDisplay(startDate) || 'Select date'}</span>
                                            <CalendarIcon className="w-5 h-5 text-secondary-400" />
                                        </button>
                                        {isStartDatePickerOpen && <DatePicker value={startDate} onChange={d => { setStartDate(d); setStartDatePickerOpen(false); }} onClose={() => setStartDatePickerOpen(false)} />}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">End Date</label>
                                    <div className="relative">
                                        <button type="button" onClick={() => setEndDatePickerOpen(p => !p)} className="block w-full text-sm rounded-md border shadow-sm bg-white px-3 py-2.5 flex items-center justify-between text-left font-normal border-secondary-300">
                                            <span className={endDate ? 'text-secondary-900' : 'text-secondary-500'}>{formatDateForDisplay(endDate) || 'Select date'}</span>
                                            <CalendarIcon className="w-5 h-5 text-secondary-400" />
                                        </button>
                                        {isEndDatePickerOpen && <DatePicker value={endDate} onChange={d => { setEndDate(d); setEndDatePickerOpen(false); }} onClose={() => setEndDatePickerOpen(false)} />}
                                    </div>
                                </div>
                                <div className="md:col-start-4">
                                    <button onClick={handleCalculate} className="w-full flex items-center justify-center bg-primary-600 text-white px-4 py-2.5 rounded-md text-sm font-semibold hover:bg-primary-700">
                                        <SearchIcon className="w-5 h-5 mr-2" />
                                        Calculate Salary
                                    </button>
                                </div>
                            </div>
                            {error && <p className="text-danger-500 text-sm mt-2">{error}</p>}
                        </div>

                        {result && isCalculated && (
                            <div className="px-6 pb-6 animate-fade-in-down">
                                <div className="bg-secondary-50 rounded-lg p-6 border border-secondary-200">
                                    <h3 className="text-lg font-semibold text-secondary-900 mb-4">Calculation Summary</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                                        {/* Earnings Section */}
                                        <div className="space-y-3">
                                            <h4 className="font-medium text-secondary-700 border-b pb-1">Earnings</h4>
                                            <div className="flex justify-between items-center text-sm">
                                                <span>Total Present Days:</span>
                                                <span className="font-semibold">{result.summary.totalPresentDays} days</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span>Daily Wage:</span>
                                                <div className="flex items-center gap-2">
                                                    <span>₹</span>
                                                    <input 
                                                        type="number" 
                                                        value={editableWage} 
                                                        onChange={e => setEditableWage(e.target.value)} 
                                                        className="w-20 p-1 text-right text-sm border rounded focus:ring-primary-500"
                                                    />
                                                    <button onClick={handleWageUpdate} disabled={wageSaveState !== 'idle'} className="text-primary-600 hover:text-primary-700">
                                                        {wageSaveState === 'saved' ? <CheckIcon className="w-4 h-4"/> : (wageSaveState === 'saving' ? <SpinnerIcon className="w-4 h-4"/> : 'Update')}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-medium pt-1 border-t border-secondary-200">
                                                <span>Wage Earnings:</span>
                                                <span>₹{((Number(editableWage) || 0) * result.summary.totalPresentDays).toFixed(2)}</span>
                                            </div>

                                            <div className="flex justify-between items-center text-sm mt-4">
                                                <span>Total Meters:</span>
                                                <span className="font-semibold">{result.summary.totalMetersProduced} mtr</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span>Rate per Meter:</span>
                                                <div className="flex items-center gap-2">
                                                    <span>₹</span>
                                                    <input 
                                                        type="number" 
                                                        value={editableRatePerMeter} 
                                                        onChange={e => setEditableRatePerMeter(e.target.value)} 
                                                        className="w-20 p-1 text-right text-sm border rounded focus:ring-primary-500"
                                                    />
                                                    <button onClick={handleRatePerMeterUpdate} disabled={rateSaveState !== 'idle'} className="text-primary-600 hover:text-primary-700">
                                                        {rateSaveState === 'saved' ? <CheckIcon className="w-4 h-4"/> : (rateSaveState === 'saving' ? <SpinnerIcon className="w-4 h-4"/> : 'Update')}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-medium pt-1 border-t border-secondary-200">
                                                <span>Production Earnings:</span>
                                                <span>₹{((Number(editableRatePerMeter) || 0) * result.summary.totalMetersProduced).toFixed(2)}</span>
                                            </div>
                                            
                                            <div className="flex justify-between items-center text-base font-bold pt-2 mt-2 bg-success-50 p-2 rounded text-success-800">
                                                <span>Gross Salary:</span>
                                                <span>₹{((Number(editableWage) || 0) * result.summary.totalPresentDays + (Number(editableRatePerMeter) || 0) * result.summary.totalMetersProduced).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {/* Deductions Section */}
                                        <div className="space-y-3">
                                            <h4 className="font-medium text-secondary-700 border-b pb-1">Deductions & Advances</h4>
                                            <div className="flex justify-between items-center text-sm">
                                                <span>Total Outstanding Advance:</span>
                                                <span className="font-semibold text-danger-600">₹{result.summary.totalOutstandingAdvance.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span>Deduction from Salary:</span>
                                                <div className="flex items-center gap-1">
                                                    <span>- ₹</span>
                                                    <input 
                                                        type="number" 
                                                        value={editableDeduction} 
                                                        onChange={e => setEditableDeduction(e.target.value)} 
                                                        max={result.summary.totalOutstandingAdvance}
                                                        className="w-24 p-1 text-right text-sm border rounded focus:ring-danger-500 border-danger-200"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="flex justify-between items-center text-base font-bold pt-2 mt-auto bg-primary-50 p-2 rounded text-primary-800">
                                                <span>Net Payable Salary:</span>
                                                <span>
                                                    ₹{Math.max(0, (
                                                        ((Number(editableWage) || 0) * result.summary.totalPresentDays) + 
                                                        ((Number(editableRatePerMeter) || 0) * result.summary.totalMetersProduced) - 
                                                        (Number(editableDeduction) || 0)
                                                    )).toFixed(2)}
                                                </span>
                                            </div>
                                            
                                            <div className="pt-4 flex justify-end">
                                                <button 
                                                    onClick={handleFinalize}
                                                    disabled={finalizeState !== 'idle'}
                                                    className="flex items-center px-4 py-2 bg-success-600 text-white rounded-md text-sm font-semibold hover:bg-success-700 disabled:bg-secondary-400"
                                                >
                                                    {finalizeState === 'saving' ? <><SpinnerIcon className="w-4 h-4 mr-2"/> Saving...</> : (finalizeState === 'saved' ? <><CheckIcon className="w-4 h-4 mr-2"/> Saved</> : 'Finalize & Save Payslip')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Detailed Breakdown */}
                                    <div className="mt-6 border-t pt-4">
                                        <h4 className="font-medium text-secondary-700 mb-2">Daily Breakdown</h4>
                                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-secondary-100 text-secondary-700 sticky top-0">
                                                    <tr>
                                                        <th className="px-3 py-2">Date</th>
                                                        <th className="px-3 py-2">Morning</th>
                                                        <th className="px-3 py-2">Evening</th>
                                                        <th className="px-3 py-2 text-right">Meters</th>
                                                        <th className="px-3 py-2 text-right">Working Days</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-secondary-100">
                                                    {result.details.map((day, idx) => (
                                                        <tr key={idx} className="hover:bg-secondary-50">
                                                            <td className="px-3 py-2">{formatDateForDisplay(day.date)}</td>
                                                            <td className="px-3 py-2">{day.morningStatus}</td>
                                                            <td className="px-3 py-2">{day.eveningStatus}</td>
                                                            <td className="px-3 py-2 text-right">{day.metersProduced}</td>
                                                            <td className="px-3 py-2 text-right font-medium">{day.presentDays}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'payslips' && (
                    <div className="p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-secondary-800">Generated Payslips</h2>
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search by employee..." 
                                    value={payslipSearchTerm}
                                    onChange={(e) => setPayslipSearchTerm(e.target.value)}
                                    className="pl-9 pr-3 py-1.5 text-sm border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm text-left text-secondary-500">
                                <thead className="text-xs text-secondary-700 uppercase bg-secondary-50">
                                    <tr>
                                        <th className="px-6 py-3">Payslip Date</th>
                                        <th className="px-6 py-3">Employee</th>
                                        <th className="px-6 py-3">Period</th>
                                        <th className="px-6 py-3 text-right">Net Salary</th>
                                        <th className="px-6 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayslips.map(ps => (
                                        <tr key={ps.id} className="bg-white border-b hover:bg-secondary-50">
                                            <td className="px-6 py-4">{formatDateForDisplay(ps.payslipDate)}</td>
                                            <td className="px-6 py-4 font-medium text-secondary-900">{ps.employeeName}</td>
                                            <td className="px-6 py-4 text-xs text-secondary-500">{formatDateForDisplay(ps.payPeriodStart)} - {formatDateForDisplay(ps.payPeriodEnd)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-success-600">₹{ps.netSalary.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <button onClick={() => setViewingPayslip(ps)} className="text-primary-600 hover:underline text-sm font-medium">View</button>
                                                    <button onClick={() => setPayslipToDelete(ps)} className="text-danger-600 hover:text-danger-800" title="Delete Payslip">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredPayslips.length === 0 && (
                                        <tr><td colSpan={5} className="px-6 py-8 text-center text-secondary-500">No payslips found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalaryScreen;