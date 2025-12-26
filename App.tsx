
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
import SalaryScreen from './components/SalaryScreen';
import AttendanceScreen from './components/AttendanceScreen';
import ReportsScreen from './components/ReportsScreen';
import UserAdminScreen from './components/UserAdminScreen';
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

const App: React.FC = () => {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setGuestMode(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const fetchTable = useCallback(async (table: string, setter: Function, transformer?: Function, retryCount = 0): Promise<boolean> => {
      try {
          let query: any = supabase.from(table).select('*');
          if (table === 'purchase_orders') query = supabase.from('purchase_orders').select('*, purchase_order_items(*)');
          else if (table === 'invoices') query = supabase.from('invoices').select('*, invoice_items(*)');
          else if (table === 'company_details') query = supabase.from('company_details').select('*').single();

          const { data, error } = await query;
          if (error) {
              if (table === 'company_details' && error.code === 'PGRST116') return true;
              throw error;
          }
          if (data) setter(transformer ? transformer(data) : data);
          return true;
      } catch (error: any) {
          if (retryCount < MAX_RETRIES) {
              await delay(INITIAL_RETRY_DELAY * Math.pow(2, retryCount));
              return fetchTable(table, setter, transformer, retryCount + 1);
          }
          console.error(`Error fetching ${table}:`, error.message);
          setFetchError(`Database connection error. Please try again.`);
          return false;
      }
  }, []);

  const loadAllData = useCallback(async () => {
    setFetchError(null);
    setIsInitialLoadComplete(false);
    
    await Promise.all([
        fetchTable('company_details', (data: any) => data && setCompanyDetails({
            name: data.name || '', addressLine1: data.address_line_1 || '', addressLine2: data.address_line_2 || '',
            phone: data.phone || '', email: data.email || '', gstin: data.gstin || '', hsnSac: data.hsn_sac || '998821',
            bankName: data.bank_name || '', bankAccountNumber: data.bank_account_number || '', bankIfscCode: data.bank_ifsc_code || '',
            logoUrl: data.logo_url || '', reportNotificationEmail: data.report_notification_email || '',
        })),
        fetchTable('numbering_configs', (data: any[]) => data.forEach(config => {
            if (config.id === 'po') setPoNumberConfig({ prefix: config.prefix, nextNumber: config.next_number });
            if (config.id === 'dc') setDeliveryChallanNumberConfig({ prefix: config.prefix, nextNumber: config.next_number });
            if (config.id === 'dc_outsourcing') setOutsourcingChallanNumberConfig({ prefix: config.prefix, nextNumber: config.next_number });
            if (config.id === 'invoice') setInvoiceNumberConfig({ mode: config.mode, prefix: config.prefix, nextNumber: config.next_number });
            if (config.id === 'invoice_ngst') setNgstInvoiceNumberConfig({ mode: config.mode, prefix: config.prefix, nextNumber: config.next_number });
            if (config.id === 'supplier_payment') setSupplierPaymentConfig({ prefix: config.prefix, nextNumber: config.next_number });
        })),
        fetchTable('clients', setClients, (data: any[]) => data.map(d => ({ ...d, gstNo: d.gst_no, panNo: d.pan_no, openingBalance: d.opening_balance || 0 }))),
        fetchTable('purchase_shops', setPurchaseShops, (data: any[]) => data.map(d => ({ ...d, gstNo: d.gst_no, panNo: d.pan_no, openingBalance: d.opening_balance || 0 }))),
        fetchTable('employees', setEmployees, (data: any[]) => data.map(d => ({ ...d, dailyWage: d.daily_wage || 0, monthlyWage: d.monthly_wage || 0, ratePerMeter: d.rate_per_meter || 0 }))),
        fetchTable('process_types', setProcessTypes),
        fetchTable('master_items', setMasterItems),
        fetchTable('expense_categories', setExpenseCategories),
        fetchTable('delivery_challans', setDeliveryChallans, (data: any[]) => data.map(d => ({
            ...d, challanNumber: d.challan_number, partyName: d.party_name, partyDCNo: d.party_dc_no,
            process: d.process ? (typeof d.process === 'string' ? JSON.parse(d.process) : d.process) : [], splitProcess: d.split_process || [],
            finalMeter: d.final_meter || 0, extraWork: d.extra_work, workerName: d.worker_name,
            workingUnit: d.working_unit, isOutsourcing: d.is_outsourcing, dcImage: d.dc_image || [], sampleImage: d.sample_image || []
        }))),
        fetchTable('invoices', setInvoices, (data: any[]) => data.map(d => ({
            ...d, invoiceNumber: d.invoice_number, invoiceDate: d.invoice_date, clientName: d.client_name,
            subTotal: d.sub_total || 0, totalCgst: d.total_cgst || 0, totalSgst: d.total_sgst || 0,
            totalTaxAmount: d.total_tax_amount || 0, roundedOff: d.rounded_off || 0, totalAmount: d.total_amount || 0,
            items: d.invoice_items?.map((i: any) => ({ ...i, challanNumber: i.challan_number, challanDate: i.challan_date, designNo: i.design_no, hsnSac: i.hsn_sac })) || []
        }))),
        fetchTable('attendance', setAttendanceRecords, (data: any[]) => data.map(d => ({
            id: d.id, employee_id: d.employee_id, date: d.date, morningStatus: d.morning_status, eveningStatus: d.evening_status,
            morningOvertimeHours: d.morning_overtime_hours, eveningOvertimeHours: d.evening_overtime_hours,
            metersProduced: d.meters_produced, createdAt: d.created_at, updatedAt: d.updated_at
        }))),
        fetchTable('timber_expenses', setTimberExpenses, (data: any[]) => data.map(d => ({
            ...d, supplierName: d.supplier_name, openingBalance: d.opening_balance || 0, loadWeight: d.load_weight, vehicleWeight: d.vehicle_weight,
            paymentMode: d.payment_mode, paymentStatus: d.payment_status, bankName: d.bank_name, chequeDate: d.cheque_date
        }))),
        fetchTable('supplier_payments', setSupplierPayments, (data: any[]) => data.map(d => ({
            ...d, paymentNumber: d.payment_number, supplierName: d.supplier_name, paymentMode: d.payment_mode, referenceId: d.reference_id
        }))),
        fetchTable('employee_advances', setAdvances, (data: any[]) => data.map(d => ({ ...d, employeeId: d.employee_id, paidAmount: d.paid_amount || 0 }))),
        fetchTable('other_expenses', setOtherExpenses, (data: any[]) => data.map(d => ({ ...d, itemName: d.item_name, paymentMode: d.payment_mode, paymentStatus: d.payment_status }))),
        fetchTable('payslips', setPayslips, (data: any[]) => data.map(d => ({ ...d, employeeId: d.employee_id, employeeName: d.employee_name, payslipDate: d.payslip_date, payPeriodStart: d.pay_period_start, payPeriodEnd: d.pay_period_end, netSalary: d.net_salary, totalWorkingDays: d.total_working_days })))
    ]);
    setIsInitialLoadComplete(true);
  }, [fetchTable]);

  useEffect(() => { if (session || guestMode) loadAllData(); }, [session, guestMode, loadAllData]);

  const handleSaveAttendance = async (records: Omit<AttendanceRecord, 'id'>[]) => {
      const { error } = await supabase.from('attendance').upsert(records.map(r => ({
          employee_id: r.employee_id, date: r.date, morning_status: r.morningStatus, evening_status: r.eveningStatus,
          morning_overtime_hours: r.morningOvertimeHours, evening_overtime_hours: r.eveningOvertimeHours,
          meters_produced: r.metersProduced, updated_at: new Date().toISOString()
      })), { onConflict: 'employee_id,date' });
      
      if (error) throw error;
      
      await fetchTable('attendance', setAttendanceRecords, (data: any[]) => data.map(d => ({
          id: d.id, employee_id: d.employee_id, date: d.date, morningStatus: d.morning_status, eveningStatus: d.evening_status,
          morningOvertimeHours: d.morning_overtime_hours, eveningOvertimeHours: d.evening_overtime_hours,
          metersProduced: d.meters_produced, createdAt: d.created_at, updatedAt: d.updated_at
      })));
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
        case 'Dashboard': 
            return <DashboardScreen invoices={invoices} paymentsReceived={paymentsReceived} deliveryChallans={deliveryChallans} purchaseOrders={purchaseOrders} otherExpenses={otherExpenses} advances={advances} />;
        case 'Attendance': 
            return <AttendanceScreen employees={employees} attendanceRecords={attendanceRecords} onSave={handleSaveAttendance} />;
        case 'Reports': 
            return <ReportsScreen employees={employees} attendanceRecords={attendanceRecords} invoices={invoices} clients={clients} purchaseOrders={purchaseOrders} purchaseShops={purchaseShops} paymentsReceived={paymentsReceived} timberExpenses={timberExpenses} supplierPayments={supplierPayments} otherExpenses={otherExpenses} expenseCategories={expenseCategories} deliveryChallans={deliveryChallans} />;
        case 'Delivery Challans': 
            return <DeliveryChallanScreen deliveryChallans={deliveryChallans} onAddChallan={async (c) => { await supabase.from('delivery_challans').insert([c]); loadAllData(); }} onUpdateChallan={async (id, c) => { await supabase.from('delivery_challans').update(c).eq('id', id); loadAllData(); }} onDeleteChallan={async (id) => { await supabase.from('delivery_challans').delete().eq('id', id); loadAllData(); }} clients={clients} onAddClient={()=>{}} purchaseShops={purchaseShops} onAddPurchaseShop={()=>{}} processTypes={processTypes} onAddProcessType={()=>{}} deliveryChallanNumberConfig={deliveryChallanNumberConfig} invoices={invoices} onDeleteInvoice={()=>{}} companyDetails={companyDetails} employees={employees} onAddEmployee={()=>{}} />;
        case 'Invoices': 
            return <InvoicesScreen clients={clients} deliveryChallans={deliveryChallans} processTypes={processTypes} onAddInvoice={async (i) => { const { data } = await supabase.from('invoices').insert([i]).select(); if (data) await supabase.from('invoice_items').insert(i.items.map(it => ({ ...it, invoice_id: data[0].id }))); loadAllData(); }} onUpdateInvoice={async (id, i) => { await supabase.from('invoices').update(i).eq('id', id); loadAllData(); }} invoiceNumberConfig={invoiceNumberConfig} ngstInvoiceNumberConfig={ngstInvoiceNumberConfig} invoices={invoices} companyDetails={companyDetails} />;
        case 'Expenses':
            return <PurchaseOrderScreen 
                purchaseOrders={purchaseOrders} onAddOrder={() => {}} onUpdateOrder={() => {}} onDeleteOrder={() => {}}
                purchaseShops={purchaseShops} onAddPurchaseShop={() => {}} bankNames={bankNames} onAddBankName={(name) => setBankNames(p => [...p, name])}
                poNumberConfig={poNumberConfig} masterItems={masterItems} onAddMasterItem={async () => null}
                advances={advances} employees={employees} onAddAdvance={async () => {}} onUpdateAdvance={async () => {}} onDeleteAdvance={() => {}}
                otherExpenses={otherExpenses} onAddOtherExpense={async () => {}} onUpdateOtherExpense={async () => {}} onDeleteOtherExpense={() => {}}
                expenseCategories={expenseCategories} onAddExpenseCategory={async () => null}
                timberExpenses={timberExpenses} onAddTimberExpense={async () => {}} onUpdateTimberExpense={async () => {}} onDeleteTimberExpense={() => {}}
                supplierPayments={supplierPayments} supplierPaymentConfig={supplierPaymentConfig} onAddSupplierPayment={async () => {}}
            />;
        case 'User Admin': 
            return <UserAdminScreen companyDetails={companyDetails} onUpdate={async (d) => { await supabase.from('company_details').upsert({ id: 1, ...d }); setCompanyDetails(d); }} />;
        case 'Add Client': 
            return <ShopMasterScreen clients={clients} onAddClient={async (c) => { await supabase.from('clients').insert([c]); loadAllData(); }} onUpdateClient={async (c) => { await supabase.from('clients').update(c).eq('id', c.id); loadAllData(); }} onDeleteClient={async (id) => { await supabase.from('clients').delete().eq('id', id); loadAllData(); }} processTypes={processTypes} onAddProcessType={()=>{}} />;
        case 'Add Employee': 
            return <EmployeeMasterScreen employees={employees} onAddEmployee={async (e) => { await supabase.from('employees').insert([e]); loadAllData(); }} onUpdateEmployee={async (id, e) => { await supabase.from('employees').update(e).eq('id', id); loadAllData(); }} onDeleteEmployee={async (id) => { await supabase.from('employees').delete().eq('id', id); loadAllData(); }} />;
        case 'Salary & Payslips':
            return <SalaryScreen employees={employees} attendanceRecords={attendanceRecords} onUpdateEmployee={async (id, e) => { await supabase.from('employees').update(e).eq('id', id); loadAllData(); }} advances={advances} onSavePayslip={async () => {}} onDeletePayslip={async () => {}} companyDetails={companyDetails} payslips={payslips} />;
        case 'Add Process':
            return <PartyDCProcessMasterScreen processTypes={processTypes} onAddProcessType={async () => {}} onUpdateProcessType={async () => {}} onDeleteProcessType={async () => {}} />;
        case 'Expense Categories':
            return <ExpenseCategoryMasterScreen categories={expenseCategories} onAdd={async () => null} onUpdate={async () => {}} onDelete={async () => {}} />;
        case 'Settings':
            return <SettingsScreen poConfig={poNumberConfig} onUpdatePoConfig={()=>{}} dcConfig={deliveryChallanNumberConfig} onUpdateDcConfig={()=>{}} outsourcingDcConfig={outsourcingChallanNumberConfig} onUpdateOutsourcingDcConfig={()=>{}} invConfig={invoiceNumberConfig} ngstInvConfig={ngstInvoiceNumberConfig} onUpdateInvConfig={()=>{}} />;
        default: return <DashboardScreen invoices={invoices} paymentsReceived={paymentsReceived} deliveryChallans={deliveryChallans} purchaseOrders={purchaseOrders} otherExpenses={otherExpenses} advances={advances} />;
    }
  };

  if (!session && !guestMode) return <Login onGuestMode={() => setGuestMode(true)} />;
  if (!isInitialLoadComplete) return <div className="min-h-screen flex items-center justify-center bg-secondary-50"><SpinnerIcon className="w-10 h-10 text-primary-600" /></div>;

  return (
    <div className="flex h-screen bg-secondary-50 overflow-hidden font-sans text-secondary-900">
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header isGuest={guestMode} />
        <main className="flex-1 overflow-y-auto p-8">{renderActiveScreen()}</main>
      </div>
    </div>
  );
};

export default App;
