import React, { useState, useMemo } from 'react';
import { CalendarIcon, SearchIcon, PrintIcon, ChevronDownIcon, DownloadIcon } from './Icons';
import DatePicker from './DatePicker';
import type { Employee, AttendanceRecord, Invoice, Client, PurchaseOrder, PurchaseShop, PaymentReceived } from '../types';
import * as XLSX from 'xlsx';

interface ReportsScreenProps {
    employees: Employee[];
    attendanceRecords: AttendanceRecord[];
    invoices: Invoice[];
    clients: Client[];
    purchaseOrders: PurchaseOrder[];
    purchaseShops: PurchaseShop[];
    paymentsReceived: PaymentReceived[];
}

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const numberFormat = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

const ReportsScreen: React.FC<ReportsScreenProps> = ({ employees, attendanceRecords, invoices, clients, purchaseOrders, purchaseShops, paymentsReceived }) => {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [selectedEntityId, setSelectedEntityId] = useState('all');
    const [reportType, setReportType] = useState<'attendance' | 'invoice' | 'purchase' | 'payment_received'>('attendance');

    // UI States for DatePickers
    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isEndDateOpen, setIsEndDateOpen] = useState(false);

    const sortedEmployees = useMemo(() => [...employees].sort((a, b) => a.name.localeCompare(b.name)), [employees]);
    const sortedClients = useMemo(() => [...clients].sort((a, b) => a.name.localeCompare(b.name)), [clients]);
    const sortedShops = useMemo(() => [...purchaseShops].sort((a, b) => a.name.localeCompare(b.name)), [purchaseShops]);

    // --- ATTENDANCE REPORT LOGIC ---
    const attendanceReportData = useMemo(() => {
        if (reportType !== 'attendance' || !startDate || !endDate) return [];

        return attendanceRecords.filter(record => {
            const isDateInRange = record.date >= startDate && record.date <= endDate;
            const isEmployeeMatch = selectedEntityId === 'all' || record.employee_id === selectedEntityId;
            return isDateInRange && isEmployeeMatch;
        }).sort((a, b) => {
            // Sort by Date Descending
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            const empA = employees.find(e => e.id === a.employee_id)?.name || '';
            const empB = employees.find(e => e.id === b.employee_id)?.name || '';
            return empA.localeCompare(empB);
        });
    }, [attendanceRecords, startDate, endDate, selectedEntityId, employees, reportType]);

    const attendanceSummary = useMemo(() => {
        let totalDaysWorked = 0;
        let totalOvertime = 0;
        let totalMeters = 0;
        let uniqueDays = new Set<string>();

        attendanceReportData.forEach(rec => {
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
            recordCount: attendanceReportData.length,
            daysCovered: uniqueDays.size
        };
    }, [attendanceReportData]);

    const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';

    const employeeSummaries = useMemo(() => {
        if (reportType !== 'attendance' || selectedEntityId !== 'all') return [];

        const summaries: Record<string, { name: string, workingDays: number, ot: number, meters: number }> = {};

        attendanceReportData.forEach(rec => {
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
    }, [attendanceReportData, employees, selectedEntityId, reportType]);


    // --- INVOICE REPORT LOGIC ---
    const invoiceReportData = useMemo(() => {
        if (reportType !== 'invoice' || !startDate || !endDate) return [];

        return invoices.filter(inv => {
            const isDateInRange = inv.invoiceDate >= startDate && inv.invoiceDate <= endDate;
            let isClientMatch = true;
            if (selectedEntityId !== 'all') {
                 const selectedClient = clients.find(c => c.id === selectedEntityId);
                 if (selectedClient) {
                     isClientMatch = inv.clientName === selectedClient.name;
                 } else {
                     isClientMatch = false; 
                 }
            }
            return isDateInRange && isClientMatch;
        }).sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime());
    }, [invoices, startDate, endDate, selectedEntityId, clients, reportType]);

    const invoiceSummary = useMemo(() => {
        const totalInvoices = invoiceReportData.length;
        const totalTaxable = invoiceReportData.reduce((sum, inv) => sum + inv.subTotal, 0);
        const totalTax = invoiceReportData.reduce((sum, inv) => sum + inv.totalTaxAmount, 0);
        const totalAmount = invoiceReportData.reduce((sum, inv) => sum + inv.totalAmount, 0);
        
        return { totalInvoices, totalTaxable, totalTax, totalAmount };
    }, [invoiceReportData]);

    const getClientName = (id: string) => clients.find(c => c.id === id)?.name || 'Unknown';

    // --- PURCHASE REPORT LOGIC ---
    const purchaseReportData = useMemo(() => {
        if (reportType !== 'purchase' || !startDate || !endDate) return [];

        return purchaseOrders.filter(po => {
            const isDateInRange = po.poDate >= startDate && po.poDate <= endDate;
            let isShopMatch = true;
            if (selectedEntityId !== 'all') {
                 const selectedShop = purchaseShops.find(s => s.id === selectedEntityId);
                 if (selectedShop) {
                     isShopMatch = po.shopName === selectedShop.name;
                 } else {
                     isShopMatch = false; 
                 }
            }
            return isDateInRange && isShopMatch;
        }).sort((a, b) => new Date(a.poDate).getTime() - new Date(b.poDate).getTime());
    }, [purchaseOrders, startDate, endDate, selectedEntityId, purchaseShops, reportType]);

    const purchaseSummary = useMemo(() => {
        const totalOrders = purchaseReportData.length;
        const totalAmount = purchaseReportData.reduce((sum, po) => sum + po.totalAmount, 0);
        const paidOrders = purchaseReportData.filter(po => po.status === 'Paid').length;
        const unpaidOrders = purchaseReportData.filter(po => po.status === 'Unpaid').length;
        
        return { totalOrders, totalAmount, paidOrders, unpaidOrders };
    }, [purchaseReportData]);

    const getShopName = (id: string) => purchaseShops.find(s => s.id === id)?.name || 'Unknown';

    // --- PAYMENT RECEIVED REPORT LOGIC ---
    const paymentReceivedReportData = useMemo(() => {
        if (reportType !== 'payment_received' || !startDate || !endDate) return [];

        return paymentsReceived.filter(pymt => {
            const isDateInRange = pymt.paymentDate >= startDate && pymt.paymentDate <= endDate;
            let isClientMatch = true;
            if (selectedEntityId !== 'all') {
                 const selectedClient = clients.find(c => c.id === selectedEntityId);
                 if (selectedClient) {
                     isClientMatch = pymt.clientName === selectedClient.name;
                 } else {
                     isClientMatch = false; 
                 }
            }
            return isDateInRange && isClientMatch;
        }).sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
    }, [paymentsReceived, startDate, endDate, selectedEntityId, clients, reportType]);

    const paymentReceivedSummary = useMemo(() => {
        const totalPayments = paymentReceivedReportData.length;
        const totalAmount = paymentReceivedReportData.reduce((sum, p) => sum + p.amount, 0);
        return { totalPayments, totalAmount };
    }, [paymentReceivedReportData]);


    const handlePrint = () => {
        window.print();
    };

    const hasData = useMemo(() => {
        if (reportType === 'attendance') return attendanceReportData.length > 0;
        if (reportType === 'invoice') return invoiceReportData.length > 0;
        if (reportType === 'purchase') return purchaseReportData.length > 0;
        if (reportType === 'payment_received') return paymentReceivedReportData.length > 0;
        return false;
    }, [reportType, attendanceReportData, invoiceReportData, purchaseReportData, paymentReceivedReportData]);

    const handleDownloadExcel = () => {
        if (!hasData) return;

        const wb = XLSX.utils.book_new();
        let data: any[] = [];
        let sheetName = "";
        let fileName = "";

        if (reportType === 'attendance') {
            sheetName = "Attendance";
            fileName = `Attendance_Report_${startDate}_${endDate}.xlsx`;
            
            if (selectedEntityId === 'all') {
                // Summary Data
                data = employeeSummaries.map((s, idx) => ({
                    'Sl#': idx + 1,
                    'Employee Name': s.name,
                    'Working Days': s.workingDays,
                    'Meters Produced': s.meters,
                    'Overtime Hours': s.ot
                }));
            } else {
                // Detailed Data
                data = attendanceReportData.map((rec, idx) => ({
                    'Sl#': idx + 1,
                    'Date': rec.date,
                    'Employee': getEmployeeName(rec.employee_id),
                    'Morning Status': rec.morningStatus,
                    'Evening Status': rec.eveningStatus,
                    'Overtime Hours': (rec.morningOvertimeHours || 0) + (rec.eveningOvertimeHours || 0),
                    'Meters Produced': rec.metersProduced
                }));
            }
        } else if (reportType === 'invoice') {
            sheetName = "Invoices";
            fileName = `Invoice_Report_${startDate}_${endDate}.xlsx`;
            data = invoiceReportData.map((inv, idx) => ({
                'Sl#': idx + 1,
                'Date': inv.invoiceDate,
                'Invoice Number': inv.invoiceNumber,
                'Client Name': inv.clientName,
                'Tax Type': inv.taxType,
                'Taxable Value': inv.subTotal,
                'Tax Amount': inv.totalTaxAmount,
                'Total Amount': inv.totalAmount
            }));
        } else if (reportType === 'purchase') {
            sheetName = "Purchase";
            fileName = `Purchase_Report_${startDate}_${endDate}.xlsx`;
            data = purchaseReportData.map((po, idx) => ({
                'Sl#': idx + 1,
                'Date': po.poDate,
                'PO Number': po.poNumber,
                'Shop Name': po.shopName,
                'Status': po.status,
                'Total Amount': po.totalAmount
            }));
        } else if (reportType === 'payment_received') {
            sheetName = "Payments";
            fileName = `Payment_Received_Report_${startDate}_${endDate}.xlsx`;
            data = paymentReceivedReportData.map((p, idx) => ({
                'Sl#': idx + 1,
                'Date': p.paymentDate,
                'Client Name': p.clientName,
                'Opening Balance': p.openingBalance,
                'Amount Received': p.amount,
                'Payment Mode': p.paymentMode,
                'Reference Number': p.referenceNumber
            }));
        }

        const ws = XLSX.utils.json_to_sheet(data);
        
        // Adjust column widths roughly
        const wscols = Object.keys(data[0] || {}).map(k => ({ wch: Math.max(k.length, 15) }));
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, fileName);
    };

    return (
        <div className="space-y-6">
            {/* Header & Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 no-print">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-800">Reports</h1>
                        <p className="text-secondary-500 mt-1">Generate and view reports.</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-2">
                        <button 
                            onClick={handleDownloadExcel} 
                            disabled={!hasData}
                            className="flex items-center px-4 py-2 bg-success-600 text-white rounded-md text-sm font-semibold hover:bg-success-700 disabled:bg-secondary-300 disabled:cursor-not-allowed"
                        >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Download Excel
                        </button>
                        <button 
                            onClick={handlePrint} 
                            disabled={!hasData}
                            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-700 disabled:bg-secondary-300 disabled:cursor-not-allowed"
                        >
                            <PrintIcon className="w-4 h-4 mr-2" />
                            Print Report
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-t border-secondary-100 pt-6">
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Report Type</label>
                        <select 
                            value={reportType}
                            onChange={(e) => {
                                setReportType(e.target.value as 'attendance' | 'invoice' | 'purchase' | 'payment_received');
                                setSelectedEntityId('all'); // Reset filter when type changes
                            }}
                            className="block w-full px-3 py-2.5 text-sm rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="attendance">Attendance & Production</option>
                            <option value="invoice">Invoice Report</option>
                            <option value="purchase">Purchase Report</option>
                            <option value="payment_received">Payment Received Report</option>
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
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            {reportType === 'attendance' ? 'Employee' : (reportType === 'purchase' ? 'Shop' : 'Client')}
                        </label>
                        <select 
                            value={selectedEntityId}
                            onChange={(e) => setSelectedEntityId(e.target.value)}
                            className="block w-full px-3 py-2.5 text-sm rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        >
                            <option value="all">All {reportType === 'attendance' ? 'Employees' : (reportType === 'purchase' ? 'Shops' : 'Clients')}</option>
                            {reportType === 'attendance' 
                                ? sortedEmployees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))
                                : (reportType === 'purchase'
                                    ? sortedShops.map(shop => (
                                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                                    ))
                                    : sortedClients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))
                                )
                            }
                        </select>
                    </div>
                </div>
            </div>

            {/* Printable Report Content */}
            <div id="printable-statement" className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold text-secondary-900 text-center uppercase">
                        {reportType === 'attendance' 
                            ? 'Attendance & Production Report' 
                            : reportType === 'invoice' 
                                ? 'Invoice Report' 
                                : reportType === 'purchase' 
                                    ? 'Purchase Report' 
                                    : 'Payment Received Report'}
                    </h2>
                    <p className="text-center text-secondary-500 text-sm mt-1">
                        Period: {formatDateForDisplay(startDate)} to {formatDateForDisplay(endDate)} 
                        {selectedEntityId !== 'all' && (
                            ` • ${reportType === 'attendance' ? 'Employee' : (reportType === 'purchase' ? 'Shop' : 'Client')}: ${
                                reportType === 'attendance' 
                                    ? getEmployeeName(selectedEntityId) 
                                    : (reportType === 'purchase' ? getShopName(selectedEntityId) : getClientName(selectedEntityId))
                            }`
                        )}
                    </p>
                </div>

                {reportType === 'attendance' && (
                    <>
                        {/* Attendance Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                                <p className="text-sm text-primary-600 font-medium">Total Working Days</p>
                                <p className="text-2xl font-bold text-primary-800">{attendanceSummary.totalDaysWorked}</p>
                            </div>
                            <div className="bg-success-50 p-4 rounded-lg border border-success-100">
                                <p className="text-sm text-success-600 font-medium">Total Meters Produced</p>
                                <p className="text-2xl font-bold text-success-800">{attendanceSummary.totalMeters.toFixed(2)}</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                <p className="text-sm text-orange-600 font-medium">Total Overtime Hours</p>
                                <p className="text-2xl font-bold text-orange-800">{attendanceSummary.totalOvertime} hrs</p>
                            </div>
                        </div>

                        {/* Attendance Report Table */}
                        <div className="overflow-x-auto">
                            {selectedEntityId === 'all' ? (
                                // Summary Table for All Employees
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="text-xs text-secondary-700 uppercase bg-secondary-100">
                                        <tr>
                                            <th className="px-4 py-3 border border-secondary-200 w-12 text-center">Sl#</th>
                                            <th className="px-4 py-3 border border-secondary-200">Employee Name</th>
                                            <th className="px-4 py-3 border border-secondary-200 text-right">Total Working Days</th>
                                            <th className="px-4 py-3 border border-secondary-200 text-right">Total Meters Produced</th>
                                            <th className="px-4 py-3 border border-secondary-200 text-right">Total Overtime Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employeeSummaries.map((summary, index) => (
                                            <tr key={index} className="border-b border-secondary-200 hover:bg-secondary-50">
                                                <td className="px-4 py-2 border border-secondary-200 text-center">{index + 1}</td>
                                                <td className="px-4 py-2 border border-secondary-200 font-medium text-secondary-900">{summary.name}</td>
                                                <td className="px-4 py-2 border border-secondary-200 text-right">{summary.workingDays}</td>
                                                <td className="px-4 py-2 border border-secondary-200 text-right">{summary.meters.toFixed(2)}</td>
                                                <td className="px-4 py-2 border border-secondary-200 text-right">{summary.ot}</td>
                                            </tr>
                                        ))}
                                        {employeeSummaries.length === 0 && (
                                            <tr><td colSpan={5} className="px-4 py-8 text-center text-secondary-500 border border-secondary-200">No records found.</td></tr>
                                        )}
                                    </tbody>
                                    {employeeSummaries.length > 0 && (
                                        <tfoot className="bg-secondary-50 font-bold">
                                            <tr>
                                                <td colSpan={2} className="px-4 py-3 border border-secondary-200 text-right">Total:</td>
                                                <td className="px-4 py-3 border border-secondary-200 text-right">{attendanceSummary.totalDaysWorked}</td>
                                                <td className="px-4 py-3 border border-secondary-200 text-right">{attendanceSummary.totalMeters.toFixed(2)}</td>
                                                <td className="px-4 py-3 border border-secondary-200 text-right">{attendanceSummary.totalOvertime}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            ) : (
                                // Detailed Table for Single Employee
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="text-xs text-secondary-700 uppercase bg-secondary-100">
                                        <tr>
                                            <th className="px-4 py-3 border border-secondary-200 w-12 text-center">Sl#</th>
                                            <th className="px-4 py-3 border border-secondary-200">Date</th>
                                            <th className="px-4 py-3 border border-secondary-200">Employee</th>
                                            <th className="px-4 py-3 border border-secondary-200 text-center">Morning</th>
                                            <th className="px-4 py-3 border border-secondary-200 text-center">Evening</th>
                                            <th className="px-4 py-3 border border-secondary-200 text-right">OT (Hrs)</th>
                                            <th className="px-4 py-3 border border-secondary-200 text-right">Meters</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendanceReportData.map((record, index) => {
                                            const isSunday = new Date(record.date).getDay() === 0;
                                            return (
                                                <tr key={index} className={`border-b border-secondary-200 hover:bg-secondary-50 ${isSunday ? 'bg-secondary-50' : ''}`}>
                                                    <td className="px-4 py-2 border border-secondary-200 text-center">{index + 1}</td>
                                                    <td className="px-4 py-2 border border-secondary-200 whitespace-nowrap">{formatDateForDisplay(record.date)}</td>
                                                    <td className="px-4 py-2 border border-secondary-200 font-medium text-secondary-900">{getEmployeeName(record.employee_id)}</td>
                                                    <td className={`px-4 py-2 border border-secondary-200 text-center ${record.morningStatus === 'Absent' ? 'text-red-600 font-medium' : ''}`}>{record.morningStatus}</td>
                                                    <td className={`px-4 py-2 border border-secondary-200 text-center ${record.eveningStatus === 'Absent' ? 'text-red-600 font-medium' : ''}`}>{record.eveningStatus}</td>
                                                    <td className="px-4 py-2 border border-secondary-200 text-right">{(record.morningOvertimeHours || 0) + (record.eveningOvertimeHours || 0)}</td>
                                                    <td className="px-4 py-2 border border-secondary-200 text-right font-medium">{record.metersProduced}</td>
                                                </tr>
                                            )
                                        })}
                                        {attendanceReportData.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-secondary-500 border border-secondary-200">
                                                    No records found for the selected criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {attendanceReportData.length > 0 && (
                                        <tfoot className="bg-secondary-50 font-bold">
                                            <tr>
                                                <td colSpan={3} className="px-4 py-3 border border-secondary-200 text-right">Total:</td>
                                                <td colSpan={2} className="px-4 py-3 border border-secondary-200 text-center">{attendanceSummary.totalDaysWorked} Days</td>
                                                <td className="px-4 py-3 border border-secondary-200 text-right">{attendanceSummary.totalOvertime}</td>
                                                <td className="px-4 py-3 border border-secondary-200 text-right">{attendanceSummary.totalMeters.toFixed(2)}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            )}
                        </div>
                    </>
                )}

                {reportType === 'invoice' && (
                    <>
                        {/* Invoice Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                                <p className="text-sm text-primary-600 font-medium">Total Invoices</p>
                                <p className="text-2xl font-bold text-primary-800">{invoiceSummary.totalInvoices}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                <p className="text-sm text-purple-600 font-medium">Total Taxable Value</p>
                                <p className="text-2xl font-bold text-purple-800">₹{numberFormat(invoiceSummary.totalTaxable)}</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                <p className="text-sm text-orange-600 font-medium">Total Tax Amount</p>
                                <p className="text-2xl font-bold text-orange-800">₹{numberFormat(invoiceSummary.totalTax)}</p>
                            </div>
                            <div className="bg-success-50 p-4 rounded-lg border border-success-100">
                                <p className="text-sm text-success-600 font-medium">Total Invoice Amount</p>
                                <p className="text-2xl font-bold text-success-800">₹{numberFormat(invoiceSummary.totalAmount)}</p>
                            </div>
                        </div>

                        {/* Invoice Report Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs text-secondary-700 uppercase bg-secondary-100">
                                    <tr>
                                        <th className="px-4 py-3 border border-secondary-200 w-12 text-center">Sl#</th>
                                        <th className="px-4 py-3 border border-secondary-200">Date</th>
                                        <th className="px-4 py-3 border border-secondary-200">Invoice #</th>
                                        <th className="px-4 py-3 border border-secondary-200">Client Name</th>
                                        <th className="px-4 py-3 border border-secondary-200 text-center">Tax Type</th>
                                        <th className="px-4 py-3 border border-secondary-200 text-right">Taxable</th>
                                        <th className="px-4 py-3 border border-secondary-200 text-right">Tax</th>
                                        <th className="px-4 py-3 border border-secondary-200 text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoiceReportData.map((inv, index) => (
                                        <tr key={inv.id} className="border-b border-secondary-200 hover:bg-secondary-50">
                                            <td className="px-4 py-2 border border-secondary-200 text-center">{index + 1}</td>
                                            <td className="px-4 py-2 border border-secondary-200 whitespace-nowrap">{formatDateForDisplay(inv.invoiceDate)}</td>
                                            <td className="px-4 py-2 border border-secondary-200 font-medium text-secondary-900">{inv.invoiceNumber}</td>
                                            <td className="px-4 py-2 border border-secondary-200">{inv.clientName}</td>
                                            <td className="px-4 py-2 border border-secondary-200 text-center">{inv.taxType}</td>
                                            <td className="px-4 py-2 border border-secondary-200 text-right">{numberFormat(inv.subTotal)}</td>
                                            <td className="px-4 py-2 border border-secondary-200 text-right">{numberFormat(inv.totalTaxAmount)}</td>
                                            <td className="px-4 py-2 border border-secondary-200 text-right font-bold">₹{numberFormat(inv.totalAmount)}</td>
                                        </tr>
                                    ))}
                                    {invoiceReportData.length === 0 && (
                                        <tr><td colSpan={8} className="px-4 py-8 text-center text-secondary-500 border border-secondary-200">No invoices found for the selected criteria.</td></tr>
                                    )}
                                </tbody>
                                {invoiceReportData.length > 0 && (
                                    <tfoot className="bg-secondary-50 font-bold">
                                        <tr>
                                            <td colSpan={5} className="px-4 py-3 border border-secondary-200 text-right">Total:</td>
                                            <td className="px-4 py-3 border border-secondary-200 text-right">{numberFormat(invoiceSummary.totalTaxable)}</td>
                                            <td className="px-4 py-3 border border-secondary-200 text-right">{numberFormat(invoiceSummary.totalTax)}</td>
                                            <td className="px-4 py-3 border border-secondary-200 text-right">₹{numberFormat(invoiceSummary.totalAmount)}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </>
                )}

                {reportType === 'purchase' && (
                    <>
                        {/* Purchase Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                                <p className="text-sm text-primary-600 font-medium">Total Orders</p>
                                <p className="text-2xl font-bold text-primary-800">{purchaseSummary.totalOrders}</p>
                            </div>
                            <div className="bg-success-50 p-4 rounded-lg border border-success-100">
                                <p className="text-sm text-success-600 font-medium">Total Purchase Value</p>
                                <p className="text-2xl font-bold text-success-800">₹{numberFormat(purchaseSummary.totalAmount)}</p>
                            </div>
                            <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
                                <p className="text-sm text-secondary-600 font-medium">Paid Orders</p>
                                <p className="text-2xl font-bold text-secondary-800">{purchaseSummary.paidOrders}</p>
                            </div>
                            <div className="bg-warning-50 p-4 rounded-lg border border-warning-100">
                                <p className="text-sm text-warning-800 font-medium">Unpaid Orders</p>
                                <p className="text-2xl font-bold text-warning-900">{purchaseSummary.unpaidOrders}</p>
                            </div>
                        </div>

                        {/* Purchase Report Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs text-secondary-700 uppercase bg-secondary-100">
                                    <tr>
                                        <th className="px-4 py-3 border border-secondary-200 w-12 text-center">Sl#</th>
                                        <th className="px-4 py-3 border border-secondary-200">Date</th>
                                        <th className="px-4 py-3 border border-secondary-200">PO Number</th>
                                        <th className="px-4 py-3 border border-secondary-200">Shop Name</th>
                                        <th className="px-4 py-3 border border-secondary-200 text-center">Status</th>
                                        <th className="px-4 py-3 border border-secondary-200 text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchaseReportData.map((po, index) => (
                                        <tr key={po.id} className="border-b border-secondary-200 hover:bg-secondary-50">
                                            <td className="px-4 py-2 border border-secondary-200 text-center">{index + 1}</td>
                                            <td className="px-4 py-2 border border-secondary-200 whitespace-nowrap">{formatDateForDisplay(po.poDate)}</td>
                                            <td className="px-4 py-2 border border-secondary-200 font-medium text-secondary-900">{po.poNumber}</td>
                                            <td className="px-4 py-2 border border-secondary-200">{po.shopName}</td>
                                            <td className="px-4 py-2 border border-secondary-200 text-center">
                                                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${po.status === 'Paid' ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'}`}>
                                                    {po.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 border border-secondary-200 text-right font-bold">₹{numberFormat(po.totalAmount)}</td>
                                        </tr>
                                    ))}
                                    {purchaseReportData.length === 0 && (
                                        <tr><td colSpan={6} className="px-4 py-8 text-center text-secondary-500 border border-secondary-200">No purchase orders found for the selected criteria.</td></tr>
                                    )}
                                </tbody>
                                {purchaseReportData.length > 0 && (
                                    <tfoot className="bg-secondary-50 font-bold">
                                        <tr>
                                            <td colSpan={5} className="px-4 py-3 border border-secondary-200 text-right">Total:</td>
                                            <td className="px-4 py-3 border border-secondary-200 text-right">₹{numberFormat(purchaseSummary.totalAmount)}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </>
                )}

                {reportType === 'payment_received' && (
                    <>
                        {/* Payment Received Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                                <p className="text-sm text-primary-600 font-medium">Total Transactions</p>
                                <p className="text-2xl font-bold text-primary-800">{paymentReceivedSummary.totalPayments}</p>
                            </div>
                            <div className="bg-success-50 p-4 rounded-lg border border-success-100">
                                <p className="text-sm text-success-600 font-medium">Total Amount Received</p>
                                <p className="text-2xl font-bold text-success-800">₹{numberFormat(paymentReceivedSummary.totalAmount)}</p>
                            </div>
                        </div>

                        {/* Payment Received Report Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs text-secondary-700 uppercase bg-secondary-100">
                                    <tr>
                                        <th className="px-4 py-3 border border-secondary-200 w-12 text-center">Sl#</th>
                                        <th className="px-4 py-3 border border-secondary-200">Date</th>
                                        <th className="px-4 py-3 border border-secondary-200">Client Name</th>
                                        <th className="px-4 py-3 border border-secondary-200 text-right">Opening Bal</th>
                                        <th className="px-4 py-3 border border-secondary-200 text-center">Payment Mode</th>
                                        <th className="px-4 py-3 border border-secondary-200">Reference #</th>
                                        <th className="px-4 py-3 border border-secondary-200 text-right">Amount Received</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentReceivedReportData.map((p, index) => (
                                        <tr key={index} className="border-b border-secondary-200 hover:bg-secondary-50">
                                            <td className="px-4 py-2 border border-secondary-200 text-center">{index + 1}</td>
                                            <td className="px-4 py-2 border border-secondary-200 whitespace-nowrap">{formatDateForDisplay(p.paymentDate)}</td>
                                            <td className="px-4 py-2 border border-secondary-200 font-medium text-secondary-900">{p.clientName}</td>
                                            <td className="px-4 py-2 border border-secondary-200 text-right text-secondary-500">₹{numberFormat(p.openingBalance)}</td>
                                            <td className="px-4 py-2 border border-secondary-200 text-center">{p.paymentMode}</td>
                                            <td className="px-4 py-2 border border-secondary-200">{p.referenceNumber || '-'}</td>
                                            <td className="px-4 py-2 border border-secondary-200 text-right font-bold">₹{numberFormat(p.amount)}</td>
                                        </tr>
                                    ))}
                                    {paymentReceivedReportData.length === 0 && (
                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-secondary-500 border border-secondary-200">No payment records found for the selected criteria.</td></tr>
                                    )}
                                </tbody>
                                {paymentReceivedReportData.length > 0 && (
                                    <tfoot className="bg-secondary-50 font-bold">
                                        <tr>
                                            <td colSpan={6} className="px-4 py-3 border border-secondary-200 text-right">Total:</td>
                                            <td className="px-4 py-3 border border-secondary-200 text-right">₹{numberFormat(paymentReceivedSummary.totalAmount)}</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportsScreen;