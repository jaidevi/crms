
import React, { useState, useMemo } from 'react';
import { CalendarIcon, SearchIcon, PrintIcon, ChevronDownIcon } from './Icons';
import DatePicker from './DatePicker';
import type { Employee, AttendanceRecord } from '../types';

interface ReportsScreenProps {
    employees: Employee[];
    attendanceRecords: AttendanceRecord[];
}

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const ReportsScreen: React.FC<ReportsScreenProps> = ({ employees, attendanceRecords }) => {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
    const [reportType, setReportType] = useState<'attendance'>('attendance'); // Prepare for future report types

    // UI States for DatePickers
    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isEndDateOpen, setIsEndDateOpen] = useState(false);

    const sortedEmployees = useMemo(() => [...employees].sort((a, b) => a.name.localeCompare(b.name)), [employees]);

    // Filter Data
    const reportData = useMemo(() => {
        if (!startDate || !endDate) return [];

        return attendanceRecords.filter(record => {
            const isDateInRange = record.date >= startDate && record.date <= endDate;
            const isEmployeeMatch = selectedEmployeeId === 'all' || record.employee_id === selectedEmployeeId;
            return isDateInRange && isEmployeeMatch;
        }).sort((a, b) => {
            // Sort by Date, then by Employee Name
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            const empA = employees.find(e => e.id === a.employee_id)?.name || '';
            const empB = employees.find(e => e.id === b.employee_id)?.name || '';
            return empA.localeCompare(empB);
        });
    }, [attendanceRecords, startDate, endDate, selectedEmployeeId, employees]);

    // Calculate Summaries
    const summary = useMemo(() => {
        let totalDaysWorked = 0;
        let totalOvertime = 0;
        let totalMeters = 0;
        let uniqueDays = new Set<string>();

        reportData.forEach(rec => {
            // Strict Calculation: A day is counted only if BOTH shifts are explicitly 'Present'.
            const isMorningValid = rec.morningStatus === 'Present';
            const isEveningValid = rec.eveningStatus === 'Present';

            if (isMorningValid && isEveningValid) {
                totalDaysWorked += 1;
            }

            totalOvertime += (rec.morningOvertimeHours || 0) + (rec.eveningOvertimeHours || 0);
            totalMeters += (rec.metersProduced || 0);
            uniqueDays.add(rec.date);
        });

        return {
            totalDaysWorked,
            totalOvertime,
            totalMeters,
            recordCount: reportData.length,
            daysCovered: uniqueDays.size
        };
    }, [reportData]);

    const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';

    // Calculate per-employee summaries for the "All Employees" view
    const employeeSummaries = useMemo(() => {
        if (selectedEmployeeId !== 'all') return [];

        const summaries: Record<string, { name: string, workingDays: number, ot: number, meters: number }> = {};

        // Iterate through all filtered data (which is already filtered by date)
        reportData.forEach(rec => {
            if (!summaries[rec.employee_id]) {
                summaries[rec.employee_id] = {
                    name: getEmployeeName(rec.employee_id),
                    workingDays: 0,
                    ot: 0,
                    meters: 0
                };
            }

            const isMorningPresent = rec.morningStatus === 'Present';
            const isEveningPresent = rec.eveningStatus === 'Present';

            if (isMorningPresent && isEveningPresent) {
                summaries[rec.employee_id].workingDays += 1;
            }

            summaries[rec.employee_id].ot += (rec.morningOvertimeHours || 0) + (rec.eveningOvertimeHours || 0);
            summaries[rec.employee_id].meters += (rec.metersProduced || 0);
        });

        return Object.values(summaries).sort((a, b) => a.name.localeCompare(b.name));
    }, [reportData, employees, selectedEmployeeId]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Header & Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 no-print">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-800">Reports</h1>
                        <p className="text-secondary-500 mt-1">Generate and view employee attendance and production reports.</p>
                    </div>
                    <button 
                        onClick={handlePrint} 
                        disabled={reportData.length === 0}
                        className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-700 disabled:bg-secondary-300 disabled:cursor-not-allowed"
                    >
                        <PrintIcon className="w-4 h-4 mr-2" />
                        Print Report
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-t border-secondary-100 pt-6">
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Report Type</label>
                        <select 
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value as 'attendance')}
                            className="block w-full px-3 py-2.5 text-sm rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="attendance">Attendance & Production</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Start Date</label>
                        <div className="relative">
                            <button 
                                onClick={() => setIsStartDateOpen(!isStartDateOpen)}
                                className="block w-full text-left px-3 py-2.5 text-sm rounded-md border border-secondary-300 shadow-sm bg-white flex justify-between items-center"
                            >
                                <span className={startDate ? 'text-secondary-900' : 'text-secondary-500'}>
                                    {startDate ? formatDateForDisplay(startDate) : 'Select Date'}
                                </span>
                                <CalendarIcon className="w-4 h-4 text-secondary-400" />
                            </button>
                            {isStartDateOpen && (
                                <DatePicker 
                                    value={startDate} 
                                    onChange={(d) => { setStartDate(d); setIsStartDateOpen(false); }} 
                                    onClose={() => setIsStartDateOpen(false)} 
                                />
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">End Date</label>
                        <div className="relative">
                            <button 
                                onClick={() => setIsEndDateOpen(!isEndDateOpen)}
                                className="block w-full text-left px-3 py-2.5 text-sm rounded-md border border-secondary-300 shadow-sm bg-white flex justify-between items-center"
                            >
                                <span className={endDate ? 'text-secondary-900' : 'text-secondary-500'}>
                                    {endDate ? formatDateForDisplay(endDate) : 'Select Date'}
                                </span>
                                <CalendarIcon className="w-4 h-4 text-secondary-400" />
                            </button>
                            {isEndDateOpen && (
                                <DatePicker 
                                    value={endDate} 
                                    onChange={(d) => { setEndDate(d); setIsEndDateOpen(false); }} 
                                    onClose={() => setIsEndDateOpen(false)} 
                                />
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Employee</label>
                        <select 
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            className="block w-full px-3 py-2.5 text-sm rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="all">All Employees</option>
                            {sortedEmployees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Printable Report Content */}
            <div id="printable-statement" className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold text-secondary-900 text-center uppercase">Attendance & Production Report</h2>
                    <p className="text-center text-secondary-500 text-sm mt-1">
                        Period: {formatDateForDisplay(startDate)} to {formatDateForDisplay(endDate)} 
                        {selectedEmployeeId !== 'all' && ` • Employee: ${getEmployeeName(selectedEmployeeId)}`}
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                        <p className="text-sm text-primary-600 font-medium">Total Working Days</p>
                        <p className="text-2xl font-bold text-primary-800">{summary.totalDaysWorked}</p>
                    </div>
                    <div className="bg-success-50 p-4 rounded-lg border border-success-100">
                        <p className="text-sm text-success-600 font-medium">Total Meters Produced</p>
                        <p className="text-2xl font-bold text-success-800">{summary.totalMeters.toFixed(2)}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <p className="text-sm text-orange-600 font-medium">Total Overtime Hours</p>
                        <p className="text-2xl font-bold text-orange-800">{summary.totalOvertime} hrs</p>
                    </div>
                </div>

                {/* Report Table */}
                <div className="overflow-x-auto">
                    {selectedEmployeeId === 'all' ? (
                        // Summary Table for All Employees
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-xs text-secondary-700 uppercase bg-secondary-100">
                                <tr>
                                    <th className="px-4 py-3 border border-secondary-200">Employee Name</th>
                                    <th className="px-4 py-3 border border-secondary-200 text-right">Total Working Days</th>
                                    <th className="px-4 py-3 border border-secondary-200 text-right">Total Meters Produced</th>
                                    <th className="px-4 py-3 border border-secondary-200 text-right">Total Overtime Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employeeSummaries.map((summary, index) => (
                                    <tr key={index} className="border-b border-secondary-200 hover:bg-secondary-50">
                                        <td className="px-4 py-2 border border-secondary-200 font-medium text-secondary-900">{summary.name}</td>
                                        <td className="px-4 py-2 border border-secondary-200 text-right">{summary.workingDays}</td>
                                        <td className="px-4 py-2 border border-secondary-200 text-right">{summary.meters.toFixed(2)}</td>
                                        <td className="px-4 py-2 border border-secondary-200 text-right">{summary.ot}</td>
                                    </tr>
                                ))}
                                {employeeSummaries.length === 0 && (
                                    <tr><td colSpan={4} className="px-4 py-8 text-center text-secondary-500 border border-secondary-200">No records found.</td></tr>
                                )}
                            </tbody>
                            {employeeSummaries.length > 0 && (
                                <tfoot className="bg-secondary-50 font-bold">
                                    <tr>
                                        <td className="px-4 py-3 border border-secondary-200 text-right">Total:</td>
                                        <td className="px-4 py-3 border border-secondary-200 text-right">{summary.totalDaysWorked}</td>
                                        <td className="px-4 py-3 border border-secondary-200 text-right">{summary.totalMeters.toFixed(2)}</td>
                                        <td className="px-4 py-3 border border-secondary-200 text-right">{summary.totalOvertime}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    ) : (
                        // Detailed Table for Single Employee
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="text-xs text-secondary-700 uppercase bg-secondary-100">
                                <tr>
                                    <th className="px-4 py-3 border border-secondary-200">Date</th>
                                    <th className="px-4 py-3 border border-secondary-200">Employee</th>
                                    <th className="px-4 py-3 border border-secondary-200 text-center">Morning</th>
                                    <th className="px-4 py-3 border border-secondary-200 text-center">Evening</th>
                                    <th className="px-4 py-3 border border-secondary-200 text-right">OT (Hrs)</th>
                                    <th className="px-4 py-3 border border-secondary-200 text-right">Meters</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((record, index) => {
                                    const isSunday = new Date(record.date).getDay() === 0;
                                    return (
                                        <tr key={index} className={`border-b border-secondary-200 hover:bg-secondary-50 ${isSunday ? 'bg-secondary-50' : ''}`}>
                                            <td className="px-4 py-2 border border-secondary-200 whitespace-nowrap">{formatDateForDisplay(record.date)}</td>
                                            <td className="px-4 py-2 border border-secondary-200 font-medium text-secondary-900">{getEmployeeName(record.employee_id)}</td>
                                            <td className={`px-4 py-2 border border-secondary-200 text-center ${record.morningStatus === 'Absent' ? 'text-red-600 font-medium' : ''}`}>{record.morningStatus}</td>
                                            <td className={`px-4 py-2 border border-secondary-200 text-center ${record.eveningStatus === 'Absent' ? 'text-red-600 font-medium' : ''}`}>{record.eveningStatus}</td>
                                            <td className="px-4 py-2 border border-secondary-200 text-right">{(record.morningOvertimeHours || 0) + (record.eveningOvertimeHours || 0)}</td>
                                            <td className="px-4 py-2 border border-secondary-200 text-right font-medium">{record.metersProduced}</td>
                                        </tr>
                                    )
                                })}
                                {reportData.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-secondary-500 border border-secondary-200">
                                            No records found for the selected criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {reportData.length > 0 && (
                                <tfoot className="bg-secondary-50 font-bold">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 border border-secondary-200 text-right">Total:</td>
                                        <td colSpan={2} className="px-4 py-3 border border-secondary-200 text-center">{summary.totalDaysWorked} Days</td>
                                        <td className="px-4 py-3 border border-secondary-200 text-right">{summary.totalOvertime}</td>
                                        <td className="px-4 py-3 border border-secondary-200 text-right">{summary.totalMeters.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsScreen;
