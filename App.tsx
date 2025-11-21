
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
            let query: any = supabase.from(table).select('*');
            
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

  const handleAddPurchaseShop = async (newShop: Omit<PurchaseShop, 'id'>) => {
      try {
          const { data, error } = await supabase.from('purchase_shops').insert([{
              name: newShop.name,
              phone: newShop.phone,
              email: newShop.email,
              address: newShop.address,
              city: newShop.city,
              state: newShop.state,
              pincode: newShop.pincode,
              gst_no: newShop.gstNo,
              pan_no: newShop.panNo,
              payment_terms: newShop.paymentTerms,
          }]).select().single();

          if (error) throw error;
          
          const shop: PurchaseShop = {
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
              paymentTerms: data.payment_terms
          };
          setPurchaseShops(prev => [...prev, shop]);
      } catch (error: any) {
          console.error("Error adding shop:", error);
          alert("Failed to add shop: " + error.message);
      }
  };

  const handleUpdatePurchaseShop = async (updatedShop: PurchaseShop) => {
      try {
          const { error } = await supabase.from('purchase_shops').update({
              name: updatedShop.name,
              phone: updatedShop.phone,
              email: updatedShop.email,
              address: updatedShop.address,
              city: updatedShop.city,
              state: updatedShop.state,
              pincode: updatedShop.pincode,
              gst_no: updatedShop.gstNo,
              pan_no: updatedShop.panNo,
              payment_terms: updatedShop.paymentTerms,
          }).eq('id', updatedShop.id);

          if (error) throw error;
          setPurchaseShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
      } catch (error: any) {
          console.error("Error updating shop:", error);
          alert("Failed to update shop: " + error.message);
      }
  };

  const handleDeletePurchaseShop = async (id: string) => {
      try {
          const { error } = await supabase.from('purchase_shops').delete().eq('id', id);
          if (error) throw error;
          setPurchaseShops(prev => prev.filter(s => s.id !== id));
      } catch (error: any) {
          console.error("Error deleting shop:", error);
          alert("Failed to delete shop: " + error.message);
      }
  };

  const handleAddEmployee = async (newEmp: Omit<Employee, 'id'>) => {
      try {
          const { data, error } = await supabase.from('employees').insert([{
              name: newEmp.name,
              designation: newEmp.designation,
              phone: newEmp.phone,
              daily_wage: newEmp.dailyWage,
              rate_per_meter: newEmp.ratePerMeter
          }]).select().single();

          if (error) throw error;
          
          setEmployees(prev => [...prev, {
              id: data.id,
              name: data.name,
              designation: data.designation,
              phone: data.phone,
              dailyWage: Number(data.daily_wage),
              ratePerMeter: Number(data.rate_per_meter)
          }]);
      } catch (error: any) {
          console.error("Error adding employee:", error);
          alert("Failed to add employee: " + error.message);
      }
  };

  const handleUpdateEmployee = async (id: string, emp: Employee) => {
      try {
          const { error } = await supabase.from('employees').update({
              name: emp.name,
              designation: emp.designation,
              phone: emp.phone,
              daily_wage: emp.dailyWage,
              rate_per_meter: emp.ratePerMeter
          }).eq('id', id);

          if (error) throw error;
          setEmployees(prev => prev.map(e => e.id === id ? emp : e));
      } catch (error: any) {
          console.error("Error updating employee:", error);
          alert("Failed to update employee: " + error.message);
      }
  };

  const handleDeleteEmployee = async (id: string) => {
      try {
          const { error } = await supabase.from('employees').delete().eq('id', id);
          if (error) throw error;
          setEmployees(prev => prev.filter(e => e.id !== id));
      } catch (error: any) {
          console.error("Error deleting employee:", error);
          alert("Failed to delete employee: " + error.message);
      }
  };

  const handleAddProcessType = async (proc: { name: string, rate: number }) => {
      try {
          const { data, error } = await supabase.from('process_types').insert([proc]).select().single();
          if (error) throw error;
          setProcessTypes(prev => [...prev, { ...proc, id: data.id }]);
      } catch (error: any) {
          console.error("Error adding process type:", error);
          alert("Failed to add process type: " + error.message);
      }
  };

  const handleUpdateProcessType = async (id: string, proc: { name: string, rate: number }) => {
      try {
          const { error } = await supabase.from('process_types').update(proc).eq('id', id);
          if (error) throw error;
          setProcessTypes(prev => prev.map(p => p.id === id ? { ...p, ...proc } : p));
      } catch (error: any) {
          console.error("Error updating process type:", error);
          alert("Failed to update process type: " + error.message);
      }
  };

  const handleDeleteProcessType = async (id: string) => {
      try {
          const { error } = await supabase.from('process_types').delete().eq('id', id);
          if (error) throw error;
          setProcessTypes(prev => prev.filter(p => p.id !== id));
      } catch (error: any) {
          console.error("Error deleting process type:", error);
          alert("Failed to delete process type: " + error.message);
      }
  };

  const handleAddPurchaseOrder = async (order: PurchaseOrder) => {
      try {
          // 1. Insert PO
          const { data: poData, error: poError } = await supabase.from('purchase_orders').insert([{
              po_number: order.poNumber,
              po_date: order.poDate,
              shop_name: order.shopName,
              total_amount: order.totalAmount,
              gst_no: order.gstNo,
              payment_mode: order.paymentMode,
              status: order.status,
              payment_terms: order.paymentTerms,
              reference_id: order.referenceId,
              bank_name: order.bankName,
              cheque_date: order.chequeDate
          }]).select().single();

          if (poError) throw poError;

          // 2. Insert items
          if (order.items.length > 0) {
              const itemsPayload = order.items.map(item => ({
                  purchase_order_id: poData.id,
                  name: item.name,
                  quantity: item.quantity,
                  rate: item.rate,
                  amount: item.amount
              }));
              const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsPayload);
              if (itemsError) throw itemsError;
          }

          // 3. Update config
          await handleUpdatePoConfig({ ...poNumberConfig, nextNumber: poNumberConfig.nextNumber + 1 });

          // 4. Update Local State (re-fetching is safer but for speed we construct)
          // For simplicity we trigger a reload or just add it. Ideally, fetch the full object back with items.
          const { data: fullOrder, error: fetchError } = await supabase.from('purchase_orders').select('*, purchase_order_items(*)').eq('id', poData.id).single();
          if (!fetchError && fullOrder) {
               setPurchaseOrders(prev => [...prev, {
                    id: fullOrder.id,
                    poNumber: fullOrder.po_number,
                    poDate: fullOrder.po_date,
                    shopName: fullOrder.shop_name || '',
                    items: (fullOrder.purchase_order_items || []).map((i: any) => ({
                        id: i.id,
                        name: i.name,
                        quantity: Number(i.quantity) || 0,
                        rate: Number(i.rate) || 0,
                        amount: Number(i.amount) || 0
                    })),
                    totalAmount: Number(fullOrder.total_amount) || 0,
                    gstNo: fullOrder.gst_no || '',
                    paymentMode: fullOrder.payment_mode as PaymentMode,
                    status: fullOrder.status as OrderStatus,
                    paymentTerms: fullOrder.payment_terms,
                    referenceId: fullOrder.reference_id,
                    bankName: fullOrder.bank_name,
                    chequeDate: fullOrder.cheque_date
               }]);
          }

      } catch (error: any) {
          console.error("Error adding PO:", error);
          alert("Failed to add Purchase Order: " + error.message);
      }
  };

  const handleUpdatePurchaseOrder = async (poNumber: string, updated: PurchaseOrder) => {
      try {
          const { data: poData, error: poError } = await supabase.from('purchase_orders').update({
              po_date: updated.poDate,
              shop_name: updated.shopName,
              total_amount: updated.totalAmount,
              gst_no: updated.gstNo,
              payment_mode: updated.paymentMode,
              status: updated.status,
              payment_terms: updated.paymentTerms,
              reference_id: updated.referenceId,
              bank_name: updated.bankName,
              cheque_date: updated.chequeDate
          }).eq('po_number', poNumber).select().single();

          if (poError) throw poError;

          // Delete old items
          await supabase.from('purchase_order_items').delete().eq('purchase_order_id', poData.id);

          // Insert new items
          if (updated.items.length > 0) {
              const itemsPayload = updated.items.map(item => ({
                  purchase_order_id: poData.id,
                  name: item.name,
                  quantity: item.quantity,
                  rate: item.rate,
                  amount: item.amount
              }));
              await supabase.from('purchase_order_items').insert(itemsPayload);
          }

          // Refresh local state
          setPurchaseOrders(prev => prev.map(p => p.poNumber === poNumber ? updated : p));

      } catch (error: any) {
          console.error("Error updating PO:", error);
          alert("Failed to update Purchase Order: " + error.message);
      }
  };

  const handleDeletePurchaseOrder = async (poNumber: string) => {
      try {
          // Cascade delete should handle items if configured, otherwise manual delete items first
          const { error } = await supabase.from('purchase_orders').delete().eq('po_number', poNumber);
          if (error) throw error;
          setPurchaseOrders(prev => prev.filter(p => p.poNumber !== poNumber));
      } catch (error: any) {
          console.error("Error deleting PO:", error);
          alert("Failed to delete Purchase Order: " + error.message);
      }
  };

  const handleAddDeliveryChallan = async (dc: Omit<DeliveryChallan, 'id'>) => {
      try {
          // Prepare payload for Supabase
          const payload = {
              challan_number: dc.challanNumber,
              date: dc.date,
              party_name: dc.partyName,
              party_dc_no: dc.partyDCNo,
              process: JSON.stringify(dc.process), // Convert string array to JSON string
              design_no: dc.designNo,
              pcs: dc.pcs,
              mtr: dc.mtr,
              width: dc.width,
              shrinkage: dc.shrinkage,
              pin: dc.pin,
              pick: dc.pick,
              extra_work: dc.extraWork,
              status: dc.status,
              worker_name: dc.workerName,
              working_unit: dc.workingUnit,
              is_outsourcing: dc.isOutsourcing,
              dc_image: JSON.stringify(dc.dcImage), // Convert string array to JSON string
              sample_image: JSON.stringify(dc.sampleImage) // Convert string array to JSON string
          };

          const { data, error } = await supabase.from('delivery_challans').insert([payload]).select().single();

          if (error) throw error;

          if (data) {
              // Convert back to App model
              let dcImages: string[] = [];
              try { dcImages = data.dc_image ? JSON.parse(data.dc_image) : []; } catch { dcImages = []; }
              
              let sampleImages: string[] = [];
              try { sampleImages = data.sample_image ? JSON.parse(data.sample_image) : []; } catch { sampleImages = []; }

              let processes: string[] = [];
              try { processes = data.process ? JSON.parse(data.process) : []; } catch { processes = []; }

              const newChallan: DeliveryChallan = {
                  id: data.id,
                  challanNumber: data.challan_number,
                  date: data.date,
                  partyName: data.party_name,
                  partyDCNo: data.party_dc_no || '',
                  process: processes,
                  designNo: data.design_no || '',
                  pcs: Number(data.pcs) || 0,
                  mtr: Number(data.mtr) || 0,
                  width: Number(data.width) || 0,
                  shrinkage: data.shrinkage || '',
                  pin: data.pin || '',
                  pick: data.pick || '',
                  extraWork: data.extra_work || '',
                  status: data.status || '',
                  workerName: data.worker_name,
                  workingUnit: data.working_unit,
                  isOutsourcing: data.is_outsourcing || false,
                  dcImage: dcImages,
                  sampleImage: sampleImages
              };

              setDeliveryChallans(prev => [...prev, newChallan]);
              
              // Update configuration
              await handleUpdateDcConfig({ ...dcNumberConfig, nextNumber: dcNumberConfig.nextNumber + 1 });
          }
      } catch (error: any) {
          console.error("Error adding delivery challan:", error);
          alert("Failed to add delivery challan: " + error.message);
      }
  };

  const handleUpdateDeliveryChallan = async (id: string, dc: DeliveryChallan) => {
      try {
          const payload = {
              challan_number: dc.challanNumber,
              date: dc.date,
              party_name: dc.partyName,
              party_dc_no: dc.partyDCNo,
              process: JSON.stringify(dc.process),
              design_no: dc.designNo,
              pcs: dc.pcs,
              mtr: dc.mtr,
              width: dc.width,
              shrinkage: dc.shrinkage,
              pin: dc.pin,
              pick: dc.pick,
              extra_work: dc.extraWork,
              status: dc.status,
              worker_name: dc.workerName,
              working_unit: dc.workingUnit,
              is_outsourcing: dc.isOutsourcing,
              dc_image: JSON.stringify(dc.dcImage),
              sample_image: JSON.stringify(dc.sampleImage)
          };

          const { error } = await supabase.from('delivery_challans').update(payload).eq('id', id);
          if (error) throw error;

          setDeliveryChallans(prev => prev.map(d => d.id === id ? dc : d));
      } catch (error: any) {
          console.error("Error updating delivery challan:", error);
          alert("Failed to update delivery challan: " + error.message);
      }
  };

  const handleDeleteDeliveryChallan = async (id: string) => {
      try {
          const { error } = await supabase.from('delivery_challans').delete().eq('id', id);
          if (error) throw error;
          setDeliveryChallans(prev => prev.filter(d => d.id !== id));
      } catch (error: any) {
          console.error("Error deleting delivery challan:", error);
          alert("Failed to delete delivery challan: " + error.message);
      }
  };

  const handleAddInvoice = async (inv: Omit<Invoice, 'id'>) => {
      try {
          // 1. Insert Invoice
          const { data: invData, error: invError } = await supabase.from('invoices').insert([{
              invoice_number: inv.invoiceNumber,
              invoice_date: inv.invoiceDate,
              client_name: inv.clientName,
              sub_total: inv.subTotal,
              total_cgst: inv.totalCgst,
              total_sgst: inv.totalSgst,
              total_tax_amount: inv.totalTaxAmount,
              rounded_off: inv.roundedOff,
              total_amount: inv.totalAmount
          }]).select().single();

          if (invError) throw invError;

          // 2. Insert Items
          if (inv.items.length > 0) {
              const itemsPayload = inv.items.map(item => ({
                  invoice_id: invData.id,
                  challan_number: item.challanNumber,
                  challan_date: item.challanDate ? item.challanDate : null,
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
              const { error: itemsError } = await supabase.from('invoice_items').insert(itemsPayload);
              if (itemsError) throw itemsError;
          }

          // 3. Update State
          const newInvoice = { ...inv, id: invData.id };
          setInvoices(prev => [...prev, newInvoice]);

          // 4. Update Challan Status to 'Rework'
          const challanNumbersToUpdate = inv.items.flatMap(item => 
              item.challanNumber.split(',').map(s => s.trim())
          ).filter(s => s);

          if (challanNumbersToUpdate.length > 0) {
              const { error: statusError } = await supabase
                  .from('delivery_challans')
                  .update({ status: 'Rework' })
                  .in('challan_number', challanNumbersToUpdate);
              
              if (statusError) throw statusError;

              setDeliveryChallans(prev => prev.map(dc => 
                  challanNumbersToUpdate.includes(dc.challanNumber) 
                      ? { ...dc, status: 'Rework' } 
                      : dc
              ));
          }

          // 5. Update Config
          if (invoiceNumberConfig.mode === 'auto') {
              await handleUpdateInvConfig({ ...invoiceNumberConfig, nextNumber: invoiceNumberConfig.nextNumber + 1 });
          }

      } catch (error: any) {
          console.error("Error adding invoice:", error);
          alert("Failed to add invoice: " + error.message);
      }
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

  const handleAddPaymentReceived = async (pr: Omit<PaymentReceived, 'id'>) => {
      try {
          const { data, error } = await supabase.from('payments_received').insert([{
              client_name: pr.clientName,
              payment_date: pr.paymentDate,
              amount: pr.amount,
              payment_mode: pr.paymentMode,
              reference_number: pr.referenceNumber,
              notes: pr.notes
          }]).select().single();

          if (error) throw error;
          setPaymentsReceived(prev => [...prev, { ...pr, id: data.id }]);
      } catch (error: any) {
          console.error("Error adding payment:", error);
          alert("Failed to add payment: " + error.message);
      }
  };

  const handleUpdatePaymentReceived = async (pr: PaymentReceived) => {
      try {
          const { error } = await supabase.from('payments_received').update({
              client_name: pr.clientName,
              payment_date: pr.paymentDate,
              amount: pr.amount,
              payment_mode: pr.paymentMode,
              reference_number: pr.referenceNumber,
              notes: pr.notes
          }).eq('id', pr.id);

          if (error) throw error;
          setPaymentsReceived(prev => prev.map(p => p.id === pr.id ? pr : p));
      } catch (error: any) {
          console.error("Error updating payment:", error);
          alert("Failed to update payment: " + error.message);
      }
  };

  const handleDeletePaymentReceived = async (id: string) => {
      try {
          const { error } = await supabase.from('payments_received').delete().eq('id', id);
          if (error) throw error;
          setPaymentsReceived(prev => prev.filter(p => p.id !== id));
      } catch (error: any) {
          console.error("Error deleting payment:", error);
          alert("Failed to delete payment: " + error.message);
      }
  };

  const handleSaveAttendance = async (records: Omit<AttendanceRecord, 'id'>[]) => {
      try {
          const upsertData = records.map(rec => ({
              employee_id: rec.employee_id,
              date: rec.date,
              morning_status: rec.morningStatus,
              evening_status: rec.eveningStatus,
              morning_overtime_hours: rec.morningOvertimeHours,
              evening_overtime_hours: rec.eveningOvertimeHours,
              meters_produced: rec.metersProduced,
              updated_at: new Date().toISOString()
          }));

          const { error } = await supabase.from('attendance').upsert(upsertData, { onConflict: 'employee_id,date' });
          if (error) throw error;

          // Refetch specifically this month's attendance or just update local state approximately
          // Ideally, re-fetch from DB to get IDs and exact timestamps
          // For now, we can do a simple merge in state if needed, or just let the next reload handle it.
          // Let's do a quick optimistic update or a re-fetch. A re-fetch of the whole table might be heavy.
          // Let's just update local state for immediate feedback.
          setAttendanceRecords(prev => {
              const newRecords = [...prev];
              records.forEach(rec => {
                 const idx = newRecords.findIndex(r => r.employee_id === rec.employee_id && r.date === rec.date);
                 if (idx >= 0) {
                     newRecords[idx] = { ...newRecords[idx], ...rec };
                 } else {
                     newRecords.push({ ...rec, id: `temp-${Date.now()}-${Math.random()}` });
                 }
              });
              return newRecords;
          });

      } catch (error: any) {
          console.error("Error saving attendance:", error);
          alert("Failed to save attendance: " + error.message);
      }
  };

  const handleAddAdvance = async (adv: Omit<EmployeeAdvance, 'id'>) => {
      try {
          const { data, error } = await supabase.from('employee_advances').insert([{
              employee_id: adv.employeeId,
              date: adv.date,
              amount: adv.amount,
              paid_amount: adv.paidAmount,
              notes: adv.notes
          }]).select().single();

          if (error) throw error;
          setAdvances(prev => [...prev, { ...adv, id: data.id }]);
      } catch (error: any) {
          console.error("Error adding advance:", error);
          alert("Failed to add advance: " + error.message);
      }
  };

  const handleUpdateAdvance = async (adv: EmployeeAdvance) => {
      try {
          const { error } = await supabase.from('employee_advances').update({
              employee_id: adv.employeeId,
              date: adv.date,
              amount: adv.amount,
              paid_amount: adv.paidAmount,
              notes: adv.notes
          }).eq('id', adv.id);

          if (error) throw error;
          setAdvances(prev => prev.map(a => a.id === adv.id ? adv : a));
      } catch (error: any) {
          console.error("Error updating advance:", error);
          alert("Failed to update advance: " + error.message);
      }
  };

  const handleDeleteAdvance = async (id: string) => {
      try {
          const { error } = await supabase.from('employee_advances').delete().eq('id', id);
          if (error) throw error;
          setAdvances(prev => prev.filter(a => a.id !== id));
      } catch (error: any) {
          console.error("Error deleting advance:", error);
          alert("Failed to delete advance: " + error.message);
      }
  };

  const handleAddOtherExpense = async (exp: Omit<OtherExpense, 'id'>) => {
      try {
          const { data, error } = await supabase.from('other_expenses').insert([{
              date: exp.date,
              item_name: exp.itemName,
              amount: exp.amount,
              notes: exp.notes,
              payment_mode: exp.paymentMode,
              payment_status: exp.paymentStatus,
              payment_terms: exp.paymentTerms,
              bank_name: exp.bankName,
              cheque_date: exp.chequeDate
          }]).select().single();

          if (error) throw error;
          setOtherExpenses(prev => [...prev, { ...exp, id: data.id }]);
      } catch (error: any) {
          console.error("Error adding expense:", error);
          alert("Failed to add expense: " + error.message);
      }
  };

  const handleUpdateOtherExpense = async (exp: OtherExpense) => {
      try {
          const { error } = await supabase.from('other_expenses').update({
              date: exp.date,
              item_name: exp.itemName,
              amount: exp.amount,
              notes: exp.notes,
              payment_mode: exp.paymentMode,
              payment_status: exp.paymentStatus,
              payment_terms: exp.paymentTerms,
              bank_name: exp.bankName,
              cheque_date: exp.chequeDate
          }).eq('id', exp.id);

          if (error) throw error;
          setOtherExpenses(prev => prev.map(e => e.id === exp.id ? exp : e));
      } catch (error: any) {
          console.error("Error updating expense:", error);
          alert("Failed to update expense: " + error.message);
      }
  };

  const handleDeleteOtherExpense = async (id: string) => {
      try {
          const { error } = await supabase.from('other_expenses').delete().eq('id', id);
          if (error) throw error;
          setOtherExpenses(prev => prev.filter(e => e.id !== id));
      } catch (error: any) {
          console.error("Error deleting expense:", error);
          alert("Failed to delete expense: " + error.message);
      }
  };

  const handleAddTimberExpense = async (exp: Omit<TimberExpense, 'id'>) => {
      try {
          const { data, error } = await supabase.from('timber_expenses').insert([{
              date: exp.date,
              supplier_name: exp.supplierName,
              load_weight: exp.loadWeight,
              vehicle_weight: exp.vehicleWeight,
              cft: exp.cft,
              rate: exp.rate,
              amount: exp.amount,
              notes: exp.notes,
              payment_mode: exp.paymentMode,
              payment_status: exp.paymentStatus,
              payment_terms: exp.paymentTerms,
              bank_name: exp.bankName,
              cheque_date: exp.chequeDate
          }]).select().single();

          if (error) throw error;
          setTimberExpenses(prev => [...prev, { ...exp, id: data.id }]);
      } catch (error: any) {
          console.error("Error adding timber expense:", error);
          alert("Failed to add timber expense: " + error.message);
      }
  };

  const handleUpdateTimberExpense = async (exp: TimberExpense) => {
      try {
          const { error } = await supabase.from('timber_expenses').update({
              date: exp.date,
              supplier_name: exp.supplierName,
              load_weight: exp.loadWeight,
              vehicle_weight: exp.vehicleWeight,
              cft: exp.cft,
              rate: exp.rate,
              amount: exp.amount,
              notes: exp.notes,
              payment_mode: exp.paymentMode,
              payment_status: exp.paymentStatus,
              payment_terms: exp.paymentTerms,
              bank_name: exp.bankName,
              cheque_date: exp.chequeDate
          }).eq('id', exp.id);

          if (error) throw error;
          setTimberExpenses(prev => prev.map(e => e.id === exp.id ? exp : e));
      } catch (error: any) {
          console.error("Error updating timber expense:", error);
          alert("Failed to update timber expense: " + error.message);
      }
  };

  const handleDeleteTimberExpense = async (id: string) => {
      try {
          const { error } = await supabase.from('timber_expenses').delete().eq('id', id);
          if (error) throw error;
          setTimberExpenses(prev => prev.filter(e => e.id !== id));
      } catch (error: any) {
          console.error("Error deleting timber expense:", error);
          alert("Failed to delete timber expense: " + error.message);
      }
  };

  const handleAddSupplierPayment = async (pay: Omit<SupplierPayment, 'id'>) => {
      try {
          const { data, error } = await supabase.from('supplier_payments').insert([{
              payment_number: pay.paymentNumber,
              date: pay.date,
              supplier_name: pay.supplierName,
              amount: pay.amount,
              payment_mode: pay.paymentMode,
              reference_id: pay.referenceId,
              image: pay.image
          }]).select().single();

          if (error) throw error;
          setSupplierPayments(prev => [...prev, { ...pay, id: data.id }]);
          await handleUpdatePoConfig({ ...poNumberConfig, nextNumber: supplierPaymentConfig.nextNumber + 1 }); // Assumed helper reused or need specific one
          // Actually for SupplierPaymentConfig
          // We need a specific handler or reuse generic upserter
          const { error: confError } = await supabase.from('numbering_configs').upsert({ id: 'supplier_payment', prefix: supplierPaymentConfig.prefix, next_number: supplierPaymentConfig.nextNumber + 1 });
          if(!confError) setSupplierPaymentConfig(prev => ({...prev, nextNumber: prev.nextNumber + 1}));

      } catch (error: any) {
          console.error("Error adding supplier payment:", error);
          alert("Failed to add supplier payment: " + error.message);
      }
  };

  const handleSavePayslip = async (payslip: Omit<Payslip, 'id'>) => {
      try {
          const { data, error } = await supabase.from('payslips').insert([{
              employee_id: payslip.employeeId,
              employee_name: payslip.employeeName,
              payslip_date: payslip.payslipDate,
              pay_period_start: payslip.payPeriodStart,
              pay_period_end: payslip.payPeriodEnd,
              total_working_days: payslip.totalWorkingDays,
              ot_hours: payslip.otHours,
              wage_earnings: payslip.wageEarnings,
              production_earnings: payslip.productionEarnings,
              gross_salary: payslip.grossSalary,
              advance_deduction: payslip.advanceDeduction,
              net_salary: payslip.netSalary,
              total_outstanding_advance: payslip.totalOutstandingAdvance
          }]).select().single();

          if (error) throw error;
          setPayslips(prev => [...prev, { ...payslip, id: data.id }]);
      } catch (error: any) {
          console.error("Error saving payslip:", error);
          alert("Failed to save payslip: " + error.message);
      }
  };
  
  const handleAddMasterItem = async (item: { name: string, rate: number }): Promise<MasterItem> => {
      try {
          const { data, error } = await supabase.from('master_items').insert([item]).select().single();
          if (error) throw error;
          const newItem = { ...item, id: data.id };
          setMasterItems(prev => [...prev, newItem]);
          return newItem;
      } catch (error: any) {
          console.error("Error adding master item:", error);
          alert("Failed to add item: " + error.message);
          throw error;
      }
  };

  const handleAddExpenseCategory = async (name: string): Promise<ExpenseCategory> => {
      try {
          const { data, error } = await supabase.from('expense_categories').insert([{ name }]).select().single();
          if (error) throw error;
          const newCat = { id: data.id, name };
          setExpenseCategories(prev => [...prev, newCat]);
          return newCat;
      } catch (error: any) {
          console.error("Error adding category:", error);
          alert("Failed to add category: " + error.message);
          throw error;
      }
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
