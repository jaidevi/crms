
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { Login } from './components/Login';
import DashboardScreen from './components/DashboardScreen';
import PurchaseOrderScreen from './components/PurchaseOrderScreen';
import DeliveryChallanScreen from './components/DeliveryChallanScreen';
import InvoicesScreen from './components/InvoicesScreen';
import PaymentReceivedScreen from './components/PaymentReceivedScreen';
import SettingsScreen from './components/SettingsScreen';
import ShopMasterScreen from './components/ShopMasterScreen';
import PurchaseShopMasterScreen from './components/PurchaseShopMasterScreen';
import EmployeeMasterScreen from './components/EmployeeMasterScreen';
import PartyDCProcessMasterScreen from './components/PartyDCProcessMasterScreen';
import ExpenseCategoryMasterScreen from './components/ExpenseCategoryMasterScreen';
import UserAdminScreen from './components/UserAdminScreen';
import ProductsScreen from './components/NewItemForm';
import SalaryScreen from './components/SalaryScreen';
import AttendanceScreen from './components/AttendanceScreen';
import ReportsScreen from './components/ReportsScreen';
import { WarningIcon, SpinnerIcon } from './components/Icons';
import type {
  CompanyDetails, ProcessType,
  Client, PurchaseShop, Employee, MasterItem,
  PurchaseOrder, PONumberConfig, DeliveryChallanNumberConfig, InvoiceNumberConfig,
  SupplierPaymentNumberConfig, EmployeeAdvance, OtherExpense, ExpenseCategory,
  TimberExpense, SupplierPayment, DeliveryChallan, Invoice,
  PaymentReceived, AttendanceRecord, Payslip
} from './types';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1500;

export const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [activeScreen, setActiveScreen] = useState('Dashboard');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({
    name: '', addressLine1: '', addressLine2: '', phone: '', email: '', gstin: '', hsnSac: '', bankName: '', bankAccountNumber: '', bankIfscCode: '', logoUrl: '', reportNotificationEmail: ''
  });

  // State Definitions
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentsReceived, setPaymentsReceived] = useState<PaymentReceived[]>([]);
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>([]);
  const [advances, setAdvances] = useState<EmployeeAdvance[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [purchaseShops, setPurchaseShops] = useState<PurchaseShop[]>([]);
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
  const [poNumberConfig, setPoNumberConfig] = useState<PONumberConfig>({ prefix: 'PO', nextNumber: 1 });
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [timberExpenses, setTimberExpenses] = useState<TimberExpense[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [supplierPaymentConfig, setSupplierPaymentConfig] = useState<SupplierPaymentNumberConfig>({ prefix: 'PAY', nextNumber: 1 });
  const [bankNames, setBankNames] = useState<string[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [deliveryChallanNumberConfig, setDeliveryChallanNumberConfig] = useState<DeliveryChallanNumberConfig>({ prefix: 'DC', nextNumber: 1 });
  const [outsourcingChallanNumberConfig, setOutsourcingChallanNumberConfig] = useState<DeliveryChallanNumberConfig>({ prefix: 'OUT', nextNumber: 1 });
  const [invoiceNumberConfig, setInvoiceNumberConfig] = useState<InvoiceNumberConfig>({ mode: 'auto', prefix: 'INV', nextNumber: 1 });
  const [ngstInvoiceNumberConfig, setNgstInvoiceNumberConfig] = useState<InvoiceNumberConfig>({ mode: 'auto', prefix: 'NGST', nextNumber: 1 });

  // Handle Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setGuestMode(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const fetchTable = useCallback(async (table: string, setter: Function, transformer?: Function, retryCount = 0): Promise<boolean> => {
      try {
          let query: any = supabase.from(table).select('*');
          
          if (table === 'purchase_orders') {
              query = supabase.from('purchase_orders').select('*, purchase_order_items(*)');
          } else if (table === 'invoices') {
              query = supabase.from('invoices').select('*, invoice_items(*)');
          } else if (table === 'company_details') {
              query = supabase.from('company_details').select('*').single();
          }

          const { data, error } = await query;
          if (error) {
              if (table === 'company_details' && error.code === 'PGRST116') return true; // Valid empty state
              throw error;
          }
          if (data) {
              setter(transformer ? transformer(data) : data);
          }
          return true;
      } catch (error: any) {
          const isNetworkError = error.message?.includes('fetch') || error.name === 'TypeError' || error.status === 0;
          if (isNetworkError && retryCount < MAX_RETRIES) {
              const backoffDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
              await delay(backoffDelay);
              return fetchTable(table, setter, transformer, retryCount + 1);
          }
          console.error(`Error fetching ${table}:`, error.message || error);
          if (isNetworkError) {
              setFetchError('Unable to connect to database. Please check your internet connection or disable ad-blockers.');
          }
          return false;
      }
  }, []);

  const loadAllData = useCallback(async () => {
    setFetchError(null);
    setIsInitialLoadComplete(false);
    
    // Critical initial fetches
    const results = await Promise.all([
        fetchTable('company_details', (data: any) => {
            if(data) {
                setCompanyDetails({
                    name: data.name || '',
                    addressLine1: data.address_line_1 || '',
                    addressLine2: data.address_line_2 || '',
                    phone: data.phone || '',
                    email: data.email || '',
                    gstin: data.gstin || '',
                    hsnSac: data.hsn_sac || '998821',
                    bankName: data.bank_name || '',
                    bankAccountNumber: data.bank_account_number || '',
                    bankIfscCode: data.bank_ifsc_code || '',
                    logoUrl: data.logo_url || '',
                    reportNotificationEmail: data.report_notification_email || '',
                });
            }
        }),
        fetchTable('numbering_configs', (data: any[]) => {
            data.forEach(config => {
                if (config.id === 'po') setPoNumberConfig({ prefix: config.prefix ?? 'PO', nextNumber: config.next_number ?? 1 });
                if (config.id === 'dc') setDeliveryChallanNumberConfig({ prefix: config.prefix ?? 'DC', nextNumber: config.next_number ?? 1 });
                if (config.id === 'dc_outsourcing') setOutsourcingChallanNumberConfig({ prefix: config.prefix ?? 'OUT', nextNumber: config.next_number ?? 1 });
                if (config.id === 'invoice') setInvoiceNumberConfig({ mode: config.mode ?? 'auto', prefix: config.prefix ?? 'INV', nextNumber: config.next_number ?? 1 });
                if (config.id === 'invoice_ngst') setNgstInvoiceNumberConfig({ mode: config.mode ?? 'auto', prefix: config.prefix ?? 'NGST', nextNumber: config.next_number ?? 1 });
                if (config.id === 'supplier_payment') setSupplierPaymentConfig({ prefix: config.prefix ?? 'PAY', nextNumber: config.next_number ?? 1 });
            });
        })
    ]);

    if (results.some(r => r === false)) {
        return; // Connection failed
    }

    // Parallel fetch for remaining data
    await Promise.all([
        fetchTable('clients', setClients, (data: any[]) => data.map(d => ({
            id: d.id, name: d.name, phone: d.phone, email: d.email, address: d.address, city: d.city, state: d.state, pincode: d.pincode, gstNo: d.gst_no, panNo: d.pan_no, paymentTerms: d.payment_terms, openingBalance: d.opening_balance || 0, processes: Array.isArray(d.processes) ? d.processes : []
        }))),
        fetchTable('purchase_shops', setPurchaseShops, (data: any[]) => data.map(d => ({
            id: d.id, name: d.name, phone: d.phone, email: d.email, address: d.address, city: d.city, state: d.state, pincode: d.pincode, gstNo: d.gst_no, panNo: d.pan_no, paymentTerms: d.payment_terms, openingBalance: d.opening_balance || 0
        }))),
        fetchTable('employees', setEmployees, (data: any[]) => data.map(d => ({
            id: d.id, name: d.name, designation: d.designation, phone: d.phone, dailyWage: d.daily_wage || 0, monthlyWage: d.monthly_wage || 0, ratePerMeter: d.rate_per_meter || 0
        }))),
        fetchTable('process_types', setProcessTypes),
        fetchTable('master_items', setMasterItems),
        fetchTable('expense_categories', setExpenseCategories),
        fetchTable('purchase_orders', setPurchaseOrders, (data: any[]) => data.map(d => ({
            id: d.id, poNumber: d.po_number, poDate: d.po_date, shopName: d.shop_name, totalAmount: d.total_amount || 0, gstNo: d.gst_no, paymentMode: d.payment_mode, status: d.status, paymentTerms: d.payment_terms, referenceId: d.reference_id, bankName: d.bank_name, cheque_date: d.cheque_date, items: Array.isArray(d.purchase_order_items) ? d.purchase_order_items.map((i: any) => ({
                id: i.id, name: i.name, quantity: i.quantity || 0, rate: i.rate || 0, amount: i.amount || 0
            })) : []
        }))),
        fetchTable('delivery_challans', setDeliveryChallans, (data: any[]) => data.map(d => {
            let dcImage = []; try { dcImage = d.dc_image ? (typeof d.dc_image === 'string' ? JSON.parse(d.dc_image) : d.dc_image) : []; } catch (e) {}
            let sampleImage = []; try { sampleImage = d.sample_image ? (typeof d.sample_image === 'string' ? JSON.parse(d.sample_image) : d.sample_image) : []; } catch (e) {}
            return {
                id: d.id, challanNumber: d.challan_number, date: d.date, partyName: d.party_name, partyDCNo: d.party_dc_no, process: d.process ? (
                    (() => { try { const parsed = JSON.parse(d.process); if (Array.isArray(parsed)) return parsed; } catch(e) {} return d.process.split(',').map((s: string) => s.trim().replace(/^"/, '').replace(/"$/, '')).filter((s: string) => s !== ""); })()
                ) : [], splitProcess: d.split_process ? (Array.isArray(d.split_process) ? d.split_process : []) : [], designNo: d.design_no, pcs: d.pcs || 0, mtr: d.mtr || 0, finalMeter: d.final_meter || 0, width: d.width || 0, shrinkage: d.shrinkage, pin: d.pin, pick: d.pick, percentage: d.percentage || '', extraWork: d.extra_work, status: d.status, workerName: d.worker_name, workingUnit: d.working_unit, isOutsourcing: d.is_outsourcing, dcImage: Array.isArray(dcImage) ? dcImage : [], sampleImage: Array.isArray(sampleImage) ? sampleImage : []
            };
        })),
        fetchTable('invoices', setInvoices, (data: any[]) => data.map(d => ({
            id: d.id, invoiceNumber: d.invoice_number, invoiceDate: d.invoice_date, clientName: d.client_name, subTotal: d.sub_total || 0, totalCgst: d.total_cgst || 0, totalSgst: d.total_sgst || 0, totalTaxAmount: d.total_tax_amount || 0, roundedOff: d.rounded_off || 0, totalAmount: d.total_amount || 0, taxType: d.tax_type || 'GST', items: Array.isArray(d.invoice_items) ? d.invoice_items.map((i: any) => ({
                id: i.id, challanNumber: i.challan_number, challanDate: i.challan_date, process: i.process, description: i.description, designNo: i.design_no, hsnSac: i.hsn_sac,
                pcs: i.pcs || 0, mtr: i.mtr || 0, rate: i.rate || 0, amount: i.amount || 0, subtotal: i.subtotal || 0, cgst: i.cgst || 0, sgst: i.sgst || 0
            })) : []
        }))),
        fetchTable('payments_received', setPaymentsReceived, (data: any[]) => data.map(d => ({
            id: d.id, clientName: d.client_name, paymentDate: d.payment_date, amount: d.amount || 0, openingBalance: d.opening_balance || 0, paymentMode: d.payment_mode, referenceNumber: d.reference_number, notes: d.notes, image: d.image
        }))),
        fetchTable('employee_advances', setAdvances, (data: any[]) => data.map(d => ({
            id: d.id, employeeId: d.employee_id, date: d.date, amount: d.amount || 0, paidAmount: d.paid_amount || 0, notes: d.notes
        }))),
        fetchTable('other_expenses', setOtherExpenses, (data: any[]) => data.map(d => ({
            id: d.id, date: d.date, itemName: d.item_name, amount: d.amount || 0, notes: d.notes, bankName: d.bank_name, chequeDate: d.cheque_date, paymentMode: d.payment_mode, paymentStatus: d.payment_status, paymentTerms: d.payment_terms
        }))),
        fetchTable('timber_expenses', setTimberExpenses, (data: any[]) => data.map(d => ({
            id: d.id, date: d.date, supplierName: d.supplier_name, openingBalance: d.opening_balance || 0, loadWeight: d.load_weight || 0, vehicleWeight: d.vehicle_weight || 0, cft: d.cft || 0, rate: d.rate || 0, amount: d.amount || 0, notes: d.notes, paymentMode: d.payment_mode, paymentStatus: d.payment_status, bankName: d.bank_name, chequeDate: d.cheque_date, paymentTerms: d.payment_terms
        }))),
        fetchTable('supplier_payments', setSupplierPayments, (data: any[]) => data.map(d => ({
            id: d.id, paymentNumber: d.payment_number, date: d.date, supplierName: d.supplier_name, amount: d.amount || 0, paymentMode: d.payment_mode, referenceId: d.reference_id, image: d.image
        }))),
        fetchTable('attendance', setAttendanceRecords, (data: any[]) => data.map(d => ({
            id: d.id, employee_id: d.employee_id, date: d.date, morningStatus: d.morning_status || 'Present', eveningStatus: d.evening_status || 'Present', morningOvertimeHours: d.morning_overtime_hours || 0, eveningOvertimeHours: d.evening_overtime_hours || 0, metersProduced: d.meters_produced || 0, created_at: d.created_at, updated_at: d.updated_at
        }))),
        fetchTable('payslips', setPayslips, (data: any[]) => data.map(d => ({
            id: d.id, employeeId: d.employee_id, employeeName: d.employee_name, payslipDate: d.payslip_date, payPeriodStart: d.pay_period_start, payPeriodEnd: d.pay_period_end, totalWorkingDays: d.total_working_days || 0, otHours: d.ot_hours || 0, wageEarnings: d.wage_earnings || 0, productionEarnings: d.production_earnings || 0, grossSalary: d.gross_salary || 0, advanceDeduction: d.advance_deduction || 0, netSalary: d.net_salary || 0, totalOutstandingAdvance: d.total_outstanding_advance || 0
        })))
    ]);
    
    setIsInitialLoadComplete(true);
  }, [fetchTable]);

  useEffect(() => {
    if (session || guestMode) {
      loadAllData();
    }
  }, [session, guestMode, loadAllData]);

  // Timber Expense Handlers
  const handleAddTimberExpense = async (newExpense: Omit<TimberExpense, 'id'>) => {
    const { data, error } = await supabase.from('timber_expenses').insert([{
      date: newExpense.date,
      supplier_name: newExpense.supplierName,
      opening_balance: newExpense.openingBalance,
      load_weight: newExpense.loadWeight,
      vehicle_weight: newExpense.vehicleWeight,
      cft: newExpense.cft,
      rate: newExpense.rate,
      amount: newExpense.amount,
      notes: newExpense.notes,
      bank_name: newExpense.bankName,
      cheque_date: newExpense.chequeDate || null, 
      payment_mode: newExpense.paymentMode,
      payment_status: newExpense.paymentStatus,
      payment_terms: newExpense.paymentTerms
    }]).select();
    if (!error && data) setTimberExpenses(prev => [...prev, { ...newExpense, id: data[0].id }]);
    else if (error) alert("Error saving timber expense: " + error.message);
  };

  const handleUpdateTimberExpense = async (updatedExpense: TimberExpense) => {
    const { error } = await supabase.from('timber_expenses').update({
      date: updatedExpense.date,
      supplier_name: updatedExpense.supplierName,
      opening_balance: updatedExpense.openingBalance,
      load_weight: updatedExpense.loadWeight,
      vehicle_weight: updatedExpense.vehicleWeight,
      cft: updatedExpense.cft,
      rate: updatedExpense.rate,
      amount: updatedExpense.amount,
      notes: updatedExpense.notes,
      bank_name: updatedExpense.bankName,
      cheque_date: updatedExpense.chequeDate || null,
      payment_mode: updatedExpense.paymentMode,
      payment_status: updatedExpense.paymentStatus,
      payment_terms: updatedExpense.paymentTerms
    }).eq('id', updatedExpense.id);
    if (!error) setTimberExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    else alert("Error updating timber expense: " + error.message);
  };

  const handleDeleteTimberExpense = async (id: string) => {
    const { error } = await supabase.from('timber_expenses').delete().eq('id', id);
    if (!error) setTimberExpenses(prev => prev.filter(e => e.id !== id));
    else alert("Error deleting timber expense: " + error.message);
  };

  // Supplier Payment Handler
  const handleAddSupplierPayment = async (payment: Omit<SupplierPayment, 'id'>) => {
    const { data, error } = await supabase.from('supplier_payments').insert([{
        payment_number: payment.paymentNumber,
        date: payment.date,
        supplier_name: payment.supplierName,
        amount: payment.amount,
        payment_mode: payment.paymentMode,
        reference_id: payment.referenceId,
        image: payment.image
    }]).select();

    if (!error && data) {
        setSupplierPayments(prev => [...prev, { ...payment, id: data[0].id }]);
        
        // Increment the numbering config
        const nextNum = supplierPaymentConfig.nextNumber + 1;
        await supabase.from('numbering_configs').update({ next_number: nextNum }).eq('id', 'supplier_payment');
        setSupplierPaymentConfig(prev => ({ ...prev, nextNumber: nextNum }));
    } else if (error) {
        throw error; // Let the caller (PurchaseOrderScreen) handle the alert
    }
  };

  const handleAddOtherExpense = async (newExpense: Omit<OtherExpense, 'id'>) => {
      const { data, error } = await supabase.from('other_expenses').insert([{
          date: newExpense.date,
          item_name: newExpense.itemName,
          amount: newExpense.amount,
          notes: newExpense.notes,
          bank_name: newExpense.bankName,
          cheque_date: newExpense.chequeDate || null,
          payment_mode: newExpense.paymentMode,
          payment_status: newExpense.paymentStatus,
          payment_terms: newExpense.paymentTerms
      }]).select();
      if (!error && data) setOtherExpenses(prev => [...prev, { ...newExpense, id: data[0].id }]);
      else if (error) alert("Error saving expense: " + error.message);
  };

  const handleUpdateOtherExpense = async (updatedExpense: OtherExpense) => {
      const { error } = await supabase.from('other_expenses').update({
          date: updatedExpense.date,
          item_name: updatedExpense.itemName,
          amount: updatedExpense.amount,
          notes: updatedExpense.notes,
          bank_name: updatedExpense.bankName,
          cheque_date: updatedExpense.chequeDate || null,
          payment_mode: updatedExpense.paymentMode,
          payment_status: updatedExpense.paymentStatus,
          payment_terms: updatedExpense.paymentTerms
      }).eq('id', updatedExpense.id);
      if (!error) setOtherExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
      else alert("Error updating expense: " + error.message);
  };

  const handleDeleteOtherExpense = async (id: string) => {
      const { error } = await supabase.from('other_expenses').delete().eq('id', id);
      if (!error) setOtherExpenses(prev => prev.filter(e => e.id !== id));
      else alert("Error deleting expense: " + error.message);
  };

  const handleAddAdvance = async (newAdvance: Omit<EmployeeAdvance, 'id'>) => {
      const { data, error } = await supabase.from('employee_advances').insert([{
          employee_id: newAdvance.employeeId,
          date: newAdvance.date,
          amount: newAdvance.amount,
          paid_amount: newAdvance.paidAmount,
          notes: newAdvance.notes
      }]).select();
      if (!error && data) setAdvances(prev => [...prev, { ...newAdvance, id: data[0].id }]);
      else if (error) alert("Error saving advance: " + error.message);
  };

  const handleUpdateAdvance = async (updatedAdvance: EmployeeAdvance) => {
      const { error } = await supabase.from('employee_advances').update({
          employee_id: updatedAdvance.employeeId,
          date: updatedAdvance.date,
          amount: updatedAdvance.amount,
          paid_amount: updatedAdvance.paidAmount,
          notes: updatedAdvance.notes
      }).eq('id', updatedAdvance.id);
      if (!error) setAdvances(prev => prev.map(a => a.id === updatedAdvance.id ? updatedAdvance : a));
      else alert("Error updating advance: " + error.message);
  };

  const handleDeleteAdvance = async (id: string) => {
      const { error } = await supabase.from('employee_advances').delete().eq('id', id);
      if (!error) setAdvances(prev => prev.filter(a => a.id !== id));
      else alert("Error deleting advance: " + error.message);
  };

  const handleUpdateCompanyDetails = async (details: CompanyDetails) => {
    const { error } = await supabase.from('company_details').upsert({
      id: 1,
      name: details.name,
      address_line_1: details.addressLine1,
      address_line_2: details.addressLine2,
      phone: details.phone,
      email: details.email,
      gstin: details.gstin,
      hsn_sac: details.hsnSac,
      bank_name: details.bankName,
      bank_account_number: details.bankAccountNumber,
      bank_ifsc_code: details.bankIfscCode,
      logo_url: details.logoUrl,
      report_notification_email: details.reportNotificationEmail
    });
    if (!error) setCompanyDetails(details);
    else alert("Error updating company details: " + error.message);
  };

  const handleAddClient = async (newClient: Omit<Client, 'id'>) => {
    const { data, error } = await supabase.from('clients').insert([{
      name: newClient.name, phone: newClient.phone, email: newClient.email, address: newClient.address,
      city: newClient.city, state: newClient.state, pincode: newClient.pincode, gst_no: newClient.gstNo,
      pan_no: newClient.panNo, payment_terms: newClient.paymentTerms, opening_balance: newClient.openingBalance, processes: newClient.processes
    }]).select();
    if (!error && data) setClients(prev => [...prev, { ...newClient, id: data[0].id }]);
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    /* FIX: Changed incorrect property names 'gst_no' and 'pan_no' to 'gstNo' and 'panNo' */
    const { error } = await supabase.from('clients').update({
        name: updatedClient.name, phone: updatedClient.phone, email: updatedClient.email, address: updatedClient.address,
        city: updatedClient.city, state: updatedClient.state, pincode: updatedClient.pincode, gst_no: updatedClient.gstNo,
        pan_no: updatedClient.panNo, payment_terms: updatedClient.paymentTerms, opening_balance: updatedClient.openingBalance, processes: updatedClient.processes
    }).eq('id', updatedClient.id);
    if (!error) setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleDeleteClient = async (id: string) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) setClients(prev => prev.filter(c => c.id !== id));
  };

  const handleAddPurchaseShop = async (newShop: Omit<PurchaseShop, 'id'>) => {
    const { data, error } = await supabase.from('purchase_shops').insert([{
        name: newShop.name, phone: newShop.phone, email: newShop.email, address: newShop.address,
        city: newShop.city, state: newShop.state, pincode: newShop.pincode, gst_no: newShop.gstNo,
        pan_no: newShop.panNo, payment_terms: newShop.paymentTerms, opening_balance: newShop.openingBalance
    }]).select();
    if (!error && data) setPurchaseShops(prev => [...prev, { ...newShop, id: data[0].id }]);
  };

  const handleUpdatePurchaseShop = async (updatedShop: PurchaseShop) => {
    const { error } = await supabase.from('purchase_shops').update({
        name: updatedShop.name, phone: updatedShop.phone, email: updatedShop.email, address: updatedShop.address,
        city: updatedShop.city, state: updatedShop.state, pincode: updatedShop.pincode, gst_no: updatedShop.gstNo,
        pan_no: updatedShop.panNo, payment_terms: updatedShop.paymentTerms, opening_balance: updatedShop.openingBalance
    }).eq('id', updatedShop.id);
    if (!error) setPurchaseShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
  };

  const handleDeletePurchaseShop = async (id: string) => {
    const { error } = await supabase.from('purchase_shops').delete().eq('id', id);
    if (!error) setPurchaseShops(prev => prev.filter(s => s.id !== id));
  };

  const handleAddEmployee = async (newEmp: Omit<Employee, 'id'>) => {
    const { data, error } = await supabase.from('employees').insert([{
        name: newEmp.name, designation: newEmp.designation, phone: newEmp.phone,
        daily_wage: newEmp.dailyWage, monthly_wage: newEmp.monthlyWage, rate_per_meter: newEmp.ratePerMeter
    }]).select();
    if (!error && data) setEmployees(prev => [...prev, { ...newEmp, id: data[0].id }]);
  };

  const handleUpdateEmployee = async (id: string, updatedEmp: Employee) => {
    const { error } = await supabase.from('employees').update({
        name: updatedEmp.name, designation: updatedEmp.designation, phone: updatedEmp.phone,
        daily_wage: updatedEmp.dailyWage, monthly_wage: updatedEmp.monthlyWage, rate_per_meter: updatedEmp.ratePerMeter
    }).eq('id', id);
    if (!error) setEmployees(prev => prev.map(e => e.id === id ? updatedEmp : e));
  };

  const handleDeleteEmployee = async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const handleAddProcessType = async (proc: { name: string, rate: number }) => {
    const { data, error } = await supabase.from('process_types').insert([{ name: proc.name, rate: proc.rate }]).select();
    if (!error && data) setProcessTypes(prev => [...prev, { id: data[0].id, name: data[0].name, rate: data[0].rate }]);
  };

  const handleUpdateProcessType = async (id: string, proc: { name: string, rate: number }) => {
    const { error } = await supabase.from('process_types').update({ name: proc.name, rate: proc.rate }).eq('id', id);
    if (!error) setProcessTypes(prev => prev.map(p => p.id === id ? { ...p, ...proc } : p));
  };

  const handleDeleteProcessType = async (id: string) => {
    const { error } = await supabase.from('process_types').delete().eq('id', id);
    if (!error) setProcessTypes(prev => prev.filter(p => p.id !== id));
  };

  const handleAddMasterItem = async (item: { name: string, rate: number }) => {
    const { data, error } = await supabase.from('master_items').insert([{ name: item.name, rate: item.rate }]).select();
    if (!error && data) {
        const newItem = { id: data[0].id, name: data[0].name, rate: data[0].rate };
        setMasterItems(prev => [...prev, newItem]);
        return newItem;
    }
    return null;
  };

  const handleAddExpenseCategory = async (name: string) => {
    const { data, error } = await supabase.from('expense_categories').insert([{ name }]).select();
    if (!error && data) {
        const newCat = { id: data[0].id, name: data[0].name };
        setExpenseCategories(prev => [...prev, newCat]);
        return newCat;
    }
    return null;
  };

  const handleUpdateExpenseCategory = async (id: string, name: string) => {
    const { error } = await supabase.from('expense_categories').update({ name }).eq('id', id);
    if (!error) setExpenseCategories(prev => prev.map(c => c.id === id ? { id, name } : c));
  };

  const handleDeleteExpenseCategory = async (id: string) => {
    const { error } = await supabase.from('expense_categories').delete().eq('id', id);
    if (!error) setExpenseCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleAddChallan = async (newChallan: Omit<DeliveryChallan, 'id'>) => {
    const configId = newChallan.isOutsourcing ? 'dc_outsourcing' : 'dc';
    const currentConfig = newChallan.isOutsourcing ? outsourcingChallanNumberConfig : deliveryChallanNumberConfig;

    const { data, error } = await supabase.from('delivery_challans').insert([{
        challan_number: newChallan.challanNumber,
        date: newChallan.date,
        party_name: newChallan.partyName,
        party_dc_no: newChallan.partyDCNo,
        process: JSON.stringify(newChallan.process),
        split_process: newChallan.splitProcess,
        design_no: newChallan.designNo,
        pcs: newChallan.pcs,
        mtr: newChallan.mtr,
        final_meter: newChallan.finalMeter,
        width: newChallan.width,
        shrinkage: newChallan.shrinkage,
        pin: newChallan.pin,
        pick: newChallan.pick,
        percentage: newChallan.percentage,
        extra_work: newChallan.extraWork,
        status: newChallan.status,
        worker_name: newChallan.workerName,
        working_unit: newChallan.workingUnit,
        is_outsourcing: newChallan.isOutsourcing,
        dc_image: newChallan.dcImage,
        sample_image: newChallan.sampleImage
    }]).select();

    if (!error && data) {
        const addedChallan = { ...newChallan, id: data[0].id };
        setDeliveryChallans(prev => [...prev, addedChallan]);
        
        const nextNum = currentConfig.nextNumber + 1;
        await supabase.from('numbering_configs').update({ next_number: nextNum }).eq('id', configId);
        
        if (newChallan.isOutsourcing) {
            setOutsourcingChallanNumberConfig(prev => ({ ...prev, nextNumber: nextNum }));
        } else {
            setDeliveryChallanNumberConfig(prev => ({ ...prev, nextNumber: nextNum }));
        }
    } else if (error) {
        alert("Error saving challan: " + error.message);
    }
  };

  const handleUpdateChallan = async (id: string, updatedChallan: DeliveryChallan) => {
    const { error } = await supabase.from('delivery_challans').update({
        challan_number: updatedChallan.challanNumber,
        date: updatedChallan.date,
        party_name: updatedChallan.partyName,
        party_dc_no: updatedChallan.partyDCNo,
        process: JSON.stringify(updatedChallan.process),
        split_process: updatedChallan.splitProcess,
        design_no: updatedChallan.designNo,
        pcs: updatedChallan.pcs,
        mtr: updatedChallan.mtr,
        final_meter: updatedChallan.finalMeter,
        width: updatedChallan.width,
        shrinkage: updatedChallan.shrinkage,
        pin: updatedChallan.pin,
        pick: updatedChallan.pick,
        percentage: updatedChallan.percentage,
        extra_work: updatedChallan.extraWork,
        status: updatedChallan.status,
        worker_name: updatedChallan.workerName,
        working_unit: updatedChallan.workingUnit,
        is_outsourcing: updatedChallan.isOutsourcing,
        dc_image: updatedChallan.dcImage,
        sample_image: updatedChallan.sampleImage
    }).eq('id', id);

    if (!error) {
        setDeliveryChallans(prev => prev.map(c => c.id === id ? updatedChallan : c));
    } else {
        alert("Error updating challan: " + error.message);
    }
  };

  const handleDeleteChallan = async (id: string) => {
    const { error } = await supabase.from('delivery_challans').delete().eq('id', id);
    if (!error) setDeliveryChallans(prev => prev.filter(c => c.id !== id));
    else alert("Error deleting challan: " + error.message);
  };

  const handleAddInvoice = async (newInvoice: Omit<Invoice, 'id'>) => {
      const { data, error } = await supabase.from('invoices').insert([{
          invoice_number: newInvoice.invoiceNumber,
          invoice_date: newInvoice.invoiceDate,
          client_name: newInvoice.clientName,
          sub_total: newInvoice.subTotal,
          total_cgst: newInvoice.totalCgst,
          total_sgst: newInvoice.totalSgst,
          total_tax_amount: newInvoice.totalTaxAmount,
          rounded_off: newInvoice.roundedOff,
          total_amount: newInvoice.totalAmount,
          tax_type: newInvoice.taxType
      }]).select();

      if (!error && data) {
          const invoiceId = data[0].id;
          const lineItems = newInvoice.items.map(item => ({
              invoice_id: invoiceId,
              challan_number: item.challanNumber,
              challan_date: item.challanDate,
              process: item.process,
              description: item.description,
              design_no: item.designNo,
              hsn_sac: item.hsnSac,
              pcs: item.pcs,
              mtr: item.mtr,
              rate: item.rate,
              subtotal: item.subtotal,
              cgst: item.cgst,
              sgst: item.sgst,
              amount: item.amount
          }));

          const { error: itemsError } = await supabase.from('invoice_items').insert(lineItems);
          if (itemsError) {
              alert("Error saving invoice items: " + itemsError.message);
              return;
          }

          // Increment numbering config if auto
          const configId = newInvoice.taxType === 'NGST' ? 'invoice_ngst' : 'invoice';
          const currentConfig = newInvoice.taxType === 'NGST' ? ngstInvoiceNumberConfig : invoiceNumberConfig;
          
          if (currentConfig.mode === 'auto') {
              const nextNum = currentConfig.nextNumber + 1;
              await supabase.from('numbering_configs').update({ next_number: nextNum }).eq('id', configId);
              if (newInvoice.taxType === 'NGST') {
                  setNgstInvoiceNumberConfig(prev => ({ ...prev, nextNumber: nextNum }));
              } else {
                  setInvoiceNumberConfig(prev => ({ ...prev, nextNumber: nextNum }));
              }
          }

          setInvoices(prev => [...prev, { ...newInvoice, id: invoiceId }]);
      } else if (error) {
          alert("Error saving invoice: " + error.message);
      }
  };

  const handleUpdateInvoice = async (id: string, updatedInvoice: Omit<Invoice, 'id'>) => {
      const { error } = await supabase.from('invoices').update({
          invoice_number: updatedInvoice.invoiceNumber,
          invoice_date: updatedInvoice.invoiceDate,
          client_name: updatedInvoice.clientName,
          sub_total: updatedInvoice.subTotal,
          total_cgst: updatedInvoice.totalCgst,
          total_sgst: updatedInvoice.totalSgst,
          total_tax_amount: updatedInvoice.totalTaxAmount,
          rounded_off: updatedInvoice.roundedOff,
          total_amount: updatedInvoice.totalAmount,
          tax_type: updatedInvoice.taxType
      }).eq('id', id);

      if (!error) {
          // Delete old items and insert new ones
          await supabase.from('invoice_items').delete().eq('invoice_id', id);
          
          const lineItems = updatedInvoice.items.map(item => ({
              invoice_id: id,
              challan_number: item.challanNumber,
              challan_date: item.challanDate,
              process: item.process,
              description: item.description,
              design_no: item.designNo,
              hsn_sac: item.hsnSac,
              pcs: item.pcs,
              mtr: item.mtr,
              rate: item.rate,
              subtotal: item.subtotal,
              cgst: item.cgst,
              sgst: item.sgst,
              amount: item.amount
          }));

          const { error: itemsError } = await supabase.from('invoice_items').insert(lineItems);
          if (itemsError) {
              alert("Error updating invoice items: " + itemsError.message);
          }

          setInvoices(prev => prev.map(inv => inv.id === id ? { ...updatedInvoice, id } : inv));
      } else {
          alert("Error updating invoice: " + error.message);
      }
  };

  const handleDeleteInvoice = async (id: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (!error) {
        setInvoices(prev => prev.filter(inv => inv.id !== id));
    } else {
        alert("Error deleting invoice: " + error.message);
    }
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
        case 'Dashboard':
            return <DashboardScreen invoices={invoices} paymentsReceived={paymentsReceived} deliveryChallans={deliveryChallans} purchaseOrders={purchaseOrders} otherExpenses={otherExpenses} advances={advances} />;
        case 'Expenses':
            return <PurchaseOrderScreen 
                purchaseOrders={purchaseOrders} onAddOrder={() => {}} onUpdateOrder={() => {}} onDeleteOrder={() => {}}
                purchaseShops={purchaseShops} onAddPurchaseShop={handleAddPurchaseShop} bankNames={bankNames} onAddBankName={(name) => setBankNames(p => [...p, name])}
                poNumberConfig={poNumberConfig} masterItems={masterItems} onAddMasterItem={handleAddMasterItem}
                advances={advances} employees={employees} onAddAdvance={handleAddAdvance} onUpdateAdvance={handleUpdateAdvance} onDeleteAdvance={handleDeleteAdvance}
                otherExpenses={otherExpenses} onAddOtherExpense={handleAddOtherExpense} onUpdateOtherExpense={handleUpdateOtherExpense} onDeleteOtherExpense={handleDeleteOtherExpense}
                expenseCategories={expenseCategories} onAddExpenseCategory={handleAddExpenseCategory}
                timberExpenses={timberExpenses} onAddTimberExpense={handleAddTimberExpense} onUpdateTimberExpense={handleUpdateTimberExpense} onDeleteTimberExpense={handleDeleteTimberExpense}
                supplierPayments={supplierPayments} supplierPaymentConfig={supplierPaymentConfig} onAddSupplierPayment={handleAddSupplierPayment}
            />;
        case 'Delivery Challans':
            return <DeliveryChallanScreen deliveryChallans={deliveryChallans} onAddChallan={handleAddChallan} onUpdateChallan={handleUpdateChallan} onDeleteChallan={handleDeleteChallan} clients={clients} onAddClient={handleAddClient} purchaseShops={purchaseShops} onAddPurchaseShop={handleAddPurchaseShop} processTypes={processTypes} onAddProcessType={handleAddProcessType} deliveryChallanNumberConfig={deliveryChallanNumberConfig} invoices={invoices} onDeleteInvoice={handleDeleteInvoice} companyDetails={companyDetails} employees={employees} onAddEmployee={handleAddEmployee} />;
        case 'Outsourcing':
            return <DeliveryChallanScreen isOutsourcingScreen deliveryChallans={deliveryChallans} onAddChallan={handleAddChallan} onUpdateChallan={handleUpdateChallan} onDeleteChallan={handleDeleteChallan} clients={clients} onAddClient={handleAddClient} purchaseShops={purchaseShops} onAddPurchaseShop={handleAddPurchaseShop} processTypes={processTypes} onAddProcessType={handleAddProcessType} deliveryChallanNumberConfig={outsourcingChallanNumberConfig} invoices={invoices} onDeleteInvoice={handleDeleteInvoice} companyDetails={companyDetails} employees={employees} onAddEmployee={handleAddEmployee} />;
        case 'Invoices':
            return <InvoicesScreen clients={clients} deliveryChallans={deliveryChallans} processTypes={processTypes} onAddInvoice={handleAddInvoice} onUpdateInvoice={handleUpdateInvoice} invoiceNumberConfig={invoiceNumberConfig} ngstInvoiceNumberConfig={ngstInvoiceNumberConfig} invoices={invoices} companyDetails={companyDetails} />;
        case 'Payment Received':
            return <PaymentReceivedScreen payments={paymentsReceived} onAddPayment={() => {}} onUpdatePayment={() => {}} onDeletePayment={() => {}} clients={clients} onAddClient={handleAddClient} />;
        case 'Attendance':
            return <AttendanceScreen employees={employees} attendanceRecords={attendanceRecords} onSave={async () => {}} />;
        case 'Salary & Payslips':
            return <SalaryScreen employees={employees} attendanceRecords={attendanceRecords} onUpdateEmployee={handleUpdateEmployee} advances={advances} onSavePayslip={async () => {}} onDeletePayslip={async () => {}} companyDetails={companyDetails} payslips={payslips} />;
        case 'Reports':
            return <ReportsScreen employees={employees} attendanceRecords={attendanceRecords} invoices={invoices} clients={clients} purchaseOrders={purchaseOrders} purchaseShops={purchaseShops} paymentsReceived={paymentsReceived} />;
        case 'User Admin':
            return <UserAdminScreen companyDetails={companyDetails} onUpdate={handleUpdateCompanyDetails} />;
        case 'Add Client':
            return <ShopMasterScreen clients={clients} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} processTypes={processTypes} onAddProcessType={handleAddProcessType} />;
        case 'Add Purchase Shop':
            return <PurchaseShopMasterScreen shops={purchaseShops} onAddShop={handleAddPurchaseShop} onUpdateShop={handleUpdatePurchaseShop} onDeleteShop={handleDeletePurchaseShop} />;
        case 'Add Employee':
            return <EmployeeMasterScreen employees={employees} onAddEmployee={handleAddEmployee} onUpdateEmployee={handleUpdateEmployee} onDeleteEmployee={handleDeleteEmployee} />;
        case 'Add Process':
            return <PartyDCProcessMasterScreen processTypes={processTypes} onAddProcessType={handleAddProcessType} onUpdateProcessType={handleUpdateProcessType} onDeleteProcessType={handleDeleteProcessType} />;
        case 'Expense Categories':
            return <ExpenseCategoryMasterScreen categories={expenseCategories} onAdd={handleAddExpenseCategory} onUpdate={handleUpdateExpenseCategory} onDelete={handleDeleteExpenseCategory} />;
        case 'Settings':
            return <SettingsScreen poConfig={poNumberConfig} onUpdatePoConfig={setPoNumberConfig} dcConfig={deliveryChallanNumberConfig} onUpdateDcConfig={setDeliveryChallanNumberConfig} outsourcingDcConfig={outsourcingChallanNumberConfig} onUpdateOutsourcingDcConfig={setOutsourcingChallanNumberConfig} invConfig={invoiceNumberConfig} ngstInvConfig={ngstInvoiceNumberConfig} onUpdateInvConfig={(type, cfg) => type === 'GST' ? setInvoiceNumberConfig(cfg) : setNgstInvoiceNumberConfig(cfg)} />;
        default:
            return <DashboardScreen invoices={invoices} paymentsReceived={paymentsReceived} deliveryChallans={deliveryChallans} purchaseOrders={purchaseOrders} otherExpenses={otherExpenses} advances={advances} />;
    }
  };

  if (!session && !guestMode) {
    return <Login onGuestMode={() => setGuestMode(true)} />;
  }

  if (!isInitialLoadComplete) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary-50">
            <div className="text-center">
                <SpinnerIcon className="w-10 h-10 text-primary-600 mx-auto mb-4" />
                <p className="text-secondary-600 font-medium">Loading your enterprise data...</p>
                {fetchError && <div className="mt-4 p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg max-w-md mx-auto flex items-center gap-3">
                    <WarningIcon className="w-6 h-6 flex-shrink-0" />
                    <p className="text-sm">{fetchError}</p>
                </div>}
            </div>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-secondary-50 overflow-hidden font-sans text-secondary-900">
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header isGuest={guestMode} />
        <main className="flex-1 overflow-y-auto p-8">
            {renderActiveScreen()}
        </main>
      </div>
    </div>
  );
};
