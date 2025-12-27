
import React, { useState, useMemo } from 'react';
import { CalendarIcon, SearchIcon, PrintIcon, ChevronDownIcon, DownloadIcon } from './Icons';
import DatePicker from './DatePicker';
import type { Employee, AttendanceRecord, Invoice, Client, PurchaseOrder, PurchaseShop, PaymentReceived, TimberExpense, SupplierPayment, OtherExpense, ExpenseCategory, DeliveryChallan } from '../types';
import * as XLSX from 'xlsx';

interface ReportsScreenProps {
    employees: Employee[];
    attendanceRecords: AttendanceRecord[];
    invoices: Invoice[];
    clients: Client[];
    purchaseOrders: PurchaseOrder[];
    purchaseShops: PurchaseShop[];
    paymentsReceived: PaymentReceived[];
    timberExpenses: TimberExpense[];
    supplierPayments: SupplierPayment[];
    otherExpenses: OtherExpense[];
    expenseCategories: ExpenseCategory[];
    deliveryChallans: DeliveryChallan[];
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

const ReportsScreen: React.FC<ReportsScreenProps> = ({ 
    employees, attendanceRecords, invoices, clients, purchaseOrders, 
    purchaseShops, paymentsReceived, timberExpenses, supplierPayments,
    otherExpenses, expenseCategories, deliveryChallans
}) => {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);
    const [selectedEntityId, setSelectedEntityId] = useState('all');
    const [reportType, setReportType] = useState<'attendance' | 'invoice' | 'purchase' | 'payment_received' | 'timber' | 'other_expense' | 'process'>('attendance');

    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isEndDateOpen, setIsEndDateOpen] = useState(false);

    const sortedEmployees = useMemo(() => [...employees].sort((a, b) => a.name.localeCompare(b.name)), [employees]);
    const sortedClients = useMemo(() => [...clients].sort((a, b) => a.name.localeCompare(b.name)), [clients]);
    const sortedShops = useMemo(() => [...purchaseShops].sort((a, b) => a.name.localeCompare(b.name)), [purchaseShops]);
    const sortedCategories = useMemo(() => [...expenseCategories].sort((a, b) => a.name.localeCompare(b.name)), [expenseCategories]);

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
        let totalSalary = 0;

        attendanceReportData.forEach(rec => {
            const emp = employees.find(e => e.id === rec.employee_id);
            if (!emp) return;

            let currentWorkingDays = 0;
            if (rec.morningStatus === 'Present' || rec.morningStatus === 'Holiday') currentWorkingDays += 0.5;
            if (rec.eveningStatus === 'Present' || rec.eveningStatus === 'Holiday') currentWorkingDays += 0.5;

            if (rec.morningStatus === 'Present' && rec.eveningStatus === 'Present') totalDaysWorked += 1;
            totalOvertime += (rec.morningOvertimeHours || 0) + (rec.eveningOvertimeHours || 0);
            totalMeters += (rec.metersProduced || 0);

            // Salary Calculation
            const isMonthly = (emp.monthlyWage || 0) > 0;
            const wage = isMonthly ? (emp.monthlyWage || 0) : (emp.dailyWage || 0);
            const wageEarnings = isMonthly ? (wage / 30) * currentWorkingDays : wage * currentWorkingDays;
            const prodEarnings = (rec.metersProduced || 0) * (emp.ratePerMeter || 0);
            totalSalary += (wageEarnings + prodEarnings);
        });
        return { totalDaysWorked, totalOvertime, totalMeters, totalSalary };
    }, [attendanceReportData, employees]);

    const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || 'Unknown';

    const employeeSummaries = useMemo(() => {
        if (reportType !== 'attendance' || selectedEntityId !== 'all') return [];
        const summaries: Record<string, { name: string, workingDays: number, ot: number, meters: number, salary: number }> = {};
        attendanceReportData.forEach(rec => {
            const emp = employees.find(e => e.id === rec.employee_id);
            if (!emp) return;

            if (!summaries[rec.employee_id]) {
                summaries[rec.employee_id] = { name: emp.name, workingDays: 0, ot: 0, meters: 0, salary: 0 };
            }

            let currentWorkingDays = 0;
            if (rec.morningStatus === 'Present' || rec.morningStatus === 'Holiday') currentWorkingDays += 0.5;
            if (rec.eveningStatus === 'Present' || rec.eveningStatus === 'Holiday') currentWorkingDays += 0.5;

            if (rec.morningStatus === 'Present' && rec.eveningStatus === 'Present') summaries[rec.employee_id].workingDays += 1;
            summaries[rec.employee_id].ot += (rec.morningOvertimeHours || 0) + (rec.eveningOvertimeHours || 0);
            summaries[rec.employee_id].meters += (rec.metersProduced || 0);

            // Per Employee Salary
            const isMonthly = (emp.monthlyWage || 0) > 0;
            const wage = isMonthly ? (emp.monthlyWage || 0) : (emp.dailyWage || 0);
            const wageEarnings = isMonthly ? (wage / 30) * currentWorkingDays : wage * currentWorkingDays;
            const prodEarnings = (rec.metersProduced || 0) * (emp.ratePerMeter || 0);
            summaries[rec.employee_id].salary += (wageEarnings + prodEarnings);
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
                ot: acc.ot + curr.ot,
                salary: acc.salary + curr.salary
            }), { workingDays: 0, meters: 0, ot: 0, salary: 0 });
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
        }).sort((a, b) => {
            return a.invoiceNumber.localeCompare(b.invoiceNumber, undefined, { numeric: true, sensitivity: 'base' });
        });
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

    const timberReportData = useMemo(() => {
        if (reportType !== 'timber' || !startDate || !endDate) return [];
        
        const selectedSuppliers = selectedEntityId === 'all' 
            ? purchaseShops.map(s => s.name)
            : [purchaseShops.find(s => s.id === selectedEntityId)?.name].filter(Boolean) as string[];

        const ledgerRows: { 
            id: string, 
            date: string, 
            supplierName: string, 
            description: string,
            amount: number, 
            paidAmount: number, 
            paidDate: string,
            balance: number,
            isOpening?: boolean 
        }[] = [];

        selectedSuppliers.forEach(supplier => {
            const supplierMaster = purchaseShops.find(s => s.name === supplier);
            const masterOpeningBalance = supplierMaster ? (Number(supplierMaster.openingBalance) || 0) : 0;
            
            const expensesBefore = timberExpenses
                .filter(e => e.supplierName === supplier && e.date < startDate)
                .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
            
            const paymentsBefore = supplierPayments
                .filter(p => p.supplierName === supplier && p.date < startDate)
                .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            
            const periodStartingBalance = masterOpeningBalance + expensesBefore - paymentsBefore;

            const periodExpenses = timberExpenses
                .filter(e => e.supplierName === supplier && e.date >= startDate && e.date <= endDate)
                .map(e => ({
                    id: e.id,
                    date: e.date,
                    supplierName: e.supplierName,
                    description: `Timber Load (${e.cft.toFixed(2)} CFT @ ₹${e.rate.toFixed(2)})`,
                    amount: Number(e.amount) || 0,
                    paidAmount: 0,
                    paidDate: '',
                    balance: 0 
                }));

            const periodPayments = supplierPayments
                .filter(p => p.supplierName === supplier && p.date >= startDate && p.date <= endDate)
                .map(p => ({
                    id: p.id,
                    date: p.date,
                    supplierName: p.supplierName,
                    description: `Supplier Payment (${p.paymentNumber})`,
                    amount: 0,
                    paidAmount: Number(p.amount) || 0,
                    paidDate: p.date,
                    balance: 0 
                }));

            const supplierRows = [
                ...periodExpenses,
                ...periodPayments
            ].sort((a, b) => {
                const dateComp = a.date.localeCompare(b.date);
                if (dateComp !== 0) return dateComp;
                return a.amount > 0 ? -1 : 1;
            });

            if (periodStartingBalance !== 0 || supplierRows.length > 0) {
                ledgerRows.push({
                    id: `OB-${supplier}`,
                    date: startDate,
                    supplierName: supplier,
                    description: 'Balance Brought Forward',
                    amount: 0,
                    paidAmount: 0,
                    paidDate: '',
                    balance: periodStartingBalance,
                    isOpening: true
                });
            }

            let currentBal = periodStartingBalance;
            supplierRows.forEach(row => {
                currentBal = currentBal + row.amount - row.paidAmount;
                ledgerRows.push({ ...row, balance: currentBal });
            });
        });

        return ledgerRows.sort((a, b) => {
            const dateComp = a.date.localeCompare(b.date);
            if (dateComp !== 0) return dateComp;
            if (a.isOpening) return -1;
            if (b.isOpening) return 1;
            return 0;
        });
    }, [timberExpenses, supplierPayments, purchaseShops, startDate, endDate, selectedEntityId, reportType]);

    const timberSummary = useMemo(() => {
        const totalPurchases = timberReportData.filter(r => !r.isOpening).reduce((sum, r) => sum + r.amount, 0);
        const totalPayments = timberReportData.filter(r => !r.isOpening).reduce((sum, r) => sum + r.paidAmount, 0);
        
        const suppliers = Array.from(new Set(timberReportData.map(r => r.supplierName)));
        let totalOutstanding = 0;
        suppliers.forEach(s => {
            const supplierRows = timberReportData.filter(r => r.supplierName === s);
            if (supplierRows.length > 0) {
                totalOutstanding += supplierRows[supplierRows.length - 1].balance;
            }
        });

        return { totalPurchases, totalPayments, totalOutstanding };
    }, [timberReportData]);

    const otherExpenseReportData = useMemo(() => {
        if (reportType !== 'other_expense' || !startDate || !endDate) return [];
        return otherExpenses.filter(exp => {
            const isDateInRange = exp.date >= startDate && exp.date <= endDate;
            let isCategoryMatch = true;
            if (selectedEntityId !== 'all') {
                const selectedCat = expenseCategories.find(c => c.id === selectedEntityId);
                isCategoryMatch = selectedCat ? exp.itemName === selectedCat.name : false;
            }
            return isDateInRange && isCategoryMatch;
        }).sort((a, b) => a.date.localeCompare(b.date));
    }, [otherExpenses, expenseCategories, startDate, endDate, selectedEntityId, reportType]);

    const otherExpenseSummary = useMemo(() => {
        return {
            totalAmount: otherExpenseReportData.reduce((sum, e) => sum + e.amount, 0),
            paidAmount: otherExpenseReportData.filter(e => e.paymentStatus === 'Paid').reduce((sum, e) => sum + e.amount, 0),
            unpaidAmount: otherExpenseReportData.filter(e => e.paymentStatus === 'Unpaid').reduce((sum, e) => sum + e.amount, 0)
        };
    }, [otherExpenseReportData]);

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
        }).sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
    }, [paymentsReceived, startDate, endDate, selectedEntityId, clients, reportType]);

    const paymentReceivedSummary = useMemo(() => {
        return {
            totalPayments: paymentReceivedReportData.length,
            totalAmount: paymentReceivedReportData.reduce((sum, p) => sum + p.amount, 0)
        };
    }, [paymentReceivedReportData]);

    const processReportData = useMemo(() => {
        if (reportType !== 'process' || !startDate || !endDate) return [];
        
        const totals: Record<string, { process: string, pcs: number, mtr: number }> = {};
        
        deliveryChallans.filter(c => c.date >= startDate && c.date <= endDate).forEach(c => {
            const pList = (c.splitProcess && c.splitProcess.length > 0) ? c.splitProcess : c.process;
            pList.forEach(p => {
                if (!totals[p]) totals[p] = { process: p, pcs: 0, mtr: 0 };
                totals[p].pcs += c.pcs;
                totals[p].mtr += (c.finalMeter && c.finalMeter > 0) ? c.finalMeter : c.mtr;
            });
        });
        
        return Object.values(totals).sort((a, b) => b.mtr - a.mtr);
    }, [deliveryChallans, startDate, endDate, reportType]);

    const handlePrint = () => { window.print(); };

    const hasData = useMemo(() => {
        if (reportType === 'attendance') return attendanceReportData.length > 0;
        if (reportType === 'invoice') return invoiceReportData.length > 0;
        if (reportType === 'purchase') return purchaseReportData.length > 0;
        if (reportType === 'payment_received') return paymentReceivedReportData.length > 0;
        if (reportType === 'timber') return timberReportData.length > 0;
        if (reportType === 'other_expense') return otherExpenseReportData.length > 0;
        if (reportType === 'process') return processReportData.length > 0;
        return false;
    }, [reportType, attendanceReportData, invoiceReportData, purchaseReportData, paymentReceivedReportData, timberReportData, otherExpenseReportData, processReportData]);

    const handleDownloadExcel = () => {
        if (!hasData) return;
        const wb = XLSX.utils.book_new();
        let data: any[] = [];
        let sheetName = "";
        let fileName = "";
        if (reportType === 'attendance') {
            sheetName = "Attendance";
            fileName = `Attendance_Report_${startDate}_${endDate}.xlsx`;
            data = selectedEntityId === 'all' ? employeeSummaries.map((s, idx) => ({ 'S.NO': idx + 1, 'Employee Name': s.name, 'Working Days': s.workingDays, 'Meters Produced': s.meters, 'Overtime Hours': s.ot, 'Salary': s.salary })) : attendanceReportData.map((rec, idx) => ({ 'S.NO': idx + 1, 'Date': rec.date, 'Employee': getEmployeeName(rec.employee_id), 'Morning Status': rec.morningStatus, 'Evening Status': rec.eveningStatus, 'Overtime Hours': (rec.morningOvertimeHours || 0) + (rec.eveningOvertimeHours || 0), 'Meters Produced': rec.metersProduced }));
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
            data = paymentReceivedReportData.map((p, idx) => ({ 'S.NO': idx + 1, 'Date': p.paymentDate, 'Client Name': p.clientName, 'Opening Balance': p.openingBalance, 'Amount Received': p.amount, 'Payment Mode': p.payment_mode, 'Reference Number': p.reference_number }));
        } else if (reportType === 'timber') {
            sheetName = "Timber";
            fileName = `Timber_Report_${startDate}_${endDate}.xlsx`;
            data = timberReportData.map((e, idx) => ({ 'S.NO': idx + 1, 'Date': e.date, 'Supplier': e.supplierName, 'Description': e.description, 'Debit (Amount)': e.amount || '', 'Credit (Paid)': e.paidAmount || '', 'Paid Date': e.paidDate || '', 'Balance': e.balance }));
        } else if (reportType === 'other_expense') {
            sheetName = "Expenses";
            fileName = `Expenses_Report_${startDate}_${endDate}.xlsx`;
            data = otherExpenseReportData.map((e, idx) => ({ 'S.NO': idx + 1, 'Date': e.date, 'Category': e.itemName, 'Status': e.paymentStatus, 'Mode': e.paymentMode, 'Amount': e.amount }));
        } else if (reportType === 'process') {
            sheetName = "Process";
            fileName = `Process_Wise_Report_${startDate}_${endDate}.xlsx`;
            data = processReportData.map((p, idx) => ({ 'S.NO': idx + 1, 'Process': p.process, 'Total Pcs': p.pcs, 'Total Meters': p.mtr }));
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
                            <option value="timber">Timber Report</option>
                            <option value="other_expense">Other Expenses Report</option>
                            <option value="process">Process Wise Report</option>
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
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                            {reportType === 'attendance' ? 'Employee' : 
                             (reportType === 'purchase' || reportType === 'timber') ? 'Shop / Supplier' : 
                             reportType === 'other_expense' ? 'Expense Category' : 'Client'}
                        </label>
                        <select value={selectedEntityId} onChange={(e) => setSelectedEntityId(e.target.value)} disabled={reportType === 'process'} className="block w-full px-3 py-2.5 text-sm rounded-md border-secondary-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-secondary-50">
                            <option value="all">All {reportType === 'attendance' ? 'Employees' : (reportType === 'purchase' || reportType === 'timber' ? 'Shops' : (reportType === 'other_expense' ? 'Categories' : (reportType === 'process' ? 'Processes' : 'Clients')))}</option>
                            {reportType === 'attendance' ? sortedEmployees.map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>)) : 
                             (reportType === 'purchase' || reportType === 'timber') ? sortedShops.map(shop => (<option key={shop.id} value={shop.id}>{shop.name}</option>)) : 
                             reportType === 'other_expense' ? sortedCategories.map(cat => (<option key={cat.id} value={cat.id}>{cat.name}</option>)) :
                             sortedClients.map(client => (<option key={client.id} value={client.id}>{client.name}</option>))}
                        </select>
                    </div>
                </div>
            </div>

            <div id="printable-statement" className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold text-secondary-900 text-center uppercase">
                        {reportType === 'attendance' ? 'Attendance & Production Report' : 
                         reportType === 'invoice' ? 'Invoice Report' : 
                         reportType === 'purchase' ? 'Purchase Report' : 
                         reportType === 'timber' ? 'Timber Report' :
                         reportType === 'other_expense' ? 'Other Expenses Report' :
                         reportType === 'process' ? 'Process Wise Production Report' :
                         'Payment Received Report'}
                    </h2>
                    <p className="text-center text-secondary-500 text-sm mt-1">Period: {formatDateForDisplay(startDate)} to {formatDateForDisplay(endDate)}</p>
                </div>

                {reportType === 'process' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-left border-collapse">
                            <thead className="bg-secondary-100 uppercase">
                                <tr>
                                    <th className="px-3 py-2 border w-10 text-center font-bold">S.NO</th>
                                    <th className="px-3 py-2 border font-bold">PROCESS NAME</th>
                                    <th className="px-3 py-2 text-right font-bold">TOTAL PCS</th>
                                    <th className="px-3 py-2 text-right font-bold">TOTAL METERS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processReportData.map((p, idx) => (
                                    <tr key={idx} className="border-b hover:bg-secondary-50 transition-colors">
                                        <td className="px-3 py-2 border text-center">{idx + 1}</td>
                                        <td className="px-3 py-2 border font-medium uppercase text-secondary-900">{p.process}</td>
                                        <td className="px-3 py-2 border text-right">{p.pcs}</td>
                                        <td className="px-3 py-2 border text-right font-bold text-primary-700">{p.mtr.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {processReportData.length === 0 && (
                                    <tr><td colSpan={4} className="px-3 py-8 text-center text-secondary-500 italic">No production data found for the selected range.</td></tr>
                                )}
                            </tbody>
                            <tfoot className="bg-secondary-50 font-bold">
                                <tr>
                                    <td colSpan={2} className="px-3 py-2 border text-right uppercase">Total Production:</td>
                                    <td className="px-3 py-2 border text-right">{processReportData.reduce((sum, p) => sum + p.pcs, 0)}</td>
                                    <td className="px-3 py-2 border text-right">
                                        {processReportData.reduce((sum, p) => sum + p.mtr, 0).toFixed(2)} mtr
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}

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
                            <div className="flex-1 bg-indigo-50 p-2 rounded border border-indigo-100 text-center">
                                <p className="text-[10px] text-indigo-600 font-bold uppercase">Total Salary</p>
                                <p className="text-lg font-bold text-indigo-800">₹{numberFormat(attendanceSummary.totalSalary)}</p>
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
                                                <th className="px-3 py-2 border border-secondary-200 text-right">Salary</th>
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
                                                    <td className="px-3 py-1.5 border border-secondary-200 text-right font-medium text-primary-700">₹{numberFormat(summary.salary)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-secondary-50 font-bold">
                                            <tr>
                                                <td colSpan={2} className="px-3 py-2 border border-secondary-200 text-right italic">Page Wise Total:</td>
                                                <td className="px-3 py-2 border border-secondary-200 text-right">{chunk.totals.workingDays}</td>
                                                <td className="px-3 py-2 border border-secondary-200 text-right">{chunk.totals.meters.toFixed(2)}</td>
                                                <td className="px-3 py-2 border border-secondary-200 text-right">{chunk.totals.ot}</td>
                                                <td className="px-3 py-2 border border-secondary-200 text-right">₹{numberFormat(chunk.totals.salary)}</td>
                                            </tr>
                                            {chunkIdx === chunkedEmployeeSummaries.length - 1 && (
                                                <tr className="bg-primary-50 text-primary-900">
                                                    <td colSpan={2} className="px-3 py-2 border border-secondary-200 text-right uppercase">Grand Total:</td>
                                                    <td className="px-3 py-2 border border-secondary-200 text-right">{attendanceSummary.totalDaysWorked}</td>
                                                    <td className="px-3 py-2 border border-secondary-200 text-right">{attendanceSummary.totalMeters.toFixed(2)}</td>
                                                    <td className="px-3 py-2 border border-secondary-200 text-right">{attendanceSummary.totalOvertime}</td>
                                                    <td className="px-3 py-2 border border-secondary-200 text-right">₹{numberFormat(attendanceSummary.totalSalary)}</td>
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
                                    <tr>
                                        <td colSpan={4} className="px-3 py-2 border text-right italic">Grand Total:</td>
                                        <td className="px-3 py-2 border text-right">{attendanceSummary.totalOvertime}</td>
                                        <td className="px-3 py-2 border text-right">{attendanceSummary.totalMeters.toFixed(2)}</td>
                                    </tr>
                                    <tr className="bg-primary-50 text-primary-900">
                                        <td colSpan={4} className="px-3 py-2 border text-right uppercase">Estimated Net Salary:</td>
                                        <td colSpan={2} className="px-3 py-2 border text-right font-bold text-lg">₹{numberFormat(attendanceSummary.totalSalary)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                    </>
                )}

                {reportType === 'timber' && (
                    <>
                         <div className="flex gap-2 mb-8 no-print">
                            <div className="flex-1 bg-indigo-50 p-2 rounded border border-indigo-100 text-center">
                                <p className="text-[10px] text-indigo-600 font-bold uppercase">Total Purchases</p>
                                <p className="text-lg font-bold text-indigo-800">₹{numberFormat(timberSummary.totalPurchases)}</p>
                            </div>
                            <div className="flex-1 bg-success-50 p-2 rounded border border-success-100 text-center">
                                <p className="text-[10px] text-success-600 font-bold uppercase">Total Payments</p>
                                <p className="text-lg font-bold text-success-800">₹{numberFormat(timberSummary.totalPayments)}</p>
                            </div>
                            <div className="flex-1 bg-danger-50 p-2 rounded border border-danger-100 text-center">
                                <p className="text-[10px] text-danger-600 font-bold uppercase">Net Outstanding</p>
                                <p className="text-lg font-bold text-danger-800">₹{numberFormat(timberSummary.totalOutstanding)}</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-[11px] text-left border-collapse">
                                <thead className="bg-secondary-100 uppercase">
                                    <tr>
                                        <th className="px-3 py-2 border w-10 text-center font-bold">S.NO</th>
                                        <th className="px-3 py-2 border font-bold">DATE</th>
                                        <th className="px-3 py-2 border font-bold">SUPPLIER</th>
                                        <th className="px-3 py-2 border font-bold">DESCRIPTION</th>
                                        <th className="px-3 py-2 text-right font-bold">DEBIT (PUR)</th>
                                        <th className="px-3 py-2 text-right font-bold">CREDIT (PAY)</th>
                                        <th className="px-3 py-2 text-right font-bold">BALANCE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {timberReportData.map((r, index) => (
                                        <tr key={r.id} className={`border-b ${r.isOpening ? 'bg-orange-50 italic font-medium' : ''}`}>
                                            <td className="px-3 py-1.5 border text-center">{index + 1}</td>
                                            <td className="px-3 py-1.5 border">{formatDateForDisplay(r.date)}</td>
                                            <td className="px-3 py-1.5 border font-medium uppercase">{r.supplierName}</td>
                                            <td className="px-3 py-1.5 border text-secondary-600">{r.description}</td>
                                            <td className="px-3 py-1.5 border text-right font-medium text-secondary-800">{r.amount > 0 ? `₹${numberFormat(r.amount)}` : ''}</td>
                                            <td className="px-3 py-1.5 border text-right font-bold text-success-700">{r.paidAmount > 0 ? `₹${numberFormat(r.paidAmount)}` : ''}</td>
                                            <td className={`px-3 py-1.5 border text-right font-bold ${r.balance > 0 ? 'text-danger-600' : 'text-success-600'}`}>
                                                ₹{numberFormat(Math.abs(r.balance))} {r.balance > 0 ? 'DR' : (r.balance < 0 ? 'CR' : '')}
                                            </td>
                                        </tr>
                                    ))}
                                    {timberReportData.length === 0 && (
                                        <tr><td colSpan={7} className="px-3 py-8 text-center text-secondary-500 italic">No data found for the selected range and supplier.</td></tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-secondary-50 font-bold">
                                    <tr>
                                        <td colSpan={4} className="px-3 py-2 border text-right uppercase">Period Totals & Final Balance:</td>
                                        <td className="px-3 py-2 border text-right">₹{numberFormat(timberSummary.totalPurchases)}</td>
                                        <td className="px-3 py-2 border text-right text-success-700">₹{numberFormat(timberSummary.totalPayments)}</td>
                                        <td className="px-3 py-2 border text-right text-danger-700 font-extrabold text-xs">₹{numberFormat(timberSummary.totalOutstanding)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </>
                )}

                {reportType === 'other_expense' && (
                    <>
                        <div className="flex gap-2 mb-8 no-print">
                            <div className="flex-1 bg-secondary-50 p-2 rounded border border-secondary-100 text-center">
                                <p className="text-[10px] text-secondary-600 font-bold uppercase">Total Expenses</p>
                                <p className="text-lg font-bold text-secondary-800">₹{numberFormat(otherExpenseSummary.totalAmount)}</p>
                            </div>
                            <div className="flex-1 bg-success-50 p-2 rounded border border-success-100 text-center">
                                <p className="text-[10px] text-success-600 font-bold uppercase">Total Paid</p>
                                <p className="text-lg font-bold text-secondary-800">₹{numberFormat(otherExpenseSummary.paidAmount)}</p>
                            </div>
                            <div className="flex-1 bg-danger-50 p-2 rounded border border-danger-100 text-center">
                                <p className="text-[10px] text-danger-600 font-bold uppercase">Pending Bills</p>
                                <p className="text-lg font-bold text-secondary-800">₹{numberFormat(otherExpenseSummary.unpaidAmount)}</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-[11px] text-left border-collapse">
                                <thead className="bg-secondary-100 uppercase">
                                    <tr>
                                        <th className="px-3 py-2 border w-10 text-center">S.NO</th>
                                        <th className="px-3 py-2 border">Date</th>
                                        <th className="px-3 py-2">Category / Item</th>
                                        <th className="px-3 py-2">Mode</th>
                                        <th className="px-3 py-2">Status</th>
                                        <th className="px-3 py-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {otherExpenseReportData.map((e, index) => (
                                        <tr key={e.id} className="border-b">
                                            <td className="px-3 py-1.5 border text-center">{index + 1}</td>
                                            <td className="px-3 py-1.5 border">{formatDateForDisplay(e.date)}</td>
                                            <td className="px-3 py-1.5 border font-medium">{e.itemName}</td>
                                            <td className="px-3 py-1.5 border">{e.paymentMode}</td>
                                            <td className="px-3 py-1.5 border">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${e.paymentStatus === 'Paid' ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'}`}>
                                                    {e.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-3 py-1.5 border text-right font-bold">₹{numberFormat(e.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-secondary-50 font-bold">
                                    <tr>
                                        <td colSpan={5} className="px-3 py-2 border text-right italic">Grand Total:</td>
                                        <td className="px-3 py-2 border text-right">₹{numberFormat(otherExpenseSummary.totalAmount)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
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
                                    <th className="px-3 py-2">Mode</th>
                                    <th className="px-3 py-2">Reference</th>
                                    <th className="px-3 py-2 text-right">Amount</th>
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
