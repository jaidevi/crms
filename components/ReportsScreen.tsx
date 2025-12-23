
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

// Constant to control rows per page for printed report totals
const ROWS_PER_PAGE = 22;

const ReportsScreen: React.FC<ReportsScreenProps> = ({ employees, attendanceRecords, invoices, clients, purchaseOrders, purchaseShops, paymentsReceived }) => {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [selectedEntityId, setSelectedEntityId] = useState('all');
    const [reportType, setReportType] = useState<'attendance' | 'invoice' | 'purchase' | 'payment_received'>('attendance');

    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isEndDateOpen, setIsEndDateOpen] = useState(false);

    const sortedEmployees = useMemo(() => [...employees].sort((a, b) => a.name.localeCompare(b.name)), [employees]);
    const sortedClients = useMemo(() => [...clients].sort((a, b) => a.name.localeCompare(b.name)), [clients]);
    const sortedShops = useMemo(() => [...purchaseShops].sort((a, b) => a.name.localeCompare(b.name)), [purchaseShops]);

    const attendanceReportData = useMemo(() => {
        if (reportType !== 'attendance' || !startDate || !endDate) return [];

        return attendanceRecords.filter(record => {
            const isDateInRange = record.date >= startDate && record.date <= endDate;
            const isEmployeeMatch = selectedEntityId === 'all' || record.employee_id === selectedEntityId;
            return isDateInRange && isEmployeeMatch;
        }).sort((a, b) => {
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
        attendanceReportData.forEach(rec => {
            if (rec.morningStatus === 'Present' && rec.eveningStatus === 'Present') totalDaysWorked += 1;
            totalOvertime += (rec.morningOvertimeHours || 0) + (rec.eveningOvertimeHours || 0);
            totalMeters += (rec.metersProduced || 0);
        });
        return { totalDaysWorked, totalOvertime, totalMeters };
    }, [attendanceReportData]);

    const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';

    const employeeSummaries = useMemo(() => {
        if (reportType !== 'attendance' || selectedEntityId !== 'all') return [];
        const summaries: Record<string, { name: string, workingDays: number, ot: number, meters: number }> = {};
        attendanceReportData.forEach(rec => {
            if (!summaries[rec.employee_id]) {
                summaries[rec.employee_id] = { name: getEmployeeName(rec.employee_id), workingDays: 0, ot: 0, meters: 0 };
            }
            if (rec.morningStatus === 'Present' && rec.eveningStatus === 'Present') summaries[rec.employee_id].workingDays += 1;
            summaries[rec.employee_id].ot += (rec.morningOvertimeHours || 0) + (rec.eveningOvertimeHours || 0);
            summaries[rec.employee_id].meters += (rec.metersProduced || 0);
        });
        return Object.values(summaries).sort((a, b) => a.name.localeCompare(b.name));
    }, [attendanceReportData, employees, selectedEntityId, reportType]);

    const chunkedEmployeeSummaries = useMemo(() => {
        const chunks = [];
        for (let i = 0; i < employeeSummaries.length; i += ROWS_PER_PAGE) {
            const chunk = employeeSummaries.slice(i, i + ROWS_PER_PAGE);
            const chunkTotal = chunk.reduce((acc, curr) => ({
                workingDays: acc.workingDays + curr.workingDays,
                meters: acc.meters + curr.meters,
                ot: acc.ot + curr.ot
            }), { workingDays: 0, meters: 0, ot: 0 });
            chunks.push({ data: chunk, totals: chunkTotal });
        }
        return chunks;
    }, [employeeSummaries]);

    const invoiceReportData = useMemo(() => {
        if (reportType !== 'invoice' || !startDate || !endDate) return [];
        return invoices.filter(inv => {
            const isDateInRange = inv.invoiceDate >= startDate && inv.invoiceDate <= endDate;
            let isClientMatch = true;
            if (selectedEntityId !== 'all') {
                 const selectedClient = clients.find(c => c.id === selectedEntityId);
                 isClientMatch = selectedClient ? inv.clientName === selectedClient.name : false;
            }
            return isDateInRange && isClientMatch;
        }).sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime());
    }, [invoices, startDate, endDate, selectedEntityId, clients, reportType]);

    const invoiceSummary = useMemo(() => {
        return {
            totalInvoices: invoiceReportData.length,
            totalTaxable: invoiceReportData.reduce((sum, inv) => sum + inv.subTotal, 0),
            totalTax: invoiceReportData.reduce((sum, inv) => sum + inv.totalTaxAmount, 0),
            totalAmount: invoiceReportData.reduce((sum, inv) => sum + inv.totalAmount, 0)
        };
    }, [invoiceReportData]);

    const purchaseReportData = useMemo(() => {
        if (reportType !== 'purchase' || !startDate || !endDate) return [];
        return purchaseOrders.filter(po => {
            const isDateInRange = po.poDate >= startDate && po.poDate <= endDate;
            let isShopMatch = true;
            if (selectedEntityId !== 'all') {
                 const selectedShop = purchaseShops.find(s => s.id === selectedEntityId);
                 isShopMatch = selectedShop ? po.shopName === selectedShop.name : false;
            }
            return isDateInRange && isShopMatch;
        }).sort((a, b) => new Date(a.poDate).getTime() - new Date(b.poDate).getTime());
    }, [purchaseOrders, startDate, endDate, selectedEntityId, purchaseShops, reportType]);

    const purchaseSummary = useMemo(() => {
        return {
            totalOrders: purchaseReportData.length,
            totalAmount: purchaseReportData.reduce((sum, po) => sum + po.totalAmount, 0),
            paidOrders: purchaseReportData.filter(po => po.status === 'Paid').length,
            unpaidOrders: purchaseReportData.filter(po => po.status === 'Unpaid').length
        };
    }, [purchaseReportData]);

    const paymentReceivedReportData = useMemo(() => {
        if (reportType !== 'payment_received' || !startDate || !endDate) return [];
        return paymentsReceived.filter(pymt => {
            const isDateInRange = pymt.paymentDate >= startDate && pymt.paymentDate <= endDate;
            let isClientMatch = true;
            if (selectedEntityId !== 'all') {
                 const selectedClient = clients.find(c => c.id === selectedEntityId);
                 isClientMatch = selectedClient ? pymt.clientName === selectedClient.name : false;
            }
            return isDateInRange && isClientMatch;
        }).sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
    }, [paymentsReceived, startDate, endDate, selectedEntityId, clients, reportType]);

    const paymentReceivedSummary = useMemo(() => {
        return {
            totalPayments: paymentReceivedReportData.length,
            totalAmount: paymentReceivedReportData.reduce((sum, p) => sum + p.amount, 0)
        };
    }, [paymentReceivedReportData]);

    const handlePrint = () => { window.print(); };

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
            data = selectedEntityId === 'all' ? employeeSummaries.map((s, idx) => ({ 'S.NO': idx + 1, 'Employee Name': s.name, 'Working Days': s.workingDays, 'Meters Produced': s.meters, 'Overtime Hours': s.ot })) : attendanceReportData.map((rec, idx) => ({ 'S.NO': idx + 1, 'Date': rec.date, 'Employee': getEmployeeName(rec.employee_id), 'Morning Status': rec.morningStatus, 'Evening Status': rec.eveningStatus, 'Overtime Hours': (rec.morningOvertimeHours || 0) + (rec.eveningOvertimeHours || 0), 'Meters Produced': rec.metersProduced }));
        } else if (reportType === 'invoice') {
            sheetName = "Invoices";
            fileName = `Invoice_Report_${startDate}_${endDate}.xlsx`;
            data = invoiceReportData.map((inv, idx) => ({ 'S.NO': idx + 1, 'Date': inv.invoiceDate, 'Invoice Number': inv.invoiceNumber, 'Client Name': inv.clientName, 'Tax Type': inv.taxType, 'Taxable Value': inv.subTotal, 'Tax Amount': inv.totalTaxAmount, 'Total Amount': inv.totalAmount }));
        } else if (reportType === 'purchase') {
            sheetName = "Purchase";
            fileName = `Purchase_Report_${startDate}_${endDate}.xlsx`;
            data = purchaseReportData.map((po, idx) => ({ 'S.NO': idx + 1, 'Date': po.poDate, 'PO Number': po.poNumber, 'Shop Name': po.shopName, 'Status': po.status, 'Total Amount': po.totalAmount }));
        } else if (reportType === 'payment_received') {
            sheetName = "Payments";
            fileName = `Payment_Received_Report_${startDate}_${endDate}.xlsx`;
            data = paymentReceivedReportData.map((p, idx) => ({ 'S.NO': idx + 1, 'Date': p.paymentDate, 'Client Name': p.clientName, 'Opening Balance': p.openingBalance, 'Amount Received': p.amount, 'Payment Mode': p.paymentMode, 'Reference Number': p.referenceNumber }));
        }
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, fileName);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 no-print">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-800">Reports</h1>
                        <p className="text-secondary-500 mt-1">Generate and view reports.</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-2">
                        <button onClick={handleDownloadExcel} disabled={!hasData} className="flex items-center px-4 py-2 bg-success-600 text-white rounded-md text-sm font-semibold hover:bg-success-700 disabled:bg-secondary-300">
                            <DownloadIcon className="w-4 h-4 mr-2" /> Download Excel
                        </button>
                        <button onClick={handlePrint} disabled={!hasData} className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-semibold hover:bg-primary-700 disabled:bg-secondary-300">
                            <PrintIcon className="w-4 h-4 mr-2" /> Print Report
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-t border-secondary-100 pt-6">
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Report Type</label>
                        <select value={reportType} onChange={(e) => { setReportType(e.target.value as any); setSelectedEntityId('all'); }} className="block w-full px-3 py-2.5 text-sm rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                            <option value="attendance">Attendance & Production</option>
                            <option value="invoice">Invoice Report</option>
                            <option value="purchase">Purchase Report</option>
                            <option value="payment_received">Payment Received Report</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Start Date</label>
                        <div className="relative">
                            <button onClick={() => setIsStartDateOpen(!isStartDateOpen)} className="block w-full text-left px-3 py-2.5 text-sm rounded-md border border-secondary-300 shadow-sm bg-white flex justify-between items-center">
                                <span className={startDate ? 'text-secondary-900' : 'text-secondary-500'}>{startDate ? formatDateForDisplay(startDate) : 'Select Date'}</span>
                                <CalendarIcon className="w-4 h-4 text-secondary-400" />
                            </button>
                            {isStartDateOpen && <DatePicker value={startDate} onChange={(d) => { setStartDate(d); setIsStartDateOpen(false); }} onClose={() => setIsStartDateOpen(false)} />}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">End Date</label>
                        <div className="relative">
                            <button onClick={() => setIsEndDateOpen(!isEndDateOpen)} className="block w-full text-left px-3 py-2.5 text-sm rounded-md border border-secondary-300 shadow-sm bg-white flex justify-between items-center">
                                <span className={endDate ? 'text-secondary-900' : 'text-secondary-500'}>{endDate ? formatDateForDisplay(endDate) : 'Select Date'}</span>
                                <CalendarIcon className="w-4 h-4 text-secondary-400" />
                            </button>
                            {isEndDateOpen && <DatePicker value={endDate} onChange={(d) => { setEndDate(d); setIsEndDateOpen(false); }} onClose={() => setIsEndDateOpen(false)} />}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">{reportType === 'attendance' ? 'Employee' : (reportType === 'purchase' ? 'Shop' : 'Client')}</label>
                        <select value={selectedEntityId} onChange={(e) => setSelectedEntityId(e.target.value)} className="block w-full px-3 py-2.5 text-sm rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500">
                            <option value="all">All {reportType === 'attendance' ? 'Employees' : (reportType === 'purchase' ? 'Shops' : 'Clients')}</option>
                            {reportType === 'attendance' ? sortedEmployees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>)) : (reportType === 'purchase' ? sortedShops.map(shop => (<option key={shop.id} value={shop.id}>{shop.name}</option>)) : sortedClients.map(client => (<option key={client.id} value={client.id}>{client.name}</option>)))}
                        </select>
                    </div>
                </div>
            </div>

            <div id="printable-statement" className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold text-secondary-900 text-center uppercase">
                        {reportType === 'attendance' ? 'Attendance & Production Report' : reportType === 'invoice' ? 'Invoice Report' : reportType === 'purchase' ? 'Purchase Report' : 'Payment Received Report'}
                    </h2>
                    <p className="text-center text-secondary-500 text-sm mt-1">Period: {formatDateForDisplay(startDate)} to {formatDateForDisplay(endDate)}</p>
                </div>

                {reportType === 'attendance' && (
                    <>
                        <div className="flex gap-2 mb-8 no-print">
                            <div className="flex-1 bg-primary-50 p-2 rounded border border-primary-100 text-center">
                                <p className="text-[10px] text-primary-600 font-bold uppercase">Total Working Days</p>
                                <p className="text-lg font-bold text-primary-800">{attendanceSummary.totalDaysWorked}</p>
                            </div>
                            <div className="flex-1 bg-success-50 p-2 rounded border border-success-100 text-center">
                                <p className="text-[10px] text-success-600 font-bold uppercase">Total Meters</p>
                                <p className="text-lg font-bold text-success-800">{attendanceSummary.totalMeters.toFixed(2)}</p>
                            </div>
                            <div className="flex-1 bg-orange-50 p-2 rounded border border-orange-100 text-center">
                                <p className="text-[10px] text-orange-600 font-bold uppercase">Total OT</p>
                                <p className="text-lg font-bold text-orange-800">{attendanceSummary.totalOvertime} hrs</p>
                            </div>
                        </div>

                        {selectedEntityId === 'all' ? (
                            chunkedEmployeeSummaries.map((chunk, chunkIdx) => (
                                <div key={chunkIdx} className={`${chunkIdx > 0 ? 'mt-8 pt-8 border-t border-dashed border-secondary-300 print:mt-0 print:pt-0 print:border-none' : ''} print:break-after-page`}>
                                    <table className="w-full text-[11px] text-left border-collapse table-auto mb-4">
                                        <thead className="text-[10px] text-secondary-700 uppercase bg-secondary-100">
                                            <tr>
                                                <th className="px-3 py-2 border border-secondary-200 w-10 text-center">S.NO</th>
                                                <th className="px-3 py-2 border border-secondary-200">Employee Name</th>
                                                <th className="px-3 py-2 border border-secondary-200 text-right">Working Days</th>
                                                <th className="px-3 py-2 border border-secondary-200 text-right">Meters Produced</th>
                                                <th className="px-3 py-2 border border-secondary-200 text-right">OT Hours</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {chunk.data.map((summary, index) => (
                                                <tr key={index} className="border-b border-secondary-200 hover:bg-secondary-50">
                                                    <td className="px-3 py-1.5 border border-secondary-200 text-center">{chunkIdx * ROWS_PER_PAGE + index + 1}</td>
                                                    <td className="px-3 py-1.5 border border-secondary-200 font-medium text-secondary-900">{summary.name}</td>
                                                    <td className="px-3 py-1.5 border border-secondary-200 text-right">{summary.workingDays}</td>
                                                    <td className="px-3 py-1.5 border border-secondary-200 text-right">{summary.meters.toFixed(2)}</td>
                                                    <td className="px-3 py-1.5 border border-secondary-200 text-right">{summary.ot}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-secondary-50 font-bold">
                                            <tr>
                                                <td colSpan={2} className="px-3 py-2 border border-secondary-200 text-right italic">Page Wise Total:</td>
                                                <td className="px-3 py-2 border border-secondary-200 text-right">{chunk.totals.workingDays}</td>
                                                <td className="px-3 py-2 border border-secondary-200 text-right">{chunk.totals.meters.toFixed(2)}</td>
                                                <td className="px-3 py-2 border border-secondary-200 text-right">{chunk.totals.ot}</td>
                                            </tr>
                                            {chunkIdx === chunkedEmployeeSummaries.length - 1 && (
                                                <tr className="bg-primary-50 text-primary-900">
                                                    <td colSpan={2} className="px-3 py-2 border border-secondary-200 text-right uppercase">Grand Total:</td>
                                                    <td className="px-3 py-2 border border-secondary-200 text-right">{attendanceSummary.totalDaysWorked}</td>
                                                    <td className="px-3 py-2 border border-secondary-200 text-right">{attendanceSummary.totalMeters.toFixed(2)}</td>
                                                    <td className="px-3 py-2 border border-secondary-200 text-right">{attendanceSummary.totalOvertime}</td>
                                                </tr>
                                            )}
                                        </tfoot>
                                    </table>
                                </div>
                            ))
                        ) : (
                            <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-secondary-100 uppercase">
                                    <tr><th className="px-3 py-2 border w-10 text-center">S.NO</th><th className="px-3 py-2 border">Date</th><th className="px-3 py-2 border">Morning</th><th className="px-3 py-2 border">Evening</th><th className="px-3 py-2 border text-right">OT</th><th className="px-3 py-2 border text-right">Meters</th></tr>
                                </thead>
                                <tbody>
                                    {attendanceReportData.map((rec, index) => (
                                        <tr key={index} className="border-b"><td className="px-3 py-1.5 border text-center">{index + 1}</td><td className="px-3 py-1.5 border">{formatDateForDisplay(rec.date)}</td><td className="px-3 py-1.5 border text-center">{rec.morningStatus}</td><td className="px-3 py-1.5 border text-center">{rec.eveningStatus}</td><td className="px-3 py-1.5 border text-right">{rec.morningOvertimeHours + rec.eveningOvertimeHours}</td><td className="px-3 py-1.5 border text-right">{rec.metersProduced.toFixed(2)}</td></tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-secondary-50 font-bold">
                                    <tr><td colSpan={4} className="px-3 py-2 border text-right italic">Grand Total:</td><td className="px-3 py-2 border text-right">{attendanceSummary.totalOvertime}</td><td className="px-3 py-2 border text-right">{attendanceSummary.totalMeters.toFixed(2)}</td></tr>
                                </tfoot>
                            </table>
                        )}
                    </>
                )}

                {reportType === 'invoice' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-left border-collapse">
                            <thead className="bg-secondary-100 uppercase">
                                <tr>
                                    <th className="px-3 py-2 border w-10 text-center">S.NO</th>
                                    <th className="px-3 py-2 border">Date</th>
                                    <th className="px-3 py-2 border">Invoice #</th>
                                    <th className="px-3 py-2 border">Client</th>
                                    <th className="px-3 py-2 border text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoiceReportData.map((inv, index) => (
                                    <tr key={inv.id} className="border-b">
                                        <td className="px-3 py-1.5 border text-center">{index + 1}</td>
                                        <td className="px-3 py-1.5 border">{formatDateForDisplay(inv.invoiceDate)}</td>
                                        <td className="px-3 py-1.5 border">{inv.invoiceNumber}</td>
                                        <td className="px-3 py-1.5 border">{inv.clientName}</td>
                                        <td className="px-3 py-1.5 border text-right font-bold">₹{numberFormat(inv.totalAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-secondary-50 font-bold">
                                <tr>
                                    <td colSpan={4} className="px-3 py-2 border text-right">Grand Total:</td>
                                    <td className="px-3 py-2 border text-right">₹{numberFormat(invoiceSummary.totalAmount)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {reportType === 'purchase' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-left border-collapse">
                            <thead className="bg-secondary-100 uppercase">
                                <tr>
                                    <th className="px-3 py-2 border w-10 text-center">S.NO</th>
                                    <th className="px-3 py-2 border">Date</th>
                                    <th className="px-3 py-2 border">PO #</th>
                                    <th className="px-3 py-2 border">Shop</th>
                                    <th className="px-3 py-2 border">Status</th>
                                    <th className="px-3 py-2 border text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchaseReportData.map((po, index) => (
                                    <tr key={po.id} className="border-b">
                                        <td className="px-3 py-1.5 border text-center">{index + 1}</td>
                                        <td className="px-3 py-1.5 border">{formatDateForDisplay(po.poDate)}</td>
                                        <td className="px-3 py-1.5 border">{po.poNumber}</td>
                                        <td className="px-3 py-1.5 border">{po.shopName}</td>
                                        <td className="px-3 py-1.5 border">{po.status}</td>
                                        <td className="px-3 py-1.5 border text-right font-bold">₹{numberFormat(po.totalAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-secondary-50 font-bold">
                                <tr>
                                    <td colSpan={5} className="px-3 py-2 border text-right">Grand Total:</td>
                                    <td className="px-3 py-2 border text-right">₹{numberFormat(purchaseSummary.totalAmount)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

                {reportType === 'payment_received' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-left border-collapse">
                            <thead className="bg-secondary-100 uppercase">
                                <tr>
                                    <th className="px-3 py-2 border w-10 text-center">S.NO</th>
                                    <th className="px-3 py-2 border">Date</th>
                                    <th className="px-3 py-2 border">Client</th>
                                    <th className="px-3 py-2 border">Mode</th>
                                    <th className="px-3 py-2 border">Reference</th>
                                    <th className="px-3 py-2 border text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentReceivedReportData.map((p, index) => (
                                    <tr key={p.id} className="border-b">
                                        <td className="px-3 py-1.5 border text-center">{index + 1}</td>
                                        <td className="px-3 py-1.5 border">{formatDateForDisplay(p.paymentDate)}</td>
                                        <td className="px-3 py-1.5 border">{p.clientName}</td>
                                        <td className="px-3 py-1.5 border">{p.paymentMode}</td>
                                        <td className="px-3 py-1.5 border">{p.referenceNumber || '-'}</td>
                                        <td className="px-3 py-1.5 border text-right font-bold">₹{numberFormat(p.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-secondary-50 font-bold">
                                <tr>
                                    <td colSpan={5} className="px-3 py-2 border text-right">Grand Total:</td>
                                    <td className="px-3 py-2 border text-right">₹{numberFormat(paymentReceivedSummary.totalAmount)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsScreen;
