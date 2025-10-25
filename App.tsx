

import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProductsScreen from './components/NewItemForm';
import ShopMasterScreen from './components/ShopMasterScreen';
import PurchaseShopMasterScreen from './components/PurchaseShopMasterScreen';
import SettingsScreen from './components/SettingsScreen';
import ProcessTypeMasterScreen from './components/PartyDCProcessMasterScreen';
import EmployeeMasterScreen from './components/EmployeeMasterScreen';
import DeliveryChallanScreen from './components/DeliveryChallanScreen';
import InvoicesScreen from './components/InvoicesScreen';
import UserAdminScreen from './components/UserAdminScreen';
import NewClientScreen from './components/NewClientScreen';
import NewPartyScreen from './components/NewPartyScreen';
import PaymentReceivedScreen from './components/PaymentReceivedScreen';
import AttendanceScreen from './components/AttendanceScreen';
import SalaryScreen from './components/SalaryScreen';
import PurchaseOrderScreen from './components/PurchaseOrderScreen';
import { supabase } from './supabaseClient';


// Define types for the new structure
export interface LineItem {
  id: string; // For React keys
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type PaymentMode = 'Cash' | 'Cheque' | 'NEFT' | 'GPay' | 'Credit Card' | 'Bank Transfer' | 'Other';
export type OrderStatus = 'Paid' | 'Unpaid';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  poDate: string;
  shopName: string;
  items: LineItem[];
  totalAmount: number;
  gstNo: string;
  paymentMode: PaymentMode;
  status: OrderStatus;
  bankName?: string;
  chequeDate?: string;
  paymentTerms?: string;
}

export interface ClientProcess {
  processName: string;
  rate: number;
}


export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNo: string;
  panNo?: string;
  paymentTerms?: string;
  processes: ClientProcess[];
}

export interface PurchaseShop {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNo: string;
  panNo?: string;
  paymentTerms?: string;
}

export interface PONumberConfig {
    prefix: string;
    nextNumber: number;
}

export interface ProcessType {
  id: string;
  name: string;
  rate?: number;
}

export interface Employee {
  id: string;
  name: string;
  designation: string;
  phone: string;
  dailyWage: number;
  ratePerMeter: number;
}

export interface DeliveryChallan {
  id: string;
  challanNumber: string;
  date: string;
  partyName: string;
  partyDCNo: string;
  process: string[];
  designNo: string;
  pcs: number;
  mtr: number;
  width: number;
  shrinkage: string;
  pin: string;
  pick: string;
  extraWork: string;
  status: string;
  workerName: string;
  dcImage?: string[] | null;
  sampleImage?: string[] | null;
}

export interface DeliveryChallanNumberConfig {
    prefix: string;
    nextNumber: number;
}

export interface MasterItem {
    id: string;
    name: string;
    rate: number;
}

// Invoice specific types
export interface InvoiceItem {
  id: string; // Corresponds to DeliveryChallan id
  challanNumber: string;
  challanDate: string;
  process: string;
  description?: string;
  designNo: string;
  hsnSac: string;
  pcs: number;
  mtr: number; // This corresponds to QTY in the bill
  rate: number; // This corresponds to UNIT PRICE
  amount: number; // This is subtotal + taxes
  subtotal: number;
  cgst: number;
  sgst: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  items: InvoiceItem[];
  subTotal: number;
  totalCgst: number;
  totalSgst: number;
  totalTaxAmount: number;
  roundedOff: number;
  totalAmount: number; // This is the final, rounded amount
}


export interface InvoiceNumberConfig {
    mode: 'auto' | 'manual';
    prefix: string;
    nextNumber: number;
}

export interface CompanyDetails {
  name: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  gstin: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
}

export interface PaymentReceived {
  id: string;
  clientName: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  notes?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Holiday';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  date: string; // YYYY-MM-DD
  morningStatus: AttendanceStatus;
  eveningStatus: AttendanceStatus;
  morningOvertimeHours: number;
  eveningOvertimeHours: number;
  metersProduced?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeAdvance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  paidAmount: number;
  notes?: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  employeeName: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payslipDate: string;
  totalWorkingDays: number;
  otHours: number;
  wageEarnings: number;
  productionEarnings: number;
  grossSalary: number;
  advanceDeduction: number;
  netSalary: number;
  totalOutstandingAdvance: number;
}

export interface OtherExpense {
  id: string;
  date: string;
  itemName: string;
  amount: number;
  notes?: string;
  paymentMode?: PaymentMode;
  paymentStatus?: OrderStatus;
  bankName?: string;
  chequeDate?: string;
  paymentTerms?: string;
}

export interface ExpenseCategory {
    id: string;
    name: string;
}


const ScreenPlaceholder: React.FC<{title: string; description: string}> = ({title, description}) => (
    <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-600 mt-2">{description}</p>
    </div>
);

// Helper to map DB snake_case to app camelCase for Client
const mapClientFromDb = (dbData: any): Omit<Client, 'processes'> => ({
  id: dbData.id,
  name: dbData.name,
  phone: dbData.phone || '',
  email: dbData.email || '',
  address: dbData.address || '',
  city: dbData.city || '',
  state: dbData.state || '',
  pincode: dbData.pincode || '',
  gstNo: dbData.gst_no || '',
  panNo: dbData.pan_no || '',
  paymentTerms: dbData.payment_terms || '',
});

// Helper to map app camelCase to DB snake_case for Client
const mapClientToDb = (appData: any) => ({
  name: appData.name,
  phone: appData.phone,
  email: appData.email,
  address: appData.address,
  city: appData.city,
  state: appData.state,
  pincode: appData.pincode,
  gst_no: appData.gstNo,
  pan_no: appData.panNo,
  payment_terms: appData.paymentTerms,
  processes: appData.processes,
});

const mapPurchaseShopToDb = (appData: any) => ({
  name: appData.name,
  phone: appData.phone,
  email: appData.email,
  address: appData.address,
  city: appData.city,
  state: appData.state,
  pincode: appData.pincode,
  gst_no: appData.gstNo,
  pan_no: appData.panNo,
  payment_terms: appData.paymentTerms,
});

const mapPurchaseShopFromDb = (dbData: any): Omit<PurchaseShop, 'contactPerson'> => ({
  id: dbData.id,
  name: dbData.name,
  phone: dbData.phone || '',
  email: dbData.email || '',
  address: dbData.address || '',
  city: dbData.city || '',
  state: dbData.state || '',
  pincode: dbData.pincode || '',
  gstNo: dbData.gst_no || '',
  panNo: dbData.pan_no || '',
  paymentTerms: dbData.payment_terms || '',
});

const mapEmployeeFromDb = (dbData: any): Employee => ({
  id: dbData.id,
  name: dbData.name,
  designation: dbData.designation || '',
  phone: dbData.phone || '',
  dailyWage: dbData.daily_wage || 0,
  ratePerMeter: dbData.rate_per_meter || 0,
});

const mapEmployeeToDb = (appData: Partial<Employee>) => ({
  name: appData.name,
  designation: appData.designation,
  phone: appData.phone,
  daily_wage: appData.dailyWage,
  rate_per_meter: appData.ratePerMeter,
});

const mapDeliveryChallanFromDb = (dbData: any): DeliveryChallan => {
    const statusFromDb = dbData.status || 'Delivered';
    
    let dcImage: string[] | null = null;
    if (dbData.dc_image) {
        try {
            const parsed = JSON.parse(dbData.dc_image);
            if (Array.isArray(parsed)) {
                dcImage = parsed;
            } else {
                dcImage = [String(parsed)];
            }
        } catch (e) {
            dcImage = [dbData.dc_image];
        }
    }

    let sampleImage: string[] | null = null;
    if (dbData.sample_image) {
        try {
            const parsed = JSON.parse(dbData.sample_image);
            if (Array.isArray(parsed)) {
                sampleImage = parsed;
            } else {
                sampleImage = [String(parsed)];
            }
        } catch (e) {
            sampleImage = [dbData.sample_image];
        }
    }

    return {
        id: dbData.id,
        challanNumber: dbData.challan_number,
        date: dbData.date,
        partyName: dbData.party_name,
        partyDCNo: dbData.party_dc_no,
        process: typeof dbData.process === 'string' ? dbData.process.split(',').map((p: string) => p.trim()).filter(Boolean) : [],
        designNo: dbData.design_no,
        pcs: dbData.pcs,
        mtr: dbData.mtr,
        width: dbData.width,
        shrinkage: dbData.shrinkage || '',
        pin: dbData.pin || '',
        pick: dbData.pick || '',
        extraWork: dbData.extra_work || '',
        status: statusFromDb === 'Delivered' ? 'Ready to Invoice' : statusFromDb,
        workerName: dbData.worker_name || '',
        dcImage: dcImage,
        sampleImage: sampleImage,
    };
};

const mapDeliveryChallanToDb = (appData: any) => {
    return {
        challan_number: appData.challanNumber,
        date: appData.date,
        party_name: appData.partyName,
        party_dc_no: appData.partyDCNo,
        process: Array.isArray(appData.process) ? appData.process.join(', ') : appData.process,
        design_no: appData.designNo,
        pcs: appData.pcs,
        mtr: appData.mtr,
        width: appData.width,
        shrinkage: appData.shrinkage,
        pin: appData.pin,
        pick: appData.pick,
        extra_work: appData.extraWork,
        status: appData.status === 'Ready to Invoice' ? 'Delivered' : appData.status,
        worker_name: appData.workerName,
        dc_image: appData.dcImage && appData.dcImage.length > 0 ? JSON.stringify(appData.dcImage) : null,
        sample_image: appData.sampleImage && appData.sampleImage.length > 0 ? JSON.stringify(appData.sampleImage) : null,
    };
};

const mapPaymentReceivedFromDb = (dbData: any): PaymentReceived => ({
  id: dbData.id,
  clientName: dbData.client_name,
  paymentDate: dbData.payment_date,
  amount: dbData.amount,
  paymentMode: dbData.payment_mode,
  referenceNumber: dbData.reference_number || '',
  notes: dbData.notes || '',
});

const mapPaymentReceivedToDb = (appData: Omit<PaymentReceived, 'id'>) => ({
  client_name: appData.clientName,
  payment_date: appData.paymentDate,
  amount: appData.amount,
  payment_mode: appData.paymentMode,
  reference_number: appData.referenceNumber,
  notes: appData.notes,
});

const mapAttendanceFromDb = (dbData: any): AttendanceRecord => ({
  id: dbData.id,
  employee_id: dbData.employee_id,
  date: dbData.date,
  morningStatus: dbData.morning_status || 'Present',
  eveningStatus: dbData.evening_status || 'Present',
  morningOvertimeHours: dbData.morning_overtime_hours || 0,
  eveningOvertimeHours: dbData.evening_overtime_hours || 0,
  metersProduced: dbData.meters_produced || 0,
  createdAt: dbData.created_at,
  updatedAt: dbData.updated_at,
});

const mapAttendanceToDb = (appData: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => ({
  employee_id: appData.employee_id,
  date: appData.date,
  morning_status: appData.morningStatus,
  evening_status: appData.eveningStatus,
  morning_overtime_hours: appData.morningOvertimeHours,
  evening_overtime_hours: appData.eveningOvertimeHours,
  meters_produced: appData.metersProduced,
});

const mapAdvanceFromDb = (dbData: any): EmployeeAdvance => ({
    id: dbData.id,
    employeeId: dbData.employee_id,
    date: dbData.date,
    amount: dbData.amount,
    paidAmount: dbData.paid_amount || 0,
    notes: dbData.notes || '',
});

const mapAdvanceToDb = (appData: Omit<EmployeeAdvance, 'id'>) => ({
    employee_id: appData.employeeId,
    date: appData.date,
    amount: appData.amount,
    paid_amount: appData.paidAmount,
    notes: appData.notes,
});

const mapPayslipFromDb = (dbData: any): Payslip => ({
  id: dbData.id,
  employeeId: dbData.employee_id,
  employeeName: dbData.employee_name,
  payPeriodStart: dbData.pay_period_start,
  payPeriodEnd: dbData.pay_period_end,
  payslipDate: dbData.payslip_date,
  totalWorkingDays: dbData.total_working_days,
  otHours: dbData.ot_hours,
  wageEarnings: dbData.wage_earnings,
  productionEarnings: dbData.production_earnings,
  grossSalary: dbData.gross_salary,
  advanceDeduction: dbData.advance_deduction,
  netSalary: dbData.net_salary,
  totalOutstandingAdvance: dbData.total_outstanding_advance,
});

const mapPayslipToDb = (appData: Omit<Payslip, 'id'>) => ({
    employee_id: appData.employeeId,
    employee_name: appData.employeeName,
    pay_period_start: appData.payPeriodStart,
    pay_period_end: appData.payPeriodEnd,
    payslip_date: appData.payslipDate,
    total_working_days: appData.totalWorkingDays,
    ot_hours: appData.otHours,
    wage_earnings: appData.wageEarnings,
    production_earnings: appData.productionEarnings,
    gross_salary: appData.grossSalary,
    advance_deduction: appData.advanceDeduction,
    net_salary: appData.netSalary,
    total_outstanding_advance: appData.totalOutstandingAdvance,
});

const mapOtherExpenseFromDb = (dbData: any): OtherExpense => ({
  id: dbData.id,
  date: dbData.date,
  itemName: dbData.item_name,
  amount: dbData.amount,
  notes: dbData.notes || '',
  paymentMode: dbData.payment_mode || 'Cash',
  paymentStatus: dbData.payment_status || 'Paid',
  bankName: dbData.bank_name || '',
  chequeDate: dbData.cheque_date || '',
  paymentTerms: dbData.payment_terms || '',
});

const mapOtherExpenseToDb = (appData: Omit<OtherExpense, 'id'>) => ({
  date: appData.date,
  item_name: appData.itemName,
  amount: appData.amount,
  notes: appData.notes,
  payment_mode: appData.paymentMode,
  payment_status: appData.paymentStatus,
  bank_name: appData.bankName,
  cheque_date: appData.chequeDate,
  payment_terms: appData.paymentTerms,
});

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState('Dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Master Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [purchaseShops, setPurchaseShops] = useState<PurchaseShop[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [bankNames, setBankNames] = useState<string[]>(['HDFC', 'ICICI', 'SBI', 'Axis Bank']);
  
  // Transactional Data State
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentsReceived, setPaymentsReceived] = useState<PaymentReceived[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [advances, setAdvances] = useState<EmployeeAdvance[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);


  // Config State
  const [poNumberConfig, setPoNumberConfig] = useState<PONumberConfig>({ prefix: 'PO/SKTP/24-25', nextNumber: 1 });
  const [dcNumberConfig, setDcNumberConfig] = useState<DeliveryChallanNumberConfig>({ prefix: 'DC', nextNumber: 1 });
  const [invoiceNumberConfig, setInvoiceNumberConfig] = useState<InvoiceNumberConfig>({ mode: 'auto', prefix: 'INV-', nextNumber: 1 });
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({ name: '', addressLine1: '', addressLine2: '', phone: '', email: '', gstin: '', bankName: '', bankAccountNumber: '', bankIfscCode: '' });

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [
          clientsRes, purchaseShopsRes, employeesRes, processTypesRes, masterItemsRes, 
          dcRes, poRes, invRes, paymentsRes, companyDetailsRes, configsRes, attendanceRes, advancesRes, payslipsRes,
          otherExpensesRes, expenseCategoriesRes
      ] = await Promise.all([
          supabase.from('clients').select('*'),
          supabase.from('purchase_shops').select('*'),
          supabase.from('employees').select('*'),
          supabase.from('process_types').select('*'),
          supabase.from('master_items').select('*'),
          supabase.from('delivery_challans').select('*'),
          supabase.from('purchase_orders').select('*, items:purchase_order_items(*)'),
          supabase.from('invoices').select('*, items:invoice_items(*)'),
          supabase.from('payments_received').select('*'),
          supabase.from('company_details').select('*').limit(1).single(),
          supabase.from('numbering_configs').select('*'),
          supabase.from('attendance').select('*'),
          supabase.from('employee_advances').select('*'),
          supabase.from('payslips').select('*'),
          supabase.from('other_expenses').select('*'),
          supabase.from('expense_categories').select('*'),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (purchaseShopsRes.error) throw purchaseShopsRes.error;
      if (employeesRes.error) throw employeesRes.error;
      if (processTypesRes.error) throw processTypesRes.error;
      if (masterItemsRes.error) throw masterItemsRes.error;
      if (dcRes.error) throw dcRes.error;
      if (poRes.error) throw poRes.error;
      if (invRes.error) throw invRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      // Company details can be null if not set, not an error
      if (companyDetailsRes.error && companyDetailsRes.error.code !== 'PGRST116') throw companyDetailsRes.error;
      if (configsRes.error) throw configsRes.error;
      if (attendanceRes.error) throw attendanceRes.error;
      if (advancesRes.error) throw advancesRes.error;
      if (payslipsRes.error) throw payslipsRes.error;
      if (otherExpensesRes.error && otherExpensesRes.error.code !== 'PGRST205') throw otherExpensesRes.error;
      if (expenseCategoriesRes.error && expenseCategoriesRes.error.code !== 'PGRST205') throw expenseCategoriesRes.error;

      setClients(clientsRes.data.map(dbClient => {
          const client = mapClientFromDb(dbClient);
          const processes = dbClient.processes || [];
          return { ...client, processes };
      }));
      setPurchaseShops(purchaseShopsRes.data.map(mapPurchaseShopFromDb));
      setEmployees(employeesRes.data.map(mapEmployeeFromDb));
      setProcessTypes(processTypesRes.data);
      setMasterItems(masterItemsRes.data);
      setDeliveryChallans(dcRes.data.map(mapDeliveryChallanFromDb));
      setPurchaseOrders(poRes.data.map((po: any) => ({
        id: po.id,
        poNumber: po.po_number,
        poDate: po.po_date,
        shopName: po.shop_name,
        totalAmount: po.total_amount,
        gstNo: po.gst_no,
        paymentMode: po.payment_mode,
        status: po.status,
        bankName: po.bank_name,
        chequeDate: po.cheque_date,
        paymentTerms: po.payment_terms,
        items: po.items || []
      })));
      setInvoices(invRes.data.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        invoiceDate: inv.invoice_date,
        clientName: inv.client_name,
        subTotal: inv.sub_total,
        totalCgst: inv.total_cgst,
        totalSgst: inv.total_sgst,
        totalTaxAmount: inv.total_tax_amount,
        roundedOff: inv.rounded_off,
        totalAmount: inv.total_amount,
        items: inv.items.map((item: any) => ({...item, challanNumber: item.challan_number, challanDate: item.challan_date, designNo: item.design_no, hsnSac: item.hsn_sac}))
      })));
      setPaymentsReceived(paymentsRes.data.map(mapPaymentReceivedFromDb));
      if (companyDetailsRes.data) {
        setCompanyDetails({
            name: companyDetailsRes.data.name || '',
            addressLine1: companyDetailsRes.data.address_line_1 || '',
            addressLine2: companyDetailsRes.data.address_line_2 || '',
            phone: companyDetailsRes.data.phone || '',
            email: companyDetailsRes.data.email || '',
            gstin: companyDetailsRes.data.gstin || '',
            bankName: companyDetailsRes.data.bank_name || '',
            bankAccountNumber: companyDetailsRes.data.bank_account_number || '',
            bankIfscCode: companyDetailsRes.data.bank_ifsc_code || '',
        });
      }
      if (configsRes.data) {
          const poConfig = configsRes.data.find(c => c.id === 'po');
          if (poConfig) setPoNumberConfig({ prefix: poConfig.prefix, nextNumber: poConfig.next_number });

          const dcConfig = configsRes.data.find(c => c.id === 'delivery_challan');
          if (dcConfig) setDcNumberConfig({ prefix: dcConfig.prefix, nextNumber: dcConfig.next_number });
          
          const invConfig = configsRes.data.find(c => c.id === 'invoice');
          if (invConfig) setInvoiceNumberConfig({ mode: invConfig.mode || 'auto', prefix: invConfig.prefix, nextNumber: invConfig.next_number });
      }
      setAttendanceRecords(attendanceRes.data.map(mapAttendanceFromDb));
      setAdvances(advancesRes.data.map(mapAdvanceFromDb));
      setPayslips(payslipsRes.data.map(mapPayslipFromDb));
      
      if (otherExpensesRes.data) {
          setOtherExpenses(otherExpensesRes.data.map(mapOtherExpenseFromDb));
      }
      if (expenseCategoriesRes.data) {
          setExpenseCategories(expenseCategoriesRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      setError('Failed to fetch initial data. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);
  
  // --- MASTER DATA HANDLERS ---
  const handleAddClient = async (newClient: Omit<Client, 'id'>) => {
    const { data: clientInsertData, error: clientError } = await supabase
      .from('clients')
      .insert(mapClientToDb(newClient))
      .select()
      .single();
    if (clientError) throw clientError;

    const mappedClient = mapClientFromDb(clientInsertData);
    const finalClient = { ...mappedClient, processes: clientInsertData.processes || [] };
    setClients(prev => [...prev, finalClient]);
  };
  
  const handleUpdateClient = async (updatedClient: Client) => {
    const { data, error } = await supabase
      .from('clients')
      .update(mapClientToDb(updatedClient))
      .eq('id', updatedClient.id)
      .select()
      .single();
    if (error) throw error;
    
    const mappedClient = mapClientFromDb(data);
    const finalClient = { ...mappedClient, processes: data.processes || [] };
    setClients(prev => prev.map(c => c.id === finalClient.id ? finalClient : c));
  };
  
   const handleAddPurchaseShop = async (newShop: Omit<PurchaseShop, 'id'>) => {
    const { data, error } = await supabase
      .from('purchase_shops')
      .insert(mapPurchaseShopToDb(newShop))
      .select()
      .single();
    if (error) throw error;
    const mappedShop = mapPurchaseShopFromDb(data);
    setPurchaseShops(prev => [...prev, mappedShop]);
  };
  
  const handleUpdatePurchaseShop = async (updatedShop: PurchaseShop) => {
    const { data, error } = await supabase
      .from('purchase_shops')
      .update(mapPurchaseShopToDb(updatedShop))
      .eq('id', updatedShop.id)
      .select()
      .single();
    if (error) throw error;
    
    const mappedShop = mapPurchaseShopFromDb(data);
    setPurchaseShops(prev => prev.map(s => s.id === mappedShop.id ? mappedShop : s));
  };

  const handleAddEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    const { data, error } = await supabase.from('employees').insert(mapEmployeeToDb(employeeData)).select().single();
    if (error) throw error;
    setEmployees(prev => [...prev, mapEmployeeFromDb(data)]);
  };

  const handleUpdateEmployee = async (id: string, employeeData: Employee) => {
    const { data, error } = await supabase.from('employees').update(mapEmployeeToDb(employeeData)).eq('id', id).select().single();
    if (error) throw error;
    setEmployees(prev => prev.map(e => e.id === id ? mapEmployeeFromDb(data) : e));
  };
  
  const handleDeleteEmployee = async (id: string) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
    setEmployees(prev => prev.filter(e => e.id !== id));
  };
  
  const handleAddProcessType = async (processData: { name: string, rate: number }) => {
    const { data, error } = await supabase.from('process_types').insert(processData).select().single();
    if (error) throw error;
    setProcessTypes(prev => [...prev, data]);
  };
  
  const handleUpdateProcessType = async (id: string, processData: { name: string, rate: number }) => {
    const { data, error } = await supabase.from('process_types').update(processData).eq('id', id).select().single();
    if (error) throw error;
    setProcessTypes(prev => prev.map(p => p.id === id ? data : p));
  };

  const handleDeleteProcessType = async (id: string) => {
    const { error } = await supabase.from('process_types').delete().eq('id', id);
    if (error) throw error;
    setProcessTypes(prev => prev.filter(p => p.id !== id));
  };
  
  const handleAddBankName = (newBankName: string) => {
    if (!bankNames.includes(newBankName)) {
        setBankNames(prev => [...prev, newBankName].sort());
    }
  };
  
  const handleAddMasterItem = async (itemData: { name: string, rate: number }): Promise<MasterItem | null> => {
    const { data, error } = await supabase.from('master_items').insert(itemData).select().single();
    if (error) {
        console.error("Error adding master item:", error);
        return null;
    }
    setMasterItems(prev => [...prev, data]);
    return data;
  };
  
  // --- CONFIG HANDLERS ---
  const handleUpdatePoNumberConfig = async (newConfig: PONumberConfig) => {
    const { data, error } = await supabase
      .from('numbering_configs')
      .upsert({ id: 'po', prefix: newConfig.prefix, next_number: newConfig.nextNumber });
    if (error) throw error;
    setPoNumberConfig(newConfig);
  };
  
  const handleUpdateDeliveryChallanConfig = async (newConfig: DeliveryChallanNumberConfig) => {
    const { error } = await supabase
      .from('numbering_configs')
      .upsert({ id: 'delivery_challan', prefix: newConfig.prefix, next_number: newConfig.nextNumber });
    if (error) throw error;
    setDcNumberConfig(newConfig);
  };
  
  const handleUpdateInvoiceNumberConfig = async (newConfig: InvoiceNumberConfig) => {
    const { error } = await supabase
      .from('numbering_configs')
      .upsert({ id: 'invoice', mode: newConfig.mode, prefix: newConfig.prefix, next_number: newConfig.nextNumber });
    if (error) throw error;
    setInvoiceNumberConfig(newConfig);
  };

  const handleUpdateCompanyDetails = async (details: CompanyDetails) => {
    const { error } = await supabase
      .from('company_details')
      .upsert({ 
        id: 1, 
        name: details.name,
        address_line_1: details.addressLine1,
        address_line_2: details.addressLine2,
        phone: details.phone,
        email: details.email,
        gstin: details.gstin,
        bank_name: details.bankName,
        bank_account_number: details.bankAccountNumber,
        bank_ifsc_code: details.bankIfscCode,
      });
    if (error) throw error;
    setCompanyDetails(details);
  };

  // --- TRANSACTION HANDLERS ---
  const handleAddPurchaseOrder = async (newOrder: PurchaseOrder) => {
    const { items, ...orderData } = newOrder;
    
    // 1. Insert the main PO
    const { data: poInsertData, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        po_number: orderData.poNumber,
        po_date: orderData.poDate,
        shop_name: orderData.shopName,
        total_amount: orderData.totalAmount,
        gst_no: orderData.gstNo,
        payment_mode: orderData.paymentMode,
        status: orderData.status,
        bank_name: orderData.bankName,
        cheque_date: orderData.chequeDate,
        payment_terms: orderData.paymentTerms,
      })
      .select()
      .single();

    if (poError) throw poError;

    // 2. Insert line items
    const itemsToInsert = items.map(item => ({
      po_id: poInsertData.id,
      ...item
    }));
    const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;
    
    // 3. Update PO numbering config
    await handleUpdatePoNumberConfig({ ...poNumberConfig, nextNumber: poNumberConfig.nextNumber + 1 });
    
    // 4. Update local state
    setPurchaseOrders(prev => [...prev, { ...orderData, id: poInsertData.id, items }]);
  };
  
  const handleUpdatePurchaseOrder = async (poNumberToUpdate: string, updatedOrder: PurchaseOrder) => {
    const { items, ...orderData } = updatedOrder;
    
    // 1. Update main PO
    const { data: poUpdateData, error: poError } = await supabase
      .from('purchase_orders')
      .update({
        po_date: orderData.poDate,
        shop_name: orderData.shopName,
        total_amount: orderData.totalAmount,
        gst_no: orderData.gstNo,
        payment_mode: orderData.paymentMode,
        status: orderData.status,
        bank_name: orderData.bankName,
        cheque_date: orderData.chequeDate,
        payment_terms: orderData.paymentTerms,
      })
      .eq('po_number', poNumberToUpdate)
      .select()
      .single();
      
    if (poError) throw poError;
    
    // 2. Delete existing items for simplicity
    const { error: deleteError } = await supabase.from('purchase_order_items').delete().eq('po_id', orderData.id);
    if (deleteError) throw deleteError;
    
    // 3. Insert new items
    const itemsToInsert = items.map(item => ({ po_id: orderData.id, ...item }));
    const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;

    // 4. Update local state
    setPurchaseOrders(prev => prev.map(po => po.poNumber === poNumberToUpdate ? updatedOrder : po));
  };

  const handleDeletePurchaseOrder = async (poNumberToDelete: string) => {
    const { error } = await supabase.from('purchase_orders').delete().eq('po_number', poNumberToDelete);
    if (error) throw error;
    setPurchaseOrders(prev => prev.filter(po => po.poNumber !== poNumberToDelete));
  };
  
  const handleAddDeliveryChallan = async (newChallanData: Omit<DeliveryChallan, 'id'>) => {
    // Insert new challan
    const { data: challanInsertData, error: challanError } = await supabase
      .from('delivery_challans')
      .insert(mapDeliveryChallanToDb(newChallanData))
      .select()
      .single();
    if (challanError) throw challanError;

    // Update DC numbering config
    await handleUpdateDeliveryChallanConfig({ ...dcNumberConfig, nextNumber: dcNumberConfig.nextNumber + 1 });

    // Update local state
    const addedChallan = mapDeliveryChallanFromDb(challanInsertData);
    setDeliveryChallans(prev => [...prev, addedChallan]);
  };
  
  const handleUpdateDeliveryChallan = async (id: string, updatedChallanData: DeliveryChallan) => {
    const { data, error } = await supabase
        .from('delivery_challans')
        .update(mapDeliveryChallanToDb(updatedChallanData))
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    setDeliveryChallans(prev => prev.map(c => c.id === id ? mapDeliveryChallanFromDb(data) : c));
  };
  
  const handleDeleteDeliveryChallan = async (id: string) => {
    const { error } = await supabase.from('delivery_challans').delete().eq('id', id);
    if (error) throw error;
    setDeliveryChallans(prev => prev.filter(c => c.id !== id));
  };
  
  const handleAddInvoice = async (newInvoice: Omit<Invoice, 'id'>) => {
    const { items, ...invoiceData } = newInvoice;
    const { data: invInsertData, error: invError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceData.invoiceNumber,
        invoice_date: invoiceData.invoiceDate,
        client_name: invoiceData.clientName,
        sub_total: invoiceData.subTotal,
        total_cgst: invoiceData.totalCgst,
        total_sgst: invoiceData.totalSgst,
        total_tax_amount: invoiceData.totalTaxAmount,
        rounded_off: invoiceData.roundedOff,
        total_amount: invoiceData.totalAmount,
      })
      .select()
      .single();
    if (invError) throw invError;
    
    const itemsToInsert = items.map(item => ({
      invoice_id: invInsertData.id,
      challan_number: item.challanNumber,
      challan_date: item.challanDate,
      process: item.process,
      description: item.description,
      design_no: item.designNo,
      hsn_sac: item.hsnSac,
      pcs: item.pcs,
      mtr: item.mtr,
      rate: item.rate,
      amount: item.amount,
      subtotal: item.subtotal,
      cgst: item.cgst,
      sgst: item.sgst,
    }));
    const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
    if (itemsError) throw itemsError;

    if (invoiceNumberConfig.mode === 'auto') {
      await handleUpdateInvoiceNumberConfig({ ...invoiceNumberConfig, nextNumber: invoiceNumberConfig.nextNumber + 1 });
    }
    
    setInvoices(prev => [...prev, { ...newInvoice, id: invInsertData.id }]);
  };

  const handleAddPayment = async (paymentData: Omit<PaymentReceived, 'id'>) => {
    const { data, error } = await supabase.from('payments_received').insert(mapPaymentReceivedToDb(paymentData)).select().single();
    if (error) throw error;
    setPaymentsReceived(prev => [...prev, mapPaymentReceivedFromDb(data)]);
  };

  const handleUpdatePayment = async (paymentData: PaymentReceived) => {
    const { id, ...rest } = paymentData;
    const { data, error } = await supabase.from('payments_received').update(mapPaymentReceivedToDb(rest)).eq('id', id).select().single();
    if (error) throw error;
    setPaymentsReceived(prev => prev.map(p => p.id === id ? mapPaymentReceivedFromDb(data) : p));
  };
  
  const handleDeletePayment = async (id: string) => {
    const { error } = await supabase.from('payments_received').delete().eq('id', id);
    if (error) throw error;
    setPaymentsReceived(prev => prev.filter(p => p.id !== id));
  };
  
  const handleSaveAttendance = async (recordsToSave: Omit<AttendanceRecord, 'id'>[]) => {
    const mappedRecords = recordsToSave.map(mapAttendanceToDb);
    const { data, error } = await supabase.from('attendance').upsert(mappedRecords, { onConflict: 'employee_id,date' }).select();
    if (error) throw error;
    
    // Naive update, could be optimized
    await fetchInitialData();
  };
  
  const handleAddAdvance = async (advanceData: Omit<EmployeeAdvance, 'id'>) => {
    const { data, error } = await supabase.from('employee_advances').insert(mapAdvanceToDb(advanceData)).select().single();
    if (error) throw error;
    setAdvances(prev => [...prev, mapAdvanceFromDb(data)]);
  };

  const handleUpdateAdvance = async (advanceData: EmployeeAdvance) => {
    const { id, ...rest } = advanceData;
    const { data, error } = await supabase.from('employee_advances').update(mapAdvanceToDb(rest)).eq('id', id).select().single();
    if (error) throw error;
    setAdvances(prev => prev.map(a => a.id === id ? mapAdvanceFromDb(data) : a));
  };

  const handleDeleteAdvance = async (id: string) => {
    const { error } = await supabase.from('employee_advances').delete().eq('id', id);
    if (error) throw error;
    setAdvances(prev => prev.filter(a => a.id !== id));
  };
  
  const handleSavePayslip = async (payslipData: Omit<Payslip, 'id'>) => {
    // 1. Save the payslip
    const { data, error } = await supabase.from('payslips').insert(mapPayslipToDb(payslipData)).select().single();
    if (error) throw error;

    // 2. Create a new "payment" entry in advances to account for the deduction
    if (payslipData.advanceDeduction > 0) {
        const advancePayment: Omit<EmployeeAdvance, 'id'> = {
            employeeId: payslipData.employeeId,
            date: payslipData.payslipDate,
            amount: 0,
            paidAmount: payslipData.advanceDeduction,
            notes: `Paid via salary deduction for period ${formatDateForDisplay(payslipData.payPeriodStart)} - ${formatDateForDisplay(payslipData.payPeriodEnd)}`,
        };
        const { error: advanceError } = await supabase.from('employee_advances').insert(mapAdvanceToDb(advancePayment));
        if (advanceError) {
            // This is tricky, maybe should be a transaction. For now, log and alert.
            console.error("Failed to record advance deduction payment:", advanceError);
            alert("Warning: Payslip was saved, but failed to automatically record the advance deduction payment. Please check employee advances.");
        }
    }

    // 3. Refresh data to reflect all changes
    await fetchInitialData();
  };

  const handleAddOtherExpense = async (expenseData: Omit<OtherExpense, 'id'>) => {
    const { data, error } = await supabase.from('other_expenses').insert(mapOtherExpenseToDb(expenseData)).select().single();
    if (error) throw error;
    setOtherExpenses(prev => [...prev, mapOtherExpenseFromDb(data)]);
  };

  const handleUpdateOtherExpense = async (expenseData: OtherExpense) => {
    const { id, ...rest } = expenseData;
    const { data, error } = await supabase.from('other_expenses').update(mapOtherExpenseToDb(rest)).eq('id', id).select().single();
    if (error) throw error;
    setOtherExpenses(prev => prev.map(e => e.id === id ? mapOtherExpenseFromDb(data) : e));
  };

  const handleDeleteOtherExpense = async (id: string) => {
    const { error } = await supabase.from('other_expenses').delete().eq('id', id);
    if (error) throw error;
    setOtherExpenses(prev => prev.filter(e => e.id !== id));
  };
  
  const handleAddExpenseCategory = async (name: string): Promise<ExpenseCategory | null> => {
    const { data, error } = await supabase
        .from('expense_categories')
        .insert({ name })
        .select()
        .single();
    if (error) {
        console.error('Error adding expense category:', error);
        alert(`Failed to add category: ${error.message}`);
        return null;
    }
    if (data) {
        setExpenseCategories(prev => [...prev, data]);
        return data;
    }
    return null;
};
  
  const renderScreen = () => {
    switch (activeScreen) {
      case 'Dashboard':
        return <ScreenPlaceholder title="Dashboard" description="Overview of your business operations." />;
      case 'Add Client':
        return <ShopMasterScreen clients={clients} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} processTypes={processTypes} onAddProcessType={handleAddProcessType} />;
      case 'Add Purchase Shop':
        return <PurchaseShopMasterScreen shops={purchaseShops} onAddShop={handleAddPurchaseShop} onUpdateShop={handleUpdatePurchaseShop} />;
      case 'Employee Master':
        return <EmployeeMasterScreen employees={employees} onAddEmployee={handleAddEmployee} onUpdateEmployee={handleUpdateEmployee} onDeleteEmployee={handleDeleteEmployee} />;
      case 'Type of Process Master':
        return <ProcessTypeMasterScreen processTypes={processTypes} onAddProcessType={handleAddProcessType} onUpdateProcessType={handleUpdateProcessType} onDeleteProcessType={handleDeleteProcessType}/>;
      case 'Expenses':
        return <PurchaseOrderScreen
          purchaseOrders={purchaseOrders}
          onAddOrder={handleAddPurchaseOrder}
          onUpdateOrder={handleUpdatePurchaseOrder}
          onDeleteOrder={handleDeletePurchaseOrder}
          purchaseShops={purchaseShops}
          onAddPurchaseShop={handleAddPurchaseShop}
          bankNames={bankNames}
          onAddBankName={handleAddBankName}
          poNumberConfig={poNumberConfig}
          masterItems={masterItems}
          onAddMasterItem={handleAddMasterItem}
          // Employee Advance props
          advances={advances}
          employees={employees}
          onAddAdvance={handleAddAdvance}
          onUpdateAdvance={handleUpdateAdvance}
          onDeleteAdvance={handleDeleteAdvance}
          // Other Expense props
          otherExpenses={otherExpenses}
          onAddOtherExpense={handleAddOtherExpense}
          onUpdateOtherExpense={handleUpdateOtherExpense}
          onDeleteOtherExpense={handleDeleteOtherExpense}
          expenseCategories={expenseCategories}
          onAddExpenseCategory={handleAddExpenseCategory}
        />;
      case 'Delivery Challans':
        return <DeliveryChallanScreen 
          deliveryChallans={deliveryChallans}
          onAddChallan={handleAddDeliveryChallan}
          onUpdateChallan={handleUpdateDeliveryChallan}
          onDeleteChallan={handleDeleteDeliveryChallan}
          clients={clients}
          onAddClient={handleAddClient}
          processTypes={processTypes}
          onAddProcessType={handleAddProcessType}
          deliveryChallanNumberConfig={dcNumberConfig}
          invoices={invoices}
          companyDetails={companyDetails}
          employees={employees}
          onAddEmployee={handleAddEmployee}
        />;
      case 'Invoices':
        return <InvoicesScreen 
          clients={clients}
          deliveryChallans={deliveryChallans}
          processTypes={processTypes}
          onAddInvoice={handleAddInvoice}
          invoiceNumberConfig={invoiceNumberConfig}
          invoices={invoices}
          companyDetails={companyDetails}
        />;
      case 'Payment Received':
          return <PaymentReceivedScreen 
              payments={paymentsReceived}
              onAddPayment={handleAddPayment}
              onUpdatePayment={handleUpdatePayment}
              onDeletePayment={handleDeletePayment}
              clients={clients}
              onAddClient={handleAddClient}
          />;
      case 'Attendance':
        return <AttendanceScreen employees={employees} attendanceRecords={attendanceRecords} onSave={handleSaveAttendance} />;
      case 'Salary & Payslips':
        return <SalaryScreen 
            employees={employees}
            attendanceRecords={attendanceRecords}
            onUpdateEmployee={handleUpdateEmployee}
            advances={advances}
            onSavePayslip={handleSavePayslip}
            companyDetails={companyDetails}
            payslips={payslips}
        />;
      case 'Reports':
        return <ScreenPlaceholder title="Reports" description="Generate and view various business reports." />;
      case 'Settings':
        return <SettingsScreen 
          poConfig={poNumberConfig} 
          onUpdatePoConfig={handleUpdatePoNumberConfig}
          dcConfig={dcNumberConfig}
          onUpdateDcConfig={handleUpdateDeliveryChallanConfig}
          invConfig={invoiceNumberConfig}
          onUpdateInvConfig={handleUpdateInvoiceNumberConfig}
        />;
      case 'User Admin':
        return <UserAdminScreen companyDetails={companyDetails} onUpdate={handleUpdateCompanyDetails} />;
      case 'New Screen':
        return <ProductsScreen clients={clients} onAddClient={handleAddClient} processTypes={processTypes} onAddProcessType={handleAddProcessType} />;
      case 'New Client':
        return <NewClientScreen clients={clients} onAddClient={handleAddClient} processTypes={processTypes} onAddProcessType={handleAddProcessType} setActiveScreen={setActiveScreen} />;
      case 'New Party':
        return <NewPartyScreen shops={purchaseShops} onAddShop={handleAddPurchaseShop} setActiveScreen={setActiveScreen} />;
      default:
        return <ScreenPlaceholder title="Not Found" description="The requested screen does not exist." />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-8">
          {isLoading ? (
            <div className="text-center p-8">Loading...</div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          ) : (
            renderScreen()
          )}
        </main>
      </div>
    </div>
  );
};

export default App;