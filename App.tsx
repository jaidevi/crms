
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardScreen from './components/DashboardScreen';
import PurchaseOrderScreen from './components/PurchaseOrderScreen';
import DeliveryChallanScreen from './components/DeliveryChallanScreen';
import InvoicesScreen from './components/InvoicesScreen';
import PaymentReceivedScreen from './components/PaymentReceivedScreen';
import AttendanceScreen from './components/AttendanceScreen';
import SalaryScreen from './components/SalaryScreen';
import ShopMasterScreen from './components/ShopMasterScreen'; // For Clients
import PurchaseShopMasterScreen from './components/PurchaseShopMasterScreen';
import EmployeeMasterScreen from './components/EmployeeMasterScreen';
import PartyDCProcessMasterScreen from './components/PartyDCProcessMasterScreen';
import SettingsScreen from './components/SettingsScreen';
import UserAdminScreen from './components/UserAdminScreen';
import NewClientScreen from './components/NewClientScreen';
import NewPartyScreen from './components/NewPartyScreen';
import ProductsScreen from './components/NewItemForm'; // "New Screen" in sidebar points here?
import { supabase } from './supabaseClient';

// Type Definitions
export type PaymentMode = 'Cash' | 'Cheque' | 'NEFT' | 'GPay' | 'Credit Card' | 'Bank Transfer' | 'Other';
export type OrderStatus = 'Paid' | 'Unpaid';
export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Holiday';

export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface ProcessType {
  id: string;
  name: string;
  rate: number;
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
  panNo: string;
  paymentTerms: string;
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
  panNo: string;
  paymentTerms: string;
}

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
  paymentTerms?: string;
  referenceId?: string;
  bankName?: string;
  chequeDate?: string;
}

export interface Employee {
  id: string;
  name: string;
  designation: string;
  phone: string;
  dailyWage: number;
  ratePerMeter: number;
}

export interface EmployeeAdvance {
  id: string;
  employeeId: string;
  date: string;
  amount: number;
  paidAmount: number;
  notes: string;
}

export interface OtherExpense {
  id: string;
  date: string;
  itemName: string;
  amount: number;
  notes: string;
  paymentMode: PaymentMode;
  paymentStatus: OrderStatus;
  paymentTerms?: string;
  bankName?: string;
  chequeDate?: string;
}

export interface ExpenseCategory {
    id: string;
    name: string;
}

export interface TimberExpense {
  id: string;
  date: string;
  supplierName: string;
  loadWeight: number;
  vehicleWeight: number;
  cft: number;
  rate: number;
  amount: number;
  notes: string;
  paymentMode: PaymentMode;
  paymentStatus: OrderStatus;
  paymentTerms?: string;
  bankName?: string;
  chequeDate?: string;
}

export interface SupplierPayment {
    id: string;
    paymentNumber: string;
    date: string;
    supplierName: string;
    amount: number;
    paymentMode: PaymentMode;
    referenceId: string;
    image: string;
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
  workerName?: string;
  workingUnit?: string;
  isOutsourcing: boolean;
  dcImage: string[];
  sampleImage: string[];
}

export interface InvoiceItem {
    id: string;
    challanNumber: string;
    challanDate: string;
    process: string;
    description?: string;
    designNo: string;
    hsnSac: string;
    pcs: number;
    mtr: number;
    rate: number;
    subtotal: number;
    cgst: number;
    sgst: number;
    amount: number;
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
  totalAmount: number;
}

export interface PaymentReceived {
    id: string;
    clientName: string;
    paymentDate: string;
    amount: number;
    paymentMode: PaymentMode;
    referenceNumber: string;
    notes: string;
}

export interface AttendanceRecord {
    id: string;
    employee_id: string;
    date: string;
    morningStatus: AttendanceStatus;
    eveningStatus: AttendanceStatus;
    morningOvertimeHours: number;
    eveningOvertimeHours: number;
    metersProduced?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface Payslip {
    id: string;
    employeeId: string;
    employeeName: string;
    payslipDate: string;
    payPeriodStart: string;
    payPeriodEnd: string;
    totalWorkingDays: number;
    otHours: number;
    wageEarnings: number;
    productionEarnings: number;
    grossSalary: number;
    advanceDeduction: number;
    netSalary: number;
    totalOutstandingAdvance: number;
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

export interface PONumberConfig {
    prefix: string;
    nextNumber: number;
}

export interface DeliveryChallanNumberConfig {
    prefix: string;
    nextNumber: number;
}

export interface InvoiceNumberConfig {
    mode: 'auto' | 'manual';
    prefix: string;
    nextNumber: number;
}

export interface SupplierPaymentNumberConfig {
    prefix: string;
    nextNumber: number;
}

export interface MasterItem {
    id: string;
    name: string;
    rate: number;
}

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState('Dashboard');
  
  // State Variables
  const [clients, setClients] = useState<Client[]>([]);
  const [purchaseShops, setPurchaseShops] = useState<PurchaseShop[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentsReceived, setPaymentsReceived] = useState<PaymentReceived[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [advances, setAdvances] = useState<EmployeeAdvance[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<OtherExpense[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [timberExpenses, setTimberExpenses] = useState<TimberExpense[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [masterItems, setMasterItems] = useState<MasterItem[]>([]);
  const [bankNames, setBankNames] = useState<string[]>([]);

  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({
      name: 'Shri Skandaguru Textile Process',
      addressLine1: '274-3, Nethaji Nagar, Kalarampatti',
      addressLine2: 'Salem, Tamil Nadu',
      phone: '9036802617',
      email: 'sktexprocess@gmail.com',
      gstin: '33APIPA3769B1ZB',
      bankName: 'Union Bank Of India(Salem)',
      bankAccountNumber: '334101010201163',
      bankIfscCode: 'UBIN0533416',
  });

  const [poNumberConfig, setPoNumberConfig] = useState<PONumberConfig>({ prefix: 'PO', nextNumber: 1 });
  const [dcNumberConfig, setDcNumberConfig] = useState<DeliveryChallanNumberConfig>({ prefix: 'DC', nextNumber: 1 });
  const [invoiceNumberConfig, setInvoiceNumberConfig] = useState<InvoiceNumberConfig>({ mode: 'auto', prefix: 'INV/SKTP/-', nextNumber: 24255 });
  const [supplierPaymentConfig, setSupplierPaymentConfig] = useState<SupplierPaymentNumberConfig>({ prefix: 'SP', nextNumber: 1 });

  // Fetch data from Supabase independently to prevent waterfall delay
  useEffect(() => {
    const fetchTable = async (table: string, setter: Function, transformer?: Function) => {
        try {
            let query = supabase.from(table).select('*');
            
            // Specific includes for nested data
            if (table === 'purchase_orders') {
                query = supabase.from('purchase_orders').select('*, purchase_order_items(*)');
            } else if (table === 'invoices') {
                query = supabase.from('invoices').select('*, invoice_items(*)');
            } else if (table === 'company_details') {
                query = supabase.from('company_details').select('*').single();
            }

            const { data, error } = await query;
            if (error) throw error;
            if (data) {
                setter(transformer ? transformer(data) : data);
            }
        } catch (error) {
            console.error(`Error fetching ${table}:`, error);
        }
    };

    // 1. Clients
    fetchTable('clients', setClients, (data: any[]) => data.map(c => {
        // Ensure processes is handled gracefully if it comes as string or array
        let processes = c.processes;
        if (typeof processes === 'string') {
            try { processes = JSON.parse(processes); } catch { processes = []; }
        }
        return {
            id: c.id,
            name: c.name,
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            city: c.city || '',
            state: c.state || '',
            pincode: c.pincode || '',
            gstNo: c.gst_no || '',
            panNo: c.pan_no || '',
            paymentTerms: c.payment_terms || '',
            processes: Array.isArray(processes) ? processes : []
        };
    }));

    // 2. Purchase Shops
    fetchTable('purchase_shops', setPurchaseShops, (data: any[]) => data.map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone || '',
        email: s.email || '',
        address: s.address || '',
        city: s.city || '',
        state: s.state || '',
        pincode: s.pincode || '',
        gstNo: s.gst_no || '',
        panNo: s.pan_no || '',
        paymentTerms: s.payment_terms || ''
    })));

    // 3. Employees
    fetchTable('employees', setEmployees, (data: any[]) => data.map(e => ({
        id: e.id,
        name: e.name,
        designation: e.designation || '',
        phone: e.phone || '',
        dailyWage: Number(e.daily_wage) || 0,
        ratePerMeter: Number(e.rate_per_meter) || 0
    })));

    // 4. Process Types
    fetchTable('process_types', setProcessTypes, (data: any[]) => data.map(p => ({
        id: p.id,
        name: p.name,
        rate: Number(p.rate) || 0
    })));

    // 5. Master Items
    fetchTable('master_items', setMasterItems, (data: any[]) => data.map(i => ({
        id: i.id,
        name: i.name,
        rate: Number(i.rate) || 0
    })));

    // 6. Expense Categories
    fetchTable('expense_categories', setExpenseCategories, (data: any[]) => data.map(c => ({
        id: c.id,
        name: c.name
    })));

    // 7. Purchase Orders
    fetchTable('purchase_orders', setPurchaseOrders, (data: any[]) => data.map(po => ({
        id: po.id,
        poNumber: po.po_number,
        poDate: po.po_date,
        shopName: po.shop_name || '',
        items: (po.purchase_order_items || []).map((i: any) => ({
            id: i.id,
            name: i.name,
            quantity: Number(i.quantity) || 0,
            rate: Number(i.rate) || 0,
            amount: Number(i.amount) || 0
        })),
        totalAmount: Number(po.total_amount) || 0,
        gstNo: po.gst_no || '',
        paymentMode: po.payment_mode as PaymentMode,
        status: po.status as OrderStatus,
        paymentTerms: po.payment_terms,
        referenceId: po.reference_id,
        bankName: po.bank_name,
        chequeDate: po.cheque_date
    })));

    // 8. Delivery Challans
    fetchTable('delivery_challans', setDeliveryChallans, (data: any[]) => data.map(dc => {
        let dcImages: string[] = [];
        try {
            dcImages = dc.dc_image ? JSON.parse(dc.dc_image) : [];
            if (!Array.isArray(dcImages)) dcImages = [dc.dc_image];
        } catch { dcImages = dc.dc_image ? [dc.dc_image] : []; }

        let sampleImages: string[] = [];
        try {
            sampleImages = dc.sample_image ? JSON.parse(dc.sample_image) : [];
            if (!Array.isArray(sampleImages)) sampleImages = [dc.sample_image];
        } catch { sampleImages = dc.sample_image ? [dc.sample_image] : []; }

        let processes: string[] = [];
        try {
            processes = dc.process ? JSON.parse(dc.process) : [];
            if (!Array.isArray(processes) && typeof dc.process === 'string') processes = dc.process.split(',').map((s: string) => s.trim());
        } catch { processes = dc.process ? [dc.process] : []; }

        return {
            id: dc.id,
            challanNumber: dc.challan_number,
            date: dc.date,
            partyName: dc.party_name,
            partyDCNo: dc.party_dc_no || '',
            process: processes,
            designNo: dc.design_no || '',
            pcs: Number(dc.pcs) || 0,
            mtr: Number(dc.mtr) || 0,
            width: Number(dc.width) || 0,
            shrinkage: dc.shrinkage || '',
            pin: dc.pin || '',
            pick: dc.pick || '',
            extraWork: dc.extra_work || '',
            status: dc.status || '',
            workerName: dc.worker_name,
            workingUnit: dc.working_unit,
            isOutsourcing: dc.is_outsourcing || false,
            dcImage: dcImages,
            sampleImage: sampleImages
        };
    }));

    // 9. Invoices
    fetchTable('invoices', setInvoices, (data: any[]) => data.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        invoiceDate: inv.invoice_date,
        clientName: inv.client_name,
        subTotal: Number(inv.sub_total) || 0,
        totalCgst: Number(inv.total_cgst) || 0,
        totalSgst: Number(inv.total_sgst) || 0,
        totalTaxAmount: Number(inv.total_tax_amount) || 0,
        roundedOff: Number(inv.rounded_off) || 0,
        totalAmount: Number(inv.total_amount) || 0,
        items: (inv.invoice_items || []).map((item: any) => ({
            id: item.id,
            challanNumber: item.challan_number || '',
            challanDate: item.challan_date,
            process: item.process || '',
            description: item.description,
            designNo: item.design_no || '',
            hsnSac: item.hsn_sac || '',
            pcs: Number(item.pcs) || 0,
            mtr: Number(item.mtr) || 0,
            rate: Number(item.rate) || 0,
            subtotal: Number(item.subtotal) || 0,
            cgst: Number(item.cgst) || 0,
            sgst: Number(item.sgst) || 0,
            amount: Number(item.amount) || 0
        }))
    })));

    // 10. Payments Received
    fetchTable('payments_received', setPaymentsReceived, (data: any[]) => data.map(p => ({
        id: p.id,
        clientName: p.client_name,
        paymentDate: p.payment_date,
        amount: Number(p.amount) || 0,
        paymentMode: p.payment_mode as PaymentMode,
        referenceNumber: p.reference_number || '',
        notes: p.notes || ''
    })));

    // 11. Attendance
    fetchTable('attendance', setAttendanceRecords, (data: any[]) => data.map(a => ({
        id: a.id,
        employee_id: a.employee_id,
        date: a.date,
        morningStatus: a.morning_status as AttendanceStatus,
        eveningStatus: a.evening_status as AttendanceStatus,
        morningOvertimeHours: Number(a.morning_overtime_hours) || 0,
        eveningOvertimeHours: Number(a.evening_overtime_hours) || 0,
        metersProduced: Number(a.meters_produced) || 0,
        createdAt: a.created_at,
        updatedAt: a.updated_at
    })));

    // 12. Employee Advances
    fetchTable('employee_advances', setAdvances, (data: any[]) => data.map(a => ({
        id: a.id,
        employeeId: a.employee_id,
        date: a.date,
        amount: Number(a.amount) || 0,
        paidAmount: Number(a.paid_amount) || 0,
        notes: a.notes || ''
    })));

    // 13. Other Expenses
    fetchTable('other_expenses', setOtherExpenses, (data: any[]) => {
        const expenses = data.map(e => ({
            id: e.id,
            date: e.date,
            itemName: e.item_name,
            amount: Number(e.amount) || 0,
            notes: e.notes || '',
            paymentMode: e.payment_mode as PaymentMode,
            paymentStatus: e.payment_status as OrderStatus,
            paymentTerms: e.payment_terms,
            bankName: e.bank_name,
            chequeDate: e.cheque_date
        }));
        const bankNamesSet = new Set<string>();
        expenses.forEach(e => { if(e.bankName) bankNamesSet.add(e.bankName) });
        setBankNames(Array.from(bankNamesSet));
        return expenses;
    });

    // 14. Timber Expenses
    fetchTable('timber_expenses', setTimberExpenses, (data: any[]) => data.map(t => ({
        id: t.id,
        date: t.date,
        supplierName: t.supplier_name,
        loadWeight: Number(t.load_weight) || 0,
        vehicleWeight: Number(t.vehicle_weight) || 0,
        cft: Number(t.cft) || 0,
        rate: Number(t.rate) || 0,
        amount: Number(t.amount) || 0,
        notes: t.notes || '',
        paymentMode: t.payment_mode as PaymentMode,
        paymentStatus: t.payment_status as OrderStatus,
        paymentTerms: t.payment_terms,
        bankName: t.bank_name,
        chequeDate: t.cheque_date
    })));

    // 15. Supplier Payments
    fetchTable('supplier_payments', setSupplierPayments, (data: any[]) => data.map(s => ({
        id: s.id,
        paymentNumber: s.payment_number,
        date: s.date,
        supplierName: s.supplier_name,
        amount: Number(s.amount) || 0,
        paymentMode: s.payment_mode as PaymentMode,
        referenceId: s.reference_id || '',
        image: s.image || ''
    })));

    // 16. Payslips
    fetchTable('payslips', setPayslips, (data: any[]) => data.map(p => ({
        id: p.id,
        employeeId: p.employee_id,
        employeeName: p.employee_name,
        payslipDate: p.payslip_date,
        payPeriodStart: p.pay_period_start,
        payPeriodEnd: p.pay_period_end,
        totalWorkingDays: Number(p.total_working_days) || 0,
        otHours: Number(p.ot_hours) || 0,
        wageEarnings: Number(p.wage_earnings) || 0,
        productionEarnings: Number(p.production_earnings) || 0,
        grossSalary: Number(p.gross_salary) || 0,
        advanceDeduction: Number(p.advance_deduction) || 0,
        netSalary: Number(p.net_salary) || 0,
        totalOutstandingAdvance: Number(p.total_outstanding_advance) || 0
    })));

    // 17. Company Details - Handled in initial check or independent fetch
    fetchTable('company_details', (data: any) => {
        if(data) {
             setCompanyDetails({
                name: data.name || 'Shri Skandaguru Textile Process',
                addressLine1: data.address_line_1 || '',
                addressLine2: data.address_line_2 || '',
                phone: data.phone || '',
                email: data.email || '',
                gstin: data.gstin || '',
                bankName: data.bank_name || 'Union Bank Of India(Salem)',
                bankAccountNumber: data.bank_account_number || '334101010201163',
                bankIfscCode: data.bank_ifsc_code || 'UBIN0533416'
            });
        }
    });

    // 18. Numbering Configs
    fetchTable('numbering_configs', (data: any[]) => {
        data.forEach(conf => {
            if (conf.id === 'po') setPoNumberConfig({ prefix: conf.prefix, nextNumber: conf.next_number });
            // FIX: Check for both IDs to support legacy or misconfigured entries
            if (conf.id === 'delivery_challan' || conf.id === 'dc') setDcNumberConfig({ prefix: conf.prefix, nextNumber: conf.next_number });
            if (conf.id === 'invoice') setInvoiceNumberConfig({ mode: conf.mode || 'auto', prefix: conf.prefix, nextNumber: conf.next_number });
            if (conf.id === 'supplier_payment') setSupplierPaymentConfig({ prefix: conf.prefix, nextNumber: conf.next_number });
        });
    });

  }, []);

  // Handlers (Basic Implementation)
  const handleAddClient = async (newClient: Omit<Client, 'id'>) => {
      try {
          const { data, error } = await supabase.from('clients').insert([{
              name: newClient.name,
              phone: newClient.phone,
              email: newClient.email,
              address: newClient.address,
              city: newClient.city,
              state: newClient.state,
              pincode: newClient.pincode,
              gst_no: newClient.gstNo,
              pan_no: newClient.panNo,
              payment_terms: newClient.paymentTerms,
              // Ensure processes is stored as valid JSON array
              processes: newClient.processes || []
          }]).select().single();

          if (error) throw error;
          if (data) {
              const client: Client = {
                  id: data.id,
                  name: data.name,
                  phone: data.phone,
                  email: data.email,
                  address: data.address,
                  city: data.city,
                  state: data.state,
                  pincode: data.pincode,
                  gstNo: data.gst_no,
                  panNo: data.pan_no,
                  paymentTerms: data.payment_terms,
                  processes: data.processes || []
              };
              setClients(prev => [...prev, client]);
          }
      } catch (error: any) {
          console.error("Error adding client:", error);
          alert("Failed to add client: " + error.message);
      }
  };

  const handleUpdateClient = async (updatedClient: Client) => {
      try {
          const { error } = await supabase.from('clients').update({
              name: updatedClient.name,
              phone: updatedClient.phone,
              email: updatedClient.email,
              address: updatedClient.address,
              city: updatedClient.city,
              state: updatedClient.state,
              pincode: updatedClient.pincode,
              gst_no: updatedClient.gstNo,
              pan_no: updatedClient.panNo,
              payment_terms: updatedClient.paymentTerms,
              // Ensure processes is stored as valid JSON array
              processes: updatedClient.processes || []
          }).eq('id', updatedClient.id);

          if (error) throw error;

          setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      } catch (error: any) {
          console.error("Error updating client:", error);
          alert("Failed to update client: " + error.message);
      }
  };

  const handleDeleteClient = async (id: string) => {
      try {
          const { error } = await supabase.from('clients').delete().eq('id', id);
          if (error) throw error;
          setClients(prev => prev.filter(c => c.id !== id));
      } catch (error: any) {
          console.error("Error deleting client:", error);
          alert("Failed to delete client: " + error.message);
      }
  };

  const handleAddPurchaseShop = (newShop: Omit<PurchaseShop, 'id'>) => setPurchaseShops(prev => [...prev, { ...newShop, id: Date.now().toString() }]);
  const handleUpdatePurchaseShop = (updatedShop: PurchaseShop) => setPurchaseShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
  const handleDeletePurchaseShop = (id: string) => setPurchaseShops(prev => prev.filter(s => s.id !== id));

  const handleAddEmployee = (newEmp: Omit<Employee, 'id'>) => setEmployees(prev => [...prev, { ...newEmp, id: Date.now().toString() }]);
  const handleUpdateEmployee = async (id: string, emp: Employee) => setEmployees(prev => prev.map(e => e.id === id ? emp : e));
  const handleDeleteEmployee = (id: string) => setEmployees(prev => prev.filter(e => e.id !== id));

  const handleAddProcessType = (proc: { name: string, rate: number }) => setProcessTypes(prev => [...prev, { ...proc, id: Date.now().toString() }]);
  const handleUpdateProcessType = (id: string, proc: { name: string, rate: number }) => setProcessTypes(prev => prev.map(p => p.id === id ? { ...p, ...proc } : p));
  const handleDeleteProcessType = (id: string) => setProcessTypes(prev => prev.filter(p => p.id !== id));

  const handleAddPurchaseOrder = (order: PurchaseOrder) => {
      setPurchaseOrders(prev => [...prev, { ...order, id: Date.now().toString() }]);
      setPoNumberConfig(prev => ({ ...prev, nextNumber: prev.nextNumber + 1 }));
  };
  const handleUpdatePurchaseOrder = (poNumber: string, updated: PurchaseOrder) => setPurchaseOrders(prev => prev.map(p => p.poNumber === poNumber ? updated : p));
  const handleDeletePurchaseOrder = (poNumber: string) => setPurchaseOrders(prev => prev.filter(p => p.poNumber !== poNumber));

  const handleAddDeliveryChallan = async (dc: Omit<DeliveryChallan, 'id'>) => {
      setDeliveryChallans(prev => [...prev, { ...dc, id: Date.now().toString() }]);
      setDcNumberConfig(prev => ({ ...prev, nextNumber: prev.nextNumber + 1 }));
  };
  const handleUpdateDeliveryChallan = async (id: string, dc: DeliveryChallan) => setDeliveryChallans(prev => prev.map(d => d.id === id ? dc : d));
  const handleDeleteDeliveryChallan = (id: string) => setDeliveryChallans(prev => prev.filter(d => d.id !== id));

  const handleAddInvoice = (inv: Omit<Invoice, 'id'>) => {
      setInvoices(prev => [...prev, { ...inv, id: Date.now().toString() }]);
      if (invoiceNumberConfig.mode === 'auto') setInvoiceNumberConfig(prev => ({ ...prev, nextNumber: prev.nextNumber + 1 }));
  };
  
  const handleDeleteInvoice = async (id: string) => {
      try {
          const { error } = await supabase.from('invoices').delete().eq('id', id);
          if (error) throw error;
          setInvoices(prev => prev.filter(i => i.id !== id));
      } catch (error: any) {
          console.error("Error deleting invoice:", error);
          alert("Failed to delete invoice: " + error.message);
      }
  };

  const handleAddPaymentReceived = (pr: Omit<PaymentReceived, 'id'>) => setPaymentsReceived(prev => [...prev, { ...pr, id: Date.now().toString() }]);
  const handleUpdatePaymentReceived = (pr: PaymentReceived) => setPaymentsReceived(prev => prev.map(p => p.id === pr.id ? pr : p));
  const handleDeletePaymentReceived = (id: string) => setPaymentsReceived(prev => prev.filter(p => p.id !== id));

  const handleSaveAttendance = async (records: Omit<AttendanceRecord, 'id'>[]) => {
      setAttendanceRecords(prev => {
          // Merge logic simplified: remove old records for same emp/date, add new
          const newRecords = [...prev];
          records.forEach(rec => {
             const idx = newRecords.findIndex(r => r.employee_id === rec.employee_id && r.date === rec.date);
             if (idx >= 0) {
                 newRecords[idx] = { ...rec, id: newRecords[idx].id };
             } else {
                 newRecords.push({ ...rec, id: Date.now().toString() + Math.random() });
             }
          });
          return newRecords;
      });
  };

  const handleAddAdvance = async (adv: Omit<EmployeeAdvance, 'id'>) => setAdvances(prev => [...prev, { ...adv, id: Date.now().toString() }]);
  const handleUpdateAdvance = async (adv: EmployeeAdvance) => setAdvances(prev => prev.map(a => a.id === adv.id ? adv : a));
  const handleDeleteAdvance = (id: string) => setAdvances(prev => prev.filter(a => a.id !== id));

  const handleAddOtherExpense = async (exp: Omit<OtherExpense, 'id'>) => setOtherExpenses(prev => [...prev, { ...exp, id: Date.now().toString() }]);
  const handleUpdateOtherExpense = async (exp: OtherExpense) => setOtherExpenses(prev => prev.map(e => e.id === exp.id ? exp : e));
  const handleDeleteOtherExpense = (id: string) => setOtherExpenses(prev => prev.filter(e => e.id !== id));

  const handleAddTimberExpense = async (exp: Omit<TimberExpense, 'id'>) => setTimberExpenses(prev => [...prev, { ...exp, id: Date.now().toString() }]);
  const handleUpdateTimberExpense = async (exp: TimberExpense) => setTimberExpenses(prev => prev.map(e => e.id === exp.id ? exp : e));
  const handleDeleteTimberExpense = (id: string) => setTimberExpenses(prev => prev.filter(e => e.id !== id));

  const handleAddSupplierPayment = async (pay: Omit<SupplierPayment, 'id'>) => {
      setSupplierPayments(prev => [...prev, { ...pay, id: Date.now().toString() }]);
      setSupplierPaymentConfig(prev => ({ ...prev, nextNumber: prev.nextNumber + 1 }));
  };

  const handleSavePayslip = async (payslip: Omit<Payslip, 'id'>) => setPayslips(prev => [...prev, { ...payslip, id: Date.now().toString() }]);
  
  const handleAddMasterItem = async (item: { name: string, rate: number }): Promise<MasterItem> => {
      const newItem = { ...item, id: Date.now().toString() };
      setMasterItems(prev => [...prev, newItem]);
      return newItem;
  };

  const handleAddExpenseCategory = async (name: string): Promise<ExpenseCategory> => {
      const newCat = { id: Date.now().toString(), name };
      setExpenseCategories(prev => [...prev, newCat]);
      return newCat;
  };
  
  const handleAddBankName = (name: string) => setBankNames(prev => [...prev, name]);

  // Configuration Persistence Handlers
  const handleUpdatePoConfig = async (newConfig: PONumberConfig) => {
      try {
          const { error } = await supabase.from('numbering_configs').upsert({ 
              id: 'po', 
              prefix: newConfig.prefix, 
              next_number: newConfig.nextNumber 
          });
          if (error) throw error;
          setPoNumberConfig(newConfig);
      } catch (error: any) {
          console.error("Error updating PO config:", error);
          alert("Failed to save PO settings.");
      }
  };

  const handleUpdateDcConfig = async (newConfig: DeliveryChallanNumberConfig) => {
      try {
          const { error } = await supabase.from('numbering_configs').upsert({ 
              id: 'delivery_challan', // Correct ID per schema
              prefix: newConfig.prefix, 
              next_number: newConfig.nextNumber 
          });
          if (error) throw error;
          setDcNumberConfig(newConfig);
      } catch (error: any) {
          console.error("Error updating DC config:", error);
          alert("Failed to save Delivery Challan settings.");
      }
  };

  const handleUpdateInvConfig = async (newConfig: InvoiceNumberConfig) => {
      try {
          const { error } = await supabase.from('numbering_configs').upsert({ 
              id: 'invoice', 
              prefix: newConfig.prefix, 
              next_number: newConfig.nextNumber, 
              mode: newConfig.mode 
          });
          if (error) throw error;
          setInvoiceNumberConfig(newConfig);
      } catch (error: any) {
          console.error("Error updating Invoice config:", error);
          alert("Failed to save Invoice settings.");
      }
  };

  // Render content based on activeScreen
  const renderContent = () => {
    switch (activeScreen) {
      case 'Dashboard': return <DashboardScreen invoices={invoices} paymentsReceived={paymentsReceived} deliveryChallans={deliveryChallans} purchaseOrders={purchaseOrders} otherExpenses={otherExpenses} advances={advances} />;
      case 'Expenses': return <PurchaseOrderScreen
          purchaseOrders={purchaseOrders} onAddOrder={handleAddPurchaseOrder} onUpdateOrder={handleUpdatePurchaseOrder} onDeleteOrder={handleDeletePurchaseOrder}
          purchaseShops={purchaseShops} onAddPurchaseShop={handleAddPurchaseShop}
          bankNames={bankNames} onAddBankName={handleAddBankName}
          poNumberConfig={poNumberConfig}
          masterItems={masterItems} onAddMasterItem={handleAddMasterItem}
          advances={advances} employees={employees} onAddAdvance={handleAddAdvance} onUpdateAdvance={handleUpdateAdvance} onDeleteAdvance={handleDeleteAdvance}
          otherExpenses={otherExpenses} onAddOtherExpense={handleAddOtherExpense} onUpdateOtherExpense={handleUpdateOtherExpense} onDeleteOtherExpense={handleDeleteOtherExpense}
          expenseCategories={expenseCategories} onAddExpenseCategory={handleAddExpenseCategory}
          timberExpenses={timberExpenses} onAddTimberExpense={handleAddTimberExpense} onUpdateTimberExpense={handleUpdateTimberExpense} onDeleteTimberExpense={handleDeleteTimberExpense}
          supplierPayments={supplierPayments} supplierPaymentConfig={supplierPaymentConfig} onAddSupplierPayment={handleAddSupplierPayment}
        />;
      case 'Delivery Challans': return <DeliveryChallanScreen
          deliveryChallans={deliveryChallans} onAddChallan={handleAddDeliveryChallan} onUpdateChallan={handleUpdateDeliveryChallan} onDeleteChallan={handleDeleteDeliveryChallan}
          clients={clients} onAddClient={handleAddClient}
          purchaseShops={purchaseShops} onAddPurchaseShop={handleAddPurchaseShop}
          processTypes={processTypes} onAddProcessType={handleAddProcessType}
          deliveryChallanNumberConfig={dcNumberConfig} invoices={invoices} onDeleteInvoice={handleDeleteInvoice}
          companyDetails={companyDetails} employees={employees} onAddEmployee={handleAddEmployee}
        />;
      case 'Invoices': return <InvoicesScreen clients={clients} deliveryChallans={deliveryChallans} processTypes={processTypes} onAddInvoice={handleAddInvoice} invoiceNumberConfig={invoiceNumberConfig} invoices={invoices} companyDetails={companyDetails} />;
      case 'Payment Received': return <PaymentReceivedScreen payments={paymentsReceived} onAddPayment={handleAddPaymentReceived} onUpdatePayment={handleUpdatePaymentReceived} onDeletePayment={handleDeletePaymentReceived} clients={clients} onAddClient={handleAddClient} />;
      case 'Attendance': return <AttendanceScreen employees={employees} attendanceRecords={attendanceRecords} onSave={handleSaveAttendance} />;
      case 'Salary & Payslips': return <SalaryScreen employees={employees} attendanceRecords={attendanceRecords} onUpdateEmployee={handleUpdateEmployee} advances={advances} onSavePayslip={handleSavePayslip} companyDetails={companyDetails} payslips={payslips} />;
      case 'Add Client': return <ShopMasterScreen clients={clients} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} processTypes={processTypes} onAddProcessType={handleAddProcessType} />;
      case 'Add Purchase Shop': return <PurchaseShopMasterScreen shops={purchaseShops} onAddShop={handleAddPurchaseShop} onUpdateShop={handleUpdatePurchaseShop} onDeleteShop={handleDeletePurchaseShop} />;
      case 'Add Employee': return <EmployeeMasterScreen employees={employees} onAddEmployee={handleAddEmployee} onUpdateEmployee={handleUpdateEmployee} onDeleteEmployee={handleDeleteEmployee} />;
      case 'Add Process': return <PartyDCProcessMasterScreen processTypes={processTypes} onAddProcessType={handleAddProcessType} onUpdateProcessType={handleUpdateProcessType} onDeleteProcessType={handleDeleteProcessType} />;
      case 'Settings': return <SettingsScreen poConfig={poNumberConfig} onUpdatePoConfig={handleUpdatePoConfig} dcConfig={dcNumberConfig} onUpdateDcConfig={handleUpdateDcConfig} invConfig={invoiceNumberConfig} onUpdateInvConfig={handleUpdateInvConfig} />;
      case 'User Admin': return <UserAdminScreen companyDetails={companyDetails} onUpdate={setCompanyDetails} />;
      case 'New Screen': return <ProductsScreen clients={clients} onAddClient={handleAddClient} processTypes={processTypes} onAddProcessType={handleAddProcessType} />;
      case 'New Client Screen': return <NewClientScreen clients={clients} onAddClient={handleAddClient} processTypes={processTypes} onAddProcessType={handleAddProcessType} setActiveScreen={setActiveScreen} />;
      case 'New Party Screen': return <NewPartyScreen shops={purchaseShops} onAddShop={handleAddPurchaseShop} setActiveScreen={setActiveScreen} />;
      default: return <DashboardScreen invoices={invoices} paymentsReceived={paymentsReceived} deliveryChallans={deliveryChallans} purchaseOrders={purchaseOrders} otherExpenses={otherExpenses} advances={advances} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
