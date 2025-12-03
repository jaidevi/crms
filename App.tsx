
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
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
import UserAdminScreen from './components/UserAdminScreen';
import ProductsScreen from './components/NewItemForm';
import SalaryScreen from './components/SalaryScreen';
import AttendanceScreen from './components/AttendanceScreen';
import type {
  PaymentMode, OrderStatus, AttendanceStatus, CompanyDetails, ProcessType,
  Client, ClientProcess, PurchaseShop, Employee, MasterItem, LineItem,
  PurchaseOrder, PONumberConfig, DeliveryChallanNumberConfig, InvoiceNumberConfig,
  SupplierPaymentNumberConfig, EmployeeAdvance, OtherExpense, ExpenseCategory,
  TimberExpense, SupplierPayment, DeliveryChallan, InvoiceItem, Invoice,
  PaymentReceived, AttendanceRecord, Payslip
} from './types';

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState('Dashboard');
  const [companyDetails, setCompanyDetails] = useState<CompanyDetails>({
    name: '', addressLine1: '', addressLine2: '', phone: '', email: '', gstin: '', hsnSac: '', bankName: '', bankAccountNumber: '', bankIfscCode: '', logoUrl: ''
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
  const [invoiceNumberConfig, setInvoiceNumberConfig] = useState<InvoiceNumberConfig>({ mode: 'auto', prefix: 'INV', nextNumber: 1 });

  // Helper to sanitize dates
  const sanitizeDate = (date: string | undefined): string | null => {
      if (!date || date.trim() === '') return null;
      return date;
  };

  // --- Data Fetching ---
  const fetchTable = async (table: string, setter: Function, transformer?: Function) => {
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
              if (table === 'company_details' && error.code === 'PGRST116') {
                  // No rows found for company details, which is fine initially
                  return;
              }
              throw error;
          }
          if (data) {
              setter(transformer ? transformer(data) : data);
          }
      } catch (error) {
          console.error(`Error fetching ${table}:`, error);
      }
  };

  useEffect(() => {
    // 1. Clients
    fetchTable('clients', setClients, (data: any[]) => data.map(d => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        email: d.email,
        address: d.address,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
        gstNo: d.gst_no,
        panNo: d.pan_no,
        paymentTerms: d.payment_terms,
        processes: Array.isArray(d.processes) ? d.processes : []
    })));

    // 2. Purchase Shops
    fetchTable('purchase_shops', setPurchaseShops, (data: any[]) => data.map(d => ({
        id: d.id,
        name: d.name,
        phone: d.phone,
        email: d.email,
        address: d.address,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
        gstNo: d.gst_no,
        panNo: d.pan_no,
        paymentTerms: d.payment_terms
    })));

    // 3. Employees
    fetchTable('employees', setEmployees, (data: any[]) => data.map(d => ({
        id: d.id,
        name: d.name,
        designation: d.designation,
        phone: d.phone,
        dailyWage: d.daily_wage || 0,
        ratePerMeter: d.rate_per_meter || 0
    })));

    // 4. Process Types
    fetchTable('process_types', setProcessTypes);

    // 5. Master Items
    fetchTable('master_items', setMasterItems);

    // 6. Purchase Orders
    fetchTable('purchase_orders', setPurchaseOrders, (data: any[]) => data.map(d => ({
        id: d.id,
        poNumber: d.po_number,
        poDate: d.po_date,
        shopName: d.shop_name,
        totalAmount: d.total_amount || 0,
        gstNo: d.gst_no,
        paymentMode: d.payment_mode,
        status: d.status,
        paymentTerms: d.payment_terms,
        referenceId: d.reference_id,
        bankName: d.bank_name,
        chequeDate: d.cheque_date,
        items: Array.isArray(d.purchase_order_items) ? d.purchase_order_items.map((i: any) => ({
            id: i.id,
            name: i.name,
            quantity: i.quantity || 0,
            rate: i.rate || 0,
            amount: i.amount || 0
        })) : []
    })));

    // 7. Delivery Challans
    fetchTable('delivery_challans', setDeliveryChallans, (data: any[]) => data.map(d => {
        let dcImage = [];
        try {
            dcImage = d.dc_image ? (typeof d.dc_image === 'string' ? JSON.parse(d.dc_image) : d.dc_image) : [];
        } catch (e) { console.warn('Failed to parse dc_image', d.id); }

        let sampleImage = [];
        try {
            sampleImage = d.sample_image ? (typeof d.sample_image === 'string' ? JSON.parse(d.sample_image) : d.sample_image) : [];
        } catch (e) { console.warn('Failed to parse sample_image', d.id); }

        return {
            id: d.id,
            challanNumber: d.challan_number,
            date: d.date,
            partyName: d.party_name,
            partyDCNo: d.party_dc_no,
            process: d.process ? (
                (() => {
                    try {
                        const parsed = JSON.parse(d.process);
                        if (Array.isArray(parsed)) return parsed;
                    } catch(e) {}
                    // Fallback string parsing for legacy data
                    return d.process.split(',').map((s: string) => 
                        s.trim()
                         .replace(/^\[/, '').replace(/\]$/, '') // Remove brackets
                         .trim()
                         .replace(/^"/, '').replace(/"$/, '') // Remove quotes
                         .replace(/\\"/g, '"') // Unescape
                    ).filter((s: string) => s !== "");
                })()
            ) : [],
            splitProcess: d.split_process ? (Array.isArray(d.split_process) ? d.split_process : []) : [],
            designNo: d.design_no,
            pcs: d.pcs || 0,
            mtr: d.mtr || 0,
            width: d.width || 0,
            shrinkage: d.shrinkage,
            pin: d.pin,
            pick: d.pick,
            extraWork: d.extra_work,
            status: d.status,
            workerName: d.worker_name,
            workingUnit: d.working_unit,
            isOutsourcing: d.is_outsourcing,
            dcImage: Array.isArray(dcImage) ? dcImage : [],
            sampleImage: Array.isArray(sampleImage) ? sampleImage : []
        };
    }));

    // 8. Invoices
    fetchTable('invoices', setInvoices, (data: any[]) => data.map(d => ({
        id: d.id,
        invoiceNumber: d.invoice_number,
        invoiceDate: d.invoice_date,
        clientName: d.client_name,
        subTotal: d.sub_total || 0,
        totalCgst: d.total_cgst || 0,
        totalSgst: d.total_sgst || 0,
        totalTaxAmount: d.total_tax_amount || 0,
        roundedOff: d.rounded_off || 0,
        totalAmount: d.total_amount || 0,
        items: Array.isArray(d.invoice_items) ? d.invoice_items.map((i: any) => ({
            id: i.id,
            challanNumber: i.challan_number,
            challanDate: i.challan_date,
            process: i.process,
            description: i.description,
            designNo: i.design_no,
            hsnSac: i.hsn_sac,
            pcs: i.pcs || 0,
            mtr: i.mtr || 0,
            rate: i.rate || 0,
            amount: i.amount || 0,
            subtotal: i.subtotal || 0,
            cgst: i.cgst || 0,
            sgst: i.sgst || 0
        })) : []
    })));

    // 9. Payments Received
    fetchTable('payments_received', setPaymentsReceived, (data: any[]) => data.map(d => ({
        id: d.id,
        clientName: d.client_name,
        paymentDate: d.payment_date,
        amount: d.amount || 0,
        paymentMode: d.payment_mode,
        referenceNumber: d.reference_number,
        notes: d.notes
    })));

    // 10. Numbering Configs
    fetchTable('numbering_configs', (data: any[]) => {
        data.forEach(config => {
            if (config.id === 'po') setPoNumberConfig({ prefix: config.prefix ?? '', nextNumber: config.next_number ?? 1 });
            if (config.id === 'dc') setDeliveryChallanNumberConfig({ prefix: config.prefix ?? '', nextNumber: config.next_number ?? 1 });
            if (config.id === 'invoice') setInvoiceNumberConfig({ mode: config.mode ?? 'auto', prefix: config.prefix ?? '', nextNumber: config.next_number ?? 1 });
            if (config.id === 'supplier_payment') setSupplierPaymentConfig({ prefix: config.prefix ?? '', nextNumber: config.next_number ?? 1 });
        });
    });

    // 11. Employee Advances
    fetchTable('employee_advances', setAdvances, (data: any[]) => data.map(d => ({
        id: d.id,
        employeeId: d.employee_id,
        date: d.date,
        amount: d.amount || 0,
        paidAmount: d.paid_amount || 0,
        notes: d.notes
    })));

    // 12. Other Expenses
    fetchTable('other_expenses', setOtherExpenses, (data: any[]) => data.map(d => ({
        id: d.id,
        date: d.date,
        itemName: d.item_name,
        amount: d.amount || 0,
        notes: d.notes,
        bankName: d.bank_name,
        chequeDate: d.cheque_date,
        paymentMode: d.payment_mode,
        paymentStatus: d.payment_status,
        paymentTerms: d.payment_terms
    })));

    // 13. Expense Categories
    fetchTable('expense_categories', setExpenseCategories);

    // 14. Timber Expenses
    fetchTable('timber_expenses', setTimberExpenses, (data: any[]) => data.map(d => ({
        id: d.id,
        date: d.date,
        supplierName: d.supplier_name,
        loadWeight: d.load_weight || 0,
        vehicleWeight: d.vehicle_weight || 0,
        cft: d.cft || 0,
        rate: d.rate || 0,
        amount: d.amount || 0,
        notes: d.notes,
        paymentMode: d.payment_mode,
        paymentStatus: d.payment_status,
        bankName: d.bank_name,
        chequeDate: d.cheque_date,
        paymentTerms: d.payment_terms
    })));

    // 15. Supplier Payments
    fetchTable('supplier_payments', setSupplierPayments, (data: any[]) => data.map(d => ({
        id: d.id,
        paymentNumber: d.payment_number,
        date: d.date,
        supplierName: d.supplier_name,
        amount: d.amount || 0,
        paymentMode: d.payment_mode,
        referenceId: d.reference_id,
        image: d.image
    })));

    // 16. Attendance
    fetchTable('attendance', setAttendanceRecords);

    // 17. Payslips
    fetchTable('payslips', setPayslips, (data: any[]) => data.map(d => ({
        id: d.id,
        employeeId: d.employee_id,
        employeeName: d.employee_name,
        payslipDate: d.payslip_date,
        payPeriodStart: d.pay_period_start,
        payPeriodEnd: d.pay_period_end,
        totalWorkingDays: d.total_working_days || 0,
        otHours: d.ot_hours || 0,
        wageEarnings: d.wage_earnings || 0,
        productionEarnings: d.production_earnings || 0,
        grossSalary: d.gross_salary || 0,
        advanceDeduction: d.advance_deduction || 0,
        netSalary: d.net_salary || 0,
        totalOutstandingAdvance: d.total_outstanding_advance || 0
    })));

    // 18. Company Details
    fetchTable('company_details', (data: any) => {
        if(data) {
             setCompanyDetails({
                name: data.name || 'Shri Skandaguru Textile Process',
                addressLine1: data.address_line_1 || '',
                addressLine2: data.address_line_2 || '',
                phone: data.phone || '',
                email: data.email || '',
                gstin: data.gstin || '',
                hsnSac: data.hsn_sac || '998821',
                bankName: data.bank_name || 'Union Bank Of India(Salem)',
                bankAccountNumber: data.bank_account_number || '334101010201163',
                bankIfscCode: data.bank_ifsc_code || 'UBIN0533416',
                logoUrl: data.logo_url || '',
            });
        }
    });

  }, []);

  // --- Handlers ---

  const handleUpdateCompanyDetails = async (details: CompanyDetails) => {
      try {
          const { error } = await supabase.from('company_details').upsert({
              id: 1, // Only one row
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
          });

          if (error) throw error;
          setCompanyDetails(details);
      } catch (error: any) {
          console.error("Error updating company details:", error);
          const msg = error.message || error.details || JSON.stringify(error);
          alert("Failed to save company details: " + msg);
          throw error;
      }
  };

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
              processes: newClient.processes
          }]).select().single();

          if (error) {
              if (error.code === '23505') {
                  alert('A client with this name already exists.');
                  return;
              }
              throw error;
          }
          if (data) {
              setClients(prev => [...prev, { ...newClient, id: data.id }]);
          }
      } catch (error: any) {
          alert(`Error adding client: ${error.message || error}`);
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
              processes: updatedClient.processes
          }).eq('id', updatedClient.id);

          if (error) {
               if (error.code === '23505') {
                  alert('A client with this name already exists.');
                  return;
              }
              throw error;
          }
          setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
      } catch (error: any) {
          alert(`Error updating client: ${error.message || error}`);
      }
  };

  const handleDeleteClient = async (id: string) => {
      try {
          const { error } = await supabase.from('clients').delete().eq('id', id);
          if (error) throw error;
          setClients(prev => prev.filter(c => c.id !== id));
      } catch (error: any) {
          alert(`Error deleting client: ${error.message || error}`);
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
              payment_terms: newShop.paymentTerms
          }]).select().single();

          if (error) {
               if (error.code === '23505') {
                  alert('A shop with this name already exists.');
                  return;
              }
              throw error;
          }
          if (data) {
              setPurchaseShops(prev => [...prev, { ...newShop, id: data.id }]);
          }
      } catch (error: any) {
          alert(`Error adding shop: ${error.message || error}`);
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
              payment_terms: updatedShop.paymentTerms
          }).eq('id', updatedShop.id);

          if (error) {
               if (error.code === '23505') {
                  alert('A shop with this name already exists.');
                  return;
              }
              throw error;
          }
          setPurchaseShops(prev => prev.map(s => s.id === updatedShop.id ? updatedShop : s));
      } catch (error: any) {
          alert(`Error updating shop: ${error.message || error}`);
      }
  };

  const handleDeletePurchaseShop = async (id: string) => {
      try {
          const { error } = await supabase.from('purchase_shops').delete().eq('id', id);
          if (error) throw error;
          setPurchaseShops(prev => prev.filter(s => s.id !== id));
      } catch (error: any) {
          alert(`Error deleting shop: ${error.message || error}`);
      }
  };

  const handleAddEmployee = async (newEmployee: Omit<Employee, 'id'>) => {
      try {
          const { data, error } = await supabase.from('employees').insert([{
              name: newEmployee.name,
              designation: newEmployee.designation,
              phone: newEmployee.phone,
              daily_wage: newEmployee.dailyWage,
              rate_per_meter: newEmployee.ratePerMeter
          }]).select().single();

          if (error) {
               if (error.code === '23505') {
                  alert('An employee with this name already exists.');
                  return;
              }
              throw error;
          }
          if (data) {
              setEmployees(prev => [...prev, { ...newEmployee, id: data.id }]);
          }
      } catch (error: any) {
          alert(`Error adding employee: ${error.message || error}`);
      }
  };

  const handleUpdateEmployee = async (id: string, updatedEmployee: Employee) => {
      try {
          const { error } = await supabase.from('employees').update({
              name: updatedEmployee.name,
              designation: updatedEmployee.designation,
              phone: updatedEmployee.phone,
              daily_wage: updatedEmployee.dailyWage,
              rate_per_meter: updatedEmployee.ratePerMeter
          }).eq('id', id);

          if (error) {
               if (error.code === '23505') {
                  alert('An employee with this name already exists.');
                  return;
              }
              throw error;
          }
          setEmployees(prev => prev.map(e => e.id === id ? updatedEmployee : e));
      } catch (error: any) {
          alert(`Error updating employee: ${error.message || error}`);
      }
  };

  const handleDeleteEmployee = async (id: string) => {
      try {
          const { error } = await supabase.from('employees').delete().eq('id', id);
          if (error) throw error;
          setEmployees(prev => prev.filter(e => e.id !== id));
      } catch (error: any) {
          alert(`Error deleting employee: ${error.message || error}`);
      }
  };

  const handleAddProcessType = async (process: { name: string, rate: number }) => {
      try {
          const { data, error } = await supabase.from('process_types').insert([{
              name: process.name,
              rate: process.rate
          }]).select().single();

          if (error) {
               if (error.code === '23505') {
                  alert('A process with this name already exists.');
                  return;
              }
              throw error;
          }
          if (data) {
              setProcessTypes(prev => [...prev, { id: data.id, name: process.name, rate: process.rate }]);
          }
      } catch (error: any) {
          alert(`Error adding process type: ${error.message || error}`);
      }
  };

  const handleUpdateProcessType = async (id: string, updatedProcess: { name: string, rate: number }) => {
      try {
          const { error } = await supabase.from('process_types').update({
              name: updatedProcess.name,
              rate: updatedProcess.rate
          }).eq('id', id);

          if (error) {
               if (error.code === '23505') {
                  alert('A process with this name already exists.');
                  return;
              }
              throw error;
          }
          setProcessTypes(prev => prev.map(p => p.id === id ? { ...p, ...updatedProcess } : p));
      } catch (error: any) {
          alert(`Error updating process type: ${error.message || error}`);
      }
  };

  const handleDeleteProcessType = async (id: string) => {
      try {
          const { error } = await supabase.from('process_types').delete().eq('id', id);
          if (error) throw error;
          setProcessTypes(prev => prev.filter(p => p.id !== id));
      } catch (error: any) {
          alert(`Error deleting process type: ${error.message || error}`);
      }
  };

  const handleAddMasterItem = async (itemData: { name: string, rate: number }) => {
      try {
          const { data, error } = await supabase.from('master_items').insert([{
              name: itemData.name,
              rate: itemData.rate
          }]).select().single();

          if (error) {
               if (error.code === '23505') {
                  alert('An item with this name already exists.');
                  return null;
              }
              throw error;
          }
          if (data) {
              const newItem = { id: data.id, name: itemData.name, rate: itemData.rate };
              setMasterItems(prev => [...prev, newItem]);
              return newItem;
          }
      } catch (error: any) {
          alert(`Error adding master item: ${error.message || error}`);
      }
      return null;
  };

  const handleAddPurchaseOrder = async (newOrder: PurchaseOrder) => {
      try {
          // 1. Insert Order
          const { data: orderData, error: orderError } = await supabase.from('purchase_orders').insert([{
              po_number: newOrder.poNumber,
              po_date: newOrder.poDate,
              shop_name: newOrder.shopName,
              total_amount: newOrder.totalAmount,
              gst_no: newOrder.gstNo,
              payment_mode: newOrder.paymentMode,
              status: newOrder.status,
              payment_terms: newOrder.paymentTerms,
              reference_id: newOrder.referenceId,
              bank_name: newOrder.bankName,
              cheque_date: sanitizeDate(newOrder.chequeDate)
          }]).select().single();

          if (orderError) {
              if (orderError.code === '23505') {
                  alert('A Purchase Order with this number already exists.');
                  return;
              }
              throw orderError;
          }

          const poId = orderData.id;

          // 2. Insert Items
          const itemsToInsert = newOrder.items.map(item => ({
              po_id: poId,
              name: item.name,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount
          }));

          const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsToInsert);
          if (itemsError) throw itemsError;

          // 3. Update state
          setPurchaseOrders(prev => [...prev, { ...newOrder, id: poId }]);
          setPoNumberConfig(prev => ({ ...prev, nextNumber: prev.nextNumber + 1 }));
          
          // Update config in DB
          await supabase.from('numbering_configs').upsert({ id: 'po', prefix: poNumberConfig.prefix, next_number: poNumberConfig.nextNumber + 1 });

      } catch (error: any) {
          alert(`Error adding PO: ${error.message || JSON.stringify(error)}`);
      }
  };

  const handleUpdatePurchaseOrder = async (poNumberToUpdate: string, updatedOrder: PurchaseOrder) => {
      try {
          // 1. Update Order Details
          const { error: orderError } = await supabase.from('purchase_orders').update({
              po_date: updatedOrder.poDate,
              shop_name: updatedOrder.shopName,
              total_amount: updatedOrder.totalAmount,
              gst_no: updatedOrder.gstNo,
              payment_mode: updatedOrder.paymentMode,
              status: updatedOrder.status,
              payment_terms: updatedOrder.paymentTerms,
              reference_id: updatedOrder.referenceId,
              bank_name: updatedOrder.bankName,
              cheque_date: sanitizeDate(updatedOrder.chequeDate)
          }).eq('id', updatedOrder.id);

          if (orderError) throw orderError;

          // 2. Delete old items
          const { error: deleteError } = await supabase.from('purchase_order_items').delete().eq('po_id', updatedOrder.id);
          if (deleteError) throw deleteError;

          // 3. Insert new items
          const itemsToInsert = updatedOrder.items.map(item => ({
              po_id: updatedOrder.id,
              name: item.name,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount
          }));
          const { error: itemsError } = await supabase.from('purchase_order_items').insert(itemsToInsert);
          if (itemsError) throw itemsError;

          // 4. Update State
          setPurchaseOrders(prev => prev.map(order => order.poNumber === poNumberToUpdate ? updatedOrder : order));

      } catch (error: any) {
          alert(`Error updating PO: ${error.message || JSON.stringify(error)}`);
      }
  };

  const handleDeletePurchaseOrder = async (poNumberToDelete: string) => {
      try {
          const { error } = await supabase.from('purchase_orders').delete().eq('po_number', poNumberToDelete);
          if (error) throw error;
          setPurchaseOrders(prev => prev.filter(order => order.poNumber !== poNumberToDelete));
      } catch (error: any) {
          alert(`Error deleting PO: ${error.message || error}`);
      }
  };

  const handleAddChallan = async (newChallan: Omit<DeliveryChallan, 'id'>) => {
      try {
          const { data, error } = await supabase.from('delivery_challans').insert([{
              challan_number: newChallan.challanNumber,
              date: newChallan.date,
              party_name: newChallan.partyName,
              party_dc_no: newChallan.partyDCNo,
              process: newChallan.process.join(','),
              split_process: newChallan.splitProcess,
              design_no: newChallan.designNo,
              pcs: newChallan.pcs,
              mtr: newChallan.mtr,
              width: newChallan.width,
              shrinkage: newChallan.shrinkage,
              pin: newChallan.pin,
              pick: newChallan.pick,
              extra_work: newChallan.extraWork,
              status: newChallan.status,
              worker_name: newChallan.workerName,
              working_unit: newChallan.workingUnit,
              is_outsourcing: newChallan.isOutsourcing,
              dc_image: JSON.stringify(newChallan.dcImage),
              sample_image: JSON.stringify(newChallan.sampleImage)
          }]).select().single();

          if (error) {
               if (error.code === '23505') {
                  alert('A Challan with this number already exists.');
                  return;
              }
              throw error;
          }

          if (data) {
              setDeliveryChallans(prev => [...prev, { ...newChallan, id: data.id }]);
              setDeliveryChallanNumberConfig(prev => ({ ...prev, nextNumber: prev.nextNumber + 1 }));
              await supabase.from('numbering_configs').upsert({ id: 'dc', prefix: deliveryChallanNumberConfig.prefix, next_number: deliveryChallanNumberConfig.nextNumber + 1 });
          }
      } catch (error: any) {
          alert(`Error adding challan: ${error.message || error}`);
      }
  };

  const handleUpdateChallan = async (id: string, updatedChallan: DeliveryChallan) => {
      try {
          const { error } = await supabase.from('delivery_challans').update({
              date: updatedChallan.date,
              party_name: updatedChallan.partyName,
              party_dc_no: updatedChallan.partyDCNo,
              process: updatedChallan.process.join(','),
              split_process: updatedChallan.splitProcess,
              design_no: updatedChallan.designNo,
              pcs: updatedChallan.pcs,
              mtr: updatedChallan.mtr,
              width: updatedChallan.width,
              shrinkage: updatedChallan.shrinkage,
              pin: updatedChallan.pin,
              pick: updatedChallan.pick,
              extra_work: updatedChallan.extraWork,
              status: updatedChallan.status,
              worker_name: updatedChallan.workerName,
              working_unit: updatedChallan.workingUnit,
              is_outsourcing: updatedChallan.isOutsourcing,
              dc_image: JSON.stringify(updatedChallan.dcImage),
              sample_image: JSON.stringify(updatedChallan.sampleImage)
          }).eq('id', id);

          if (error) throw error;
          setDeliveryChallans(prev => prev.map(c => c.id === id ? updatedChallan : c));
      } catch (error: any) {
          alert(`Error updating challan: ${error.message || error}`);
      }
  };

  const handleDeleteChallan = async (id: string) => {
      try {
          const { error } = await supabase.from('delivery_challans').delete().eq('id', id);
          if (error) throw error;
          
          const updatedChallans = deliveryChallans.filter(c => c.id !== id);
          setDeliveryChallans(updatedChallans);

          // Recalculate next number based on remaining challans matching current prefix
          const currentPrefix = deliveryChallanNumberConfig.prefix;
          
          // Helper to extract number
          const extractNumber = (str: string) => {
              // Matches number at the end of the string
              const match = str.match(/(\d+)$/);
              return match ? parseInt(match[1], 10) : 0;
          };

          const relevantNumbers = updatedChallans
              .filter(c => c.challanNumber.startsWith(currentPrefix))
              .map(c => extractNumber(c.challanNumber));
          
          const maxNumber = relevantNumbers.length > 0 ? Math.max(...relevantNumbers) : 0;
          const newNextNumber = maxNumber + 1;

          setDeliveryChallanNumberConfig(prev => ({ ...prev, nextNumber: newNextNumber }));
          await supabase.from('numbering_configs').upsert({ 
              id: 'dc', 
              prefix: currentPrefix, 
              next_number: newNextNumber 
          });

      } catch (error: any) {
          alert(`Error deleting challan: ${error.message || error}`);
      }
  };

  const handleAddInvoice = async (newInvoice: Omit<Invoice, 'id'>) => {
      try {
          // 1. Insert Invoice
          const { data: invoiceData, error: invoiceError } = await supabase.from('invoices').insert([{
              invoice_number: newInvoice.invoiceNumber,
              invoice_date: newInvoice.invoiceDate,
              client_name: newInvoice.clientName,
              sub_total: newInvoice.subTotal,
              total_cgst: newInvoice.totalCgst,
              total_sgst: newInvoice.totalSgst,
              total_tax_amount: newInvoice.totalTaxAmount,
              rounded_off: newInvoice.roundedOff,
              total_amount: newInvoice.totalAmount
          }]).select().single();

          if (invoiceError) {
               if (invoiceError.code === '23505') {
                  alert('An Invoice with this number already exists.');
                  return;
              }
              throw invoiceError;
          }

          const invoiceId = invoiceData.id;

          // 2. Insert Invoice Items
          const itemsToInsert = newInvoice.items.map(item => ({
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
              amount: item.amount,
              subtotal: item.subtotal,
              cgst: item.cgst,
              sgst: item.sgst
          }));

          const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
          if (itemsError) throw itemsError;

          // 3. Update State
          setInvoices(prev => [...prev, { ...newInvoice, id: invoiceId }]);
          
          if (invoiceNumberConfig.mode === 'auto') {
              setInvoiceNumberConfig(prev => ({ ...prev, nextNumber: prev.nextNumber + 1 }));
              await supabase.from('numbering_configs').upsert({ id: 'invoice', mode: 'auto', prefix: invoiceNumberConfig.prefix, next_number: invoiceNumberConfig.nextNumber + 1 });
          }

      } catch (error: any) {
          alert(`Error adding invoice: ${error.message || JSON.stringify(error)}`);
      }
  };

  const handleDeleteInvoice = async (id: string) => {
      try {
          const { error } = await supabase.from('invoices').delete().eq('id', id);
          if (error) throw error;
          setInvoices(prev => prev.filter(inv => inv.id !== id));
      } catch (error: any) {
          alert(`Error deleting invoice: ${error.message || error}`);
      }
  };

  const handleAddPaymentReceived = async (payment: Omit<PaymentReceived, 'id'>) => {
      try {
          const { data, error } = await supabase.from('payments_received').insert([{
              client_name: payment.clientName,
              payment_date: payment.paymentDate,
              amount: payment.amount,
              payment_mode: payment.paymentMode,
              reference_number: payment.referenceNumber,
              notes: payment.notes
          }]).select().single();

          if (error) throw error;
          if (data) {
              setPaymentsReceived(prev => [...prev, { ...payment, id: data.id }]);
          }
      } catch (error: any) {
          alert(`Error adding payment: ${error.message || error}`);
      }
  };

  const handleUpdatePaymentReceived = async (payment: PaymentReceived) => {
      try {
          const { error } = await supabase.from('payments_received').update({
              client_name: payment.clientName,
              payment_date: payment.paymentDate,
              amount: payment.amount,
              payment_mode: payment.paymentMode,
              reference_number: payment.referenceNumber,
              notes: payment.notes
          }).eq('id', payment.id);

          if (error) throw error;
          setPaymentsReceived(prev => prev.map(p => p.id === payment.id ? payment : p));
      } catch (error: any) {
          alert(`Error updating payment: ${error.message || error}`);
      }
  };

  const handleDeletePaymentReceived = async (id: string) => {
      try {
          const { error } = await supabase.from('payments_received').delete().eq('id', id);
          if (error) throw error;
          setPaymentsReceived(prev => prev.filter(p => p.id !== id));
      } catch (error: any) {
          alert(`Error deleting payment: ${error.message || error}`);
      }
  };

  const handleAddAdvance = async (advance: Omit<EmployeeAdvance, 'id'>) => {
      try {
          const { data, error } = await supabase.from('employee_advances').insert([{
              employee_id: advance.employeeId,
              date: advance.date,
              amount: advance.amount,
              paid_amount: advance.paidAmount,
              notes: advance.notes
          }]).select().single();

          if (error) throw error;
          if (data) {
              setAdvances(prev => [...prev, { ...advance, id: data.id }]);
          }
      } catch (error: any) {
          alert(`Error adding advance: ${error.message || error}`);
      }
  };

  const handleUpdateAdvance = async (advance: EmployeeAdvance) => {
      try {
          const { error } = await supabase.from('employee_advances').update({
              date: advance.date,
              amount: advance.amount,
              paid_amount: advance.paidAmount,
              notes: advance.notes
          }).eq('id', advance.id);

          if (error) throw error;
          setAdvances(prev => prev.map(a => a.id === advance.id ? advance : a));
      } catch (error: any) {
          alert(`Error updating advance: ${error.message || error}`);
      }
  };

  const handleDeleteAdvance = async (id: string) => {
      try {
          const { error } = await supabase.from('employee_advances').delete().eq('id', id);
          if (error) throw error;
          setAdvances(prev => prev.filter(a => a.id !== id));
      } catch (error: any) {
          alert(`Error deleting advance: ${error.message || error}`);
      }
  };

  const handleAddOtherExpense = async (expense: Omit<OtherExpense, 'id'>) => {
      try {
          const { data, error } = await supabase.from('other_expenses').insert([{
              date: expense.date,
              item_name: expense.itemName,
              amount: expense.amount,
              notes: expense.notes,
              bank_name: expense.bankName,
              cheque_date: sanitizeDate(expense.chequeDate),
              payment_mode: expense.paymentMode,
              payment_status: expense.paymentStatus,
              payment_terms: expense.paymentTerms
          }]).select().single();

          if (error) throw error;
          if (data) {
              setOtherExpenses(prev => [...prev, { ...expense, id: data.id }]);
          }
      } catch (error: any) {
          alert(`Error adding expense: ${error.message || error}`);
      }
  };

  const handleUpdateOtherExpense = async (expense: OtherExpense) => {
      try {
          const { error } = await supabase.from('other_expenses').update({
              date: expense.date,
              item_name: expense.itemName,
              amount: expense.amount,
              notes: expense.notes,
              bank_name: expense.bankName,
              cheque_date: sanitizeDate(expense.chequeDate),
              payment_mode: expense.paymentMode,
              payment_status: expense.paymentStatus,
              payment_terms: expense.paymentTerms
          }).eq('id', expense.id);

          if (error) throw error;
          setOtherExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
      } catch (error: any) {
          alert(`Error updating expense: ${error.message || error}`);
      }
  };

  const handleDeleteOtherExpense = async (id: string) => {
      try {
          const { error } = await supabase.from('other_expenses').delete().eq('id', id);
          if (error) throw error;
          setOtherExpenses(prev => prev.filter(e => e.id !== id));
      } catch (error: any) {
          alert(`Error deleting expense: ${error.message || error}`);
      }
  };

  const handleAddExpenseCategory = async (name: string) => {
      try {
          const { data, error } = await supabase.from('expense_categories').insert([{ name }]).select().single();
          if (error) {
               if (error.code === '23505') {
                  alert('This category already exists.');
                  return null;
              }
              throw error;
          }
          if (data) {
              const newCat = { id: data.id, name };
              setExpenseCategories(prev => [...prev, newCat]);
              return newCat;
          }
      } catch (error: any) {
          alert(`Error adding category: ${error.message || error}`);
      }
      return null;
  };

  const handleAddTimberExpense = async (expense: Omit<TimberExpense, 'id'>) => {
      try {
          const { data, error } = await supabase.from('timber_expenses').insert([{
              date: expense.date,
              supplier_name: expense.supplierName,
              load_weight: expense.loadWeight,
              vehicle_weight: expense.vehicleWeight,
              cft: expense.cft,
              rate: expense.rate,
              amount: expense.amount,
              notes: expense.notes,
              payment_mode: expense.paymentMode,
              payment_status: expense.paymentStatus,
              bank_name: expense.bankName,
              cheque_date: sanitizeDate(expense.chequeDate),
              payment_terms: expense.paymentTerms
          }]).select().single();

          if (error) throw error;
          if (data) {
              setTimberExpenses(prev => [...prev, { ...expense, id: data.id }]);
          }
      } catch (error: any) {
          alert(`Error adding timber expense: ${error.message || error}`);
      }
  };

  const handleUpdateTimberExpense = async (expense: TimberExpense) => {
      try {
          const { error } = await supabase.from('timber_expenses').update({
              date: expense.date,
              supplier_name: expense.supplierName,
              load_weight: expense.loadWeight,
              vehicle_weight: expense.vehicleWeight,
              cft: expense.cft,
              rate: expense.rate,
              amount: expense.amount,
              notes: expense.notes,
              payment_mode: expense.paymentMode,
              payment_status: expense.paymentStatus,
              bank_name: expense.bankName,
              cheque_date: sanitizeDate(expense.chequeDate),
              payment_terms: expense.paymentTerms
          }).eq('id', expense.id);

          if (error) throw error;
          setTimberExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
      } catch (error: any) {
          alert(`Error updating timber expense: ${error.message || error}`);
      }
  };

  const handleDeleteTimberExpense = async (id: string) => {
      try {
          const { error } = await supabase.from('timber_expenses').delete().eq('id', id);
          if (error) throw error;
          setTimberExpenses(prev => prev.filter(e => e.id !== id));
      } catch (error: any) {
          alert(`Error deleting timber expense: ${error.message || error}`);
      }
  };

  const handleAddSupplierPayment = async (payment: Omit<SupplierPayment, 'id'>) => {
      try {
          const { data, error } = await supabase.from('supplier_payments').insert([{
              payment_number: payment.paymentNumber,
              date: payment.date,
              supplier_name: payment.supplierName,
              amount: payment.amount,
              payment_mode: payment.paymentMode,
              reference_id: payment.referenceId,
              image: payment.image
          }]).select().single();

          if (error) {
               if (error.code === '23505') {
                  alert('A payment with this number already exists.');
                  return;
              }
              throw error;
          }
          if (data) {
              setSupplierPayments(prev => [...prev, { ...payment, id: data.id }]);
              setSupplierPaymentConfig(prev => ({ ...prev, nextNumber: prev.nextNumber + 1 }));
              await supabase.from('numbering_configs').upsert({ id: 'supplier_payment', prefix: supplierPaymentConfig.prefix, next_number: supplierPaymentConfig.nextNumber + 1 });
          }
      } catch (error: any) {
          alert(`Error adding payment: ${error.message || error}`);
      }
  };

  const handleSaveAttendance = async (records: Omit<AttendanceRecord, 'id'>[]) => {
      try {
          // Process one by one or in batch. Supabase supports bulk upsert.
          // Note: records passed here might lack ID but have employee_id + date as unique key
          const { data, error } = await supabase.from('attendance').upsert(
              records.map(r => ({
                  employee_id: r.employee_id,
                  date: r.date,
                  morning_status: r.morningStatus,
                  evening_status: r.eveningStatus,
                  morning_overtime_hours: r.morningOvertimeHours,
                  evening_overtime_hours: r.eveningOvertimeHours,
                  meters_produced: r.metersProduced
              })),
              { onConflict: 'employee_id,date' }
          ).select();

          if (error) throw error;
          
          // Refresh records
          if (data) {
              const newRecords = data.map((d: any) => ({
                  id: d.id,
                  employee_id: d.employee_id,
                  date: d.date,
                  morningStatus: d.morning_status,
                  eveningStatus: d.evening_status,
                  morningOvertimeHours: d.morning_overtime_hours,
                  eveningOvertimeHours: d.evening_overtime_hours,
                  metersProduced: d.meters_produced,
                  createdAt: d.created_at,
                  updatedAt: d.updated_at
              }));
              
              // Merge with existing
              const recordMap = new Map(attendanceRecords.map(r => [`${r.employee_id}|${r.date}`, r]));
              newRecords.forEach((r: AttendanceRecord) => recordMap.set(`${r.employee_id}|${r.date}`, r));
              setAttendanceRecords(Array.from(recordMap.values()));
          }
      } catch (error: any) {
          console.error("Error saving attendance:", error);
          throw error; // Re-throw to let screen handle it
      }
  };

  const handleSavePayslip = async (payslip: Omit<Payslip, 'id'>) => {
      try {
          const { data, error } = await supabase.from('payslips').insert([{
              employee_id: payslip.employeeId,
              employee_name: payslip.employeeName,
              pay_period_start: payslip.payPeriodStart,
              pay_period_end: payslip.payPeriodEnd,
              payslip_date: payslip.payslipDate,
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
          
          if (data) {
              const newPayslip = { ...payslip, id: data.id };
              setPayslips(prev => [...prev, newPayslip]);

              if (payslip.advanceDeduction > 0) {
                  // Track deduction in advances history? 
                  // For now, simpler logic: Update paid_amount on existing unpaid advances
                  let remainingDeduction = payslip.advanceDeduction;
                  const userAdvances = advances.filter(a => a.employeeId === payslip.employeeId && a.amount > a.paidAmount).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                  
                  for (const adv of userAdvances) {
                      if (remainingDeduction <= 0) break;
                      const outstanding = adv.amount - adv.paidAmount;
                      const deduction = Math.min(outstanding, remainingDeduction);
                      
                      await supabase.from('employee_advances').update({
                          paid_amount: adv.paidAmount + deduction
                      }).eq('id', adv.id);
                      
                      remainingDeduction -= deduction;
                  }
                  
                  // Refresh advances
                  fetchTable('employee_advances', setAdvances, (data: any[]) => data.map(d => ({
                        id: d.id,
                        employeeId: d.employee_id,
                        date: d.date,
                        amount: d.amount,
                        paidAmount: d.paid_amount,
                        notes: d.notes
                    })));
              }
          }
      } catch (error: any) {
          throw error;
      }
  };

  const handleUpdatePoConfig = async (newConfig: PONumberConfig) => {
      setPoNumberConfig(newConfig);
      await supabase.from('numbering_configs').upsert({ id: 'po', prefix: newConfig.prefix, next_number: newConfig.nextNumber });
  };

  const handleUpdateDcConfig = async (newConfig: DeliveryChallanNumberConfig) => {
      setDeliveryChallanNumberConfig(newConfig);
      await supabase.from('numbering_configs').upsert({ id: 'dc', prefix: newConfig.prefix, next_number: newConfig.nextNumber });
  };

  const handleUpdateInvConfig = async (newConfig: InvoiceNumberConfig) => {
      setInvoiceNumberConfig(newConfig);
      await supabase.from('numbering_configs').upsert({ id: 'invoice', mode: newConfig.mode, prefix: newConfig.prefix, next_number: newConfig.nextNumber });
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-secondary-900">
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {activeScreen === 'Dashboard' && <DashboardScreen invoices={invoices} paymentsReceived={paymentsReceived} deliveryChallans={deliveryChallans} purchaseOrders={purchaseOrders} otherExpenses={otherExpenses} advances={advances} />}
          {activeScreen === 'Expenses' && <PurchaseOrderScreen purchaseOrders={purchaseOrders} onAddOrder={handleAddPurchaseOrder} onUpdateOrder={handleUpdatePurchaseOrder} onDeleteOrder={handleDeletePurchaseOrder} purchaseShops={purchaseShops} onAddPurchaseShop={handleAddPurchaseShop} bankNames={bankNames} onAddBankName={name => setBankNames(prev => [...prev, name])} poNumberConfig={poNumberConfig} masterItems={masterItems} onAddMasterItem={handleAddMasterItem} advances={advances} employees={employees} onAddAdvance={handleAddAdvance} onUpdateAdvance={handleUpdateAdvance} onDeleteAdvance={handleDeleteAdvance} otherExpenses={otherExpenses} onAddOtherExpense={handleAddOtherExpense} onUpdateOtherExpense={handleUpdateOtherExpense} onDeleteOtherExpense={handleDeleteOtherExpense} expenseCategories={expenseCategories} onAddExpenseCategory={handleAddExpenseCategory} timberExpenses={timberExpenses} onAddTimberExpense={handleAddTimberExpense} onUpdateTimberExpense={handleUpdateTimberExpense} onDeleteTimberExpense={handleDeleteTimberExpense} supplierPayments={supplierPayments} supplierPaymentConfig={supplierPaymentConfig} onAddSupplierPayment={handleAddSupplierPayment} />}
          {activeScreen === 'Delivery Challans' && <DeliveryChallanScreen deliveryChallans={deliveryChallans} onAddChallan={handleAddChallan} onUpdateChallan={handleUpdateChallan} onDeleteChallan={handleDeleteChallan} clients={clients} onAddClient={handleAddClient} purchaseShops={purchaseShops} onAddPurchaseShop={handleAddPurchaseShop} processTypes={processTypes} onAddProcessType={handleAddProcessType} deliveryChallanNumberConfig={deliveryChallanNumberConfig} invoices={invoices} onDeleteInvoice={handleDeleteInvoice} companyDetails={companyDetails} employees={employees} onAddEmployee={handleAddEmployee} />}
          {activeScreen === 'Outsourcing' && <DeliveryChallanScreen deliveryChallans={deliveryChallans} onAddChallan={handleAddChallan} onUpdateChallan={handleUpdateChallan} onDeleteChallan={handleDeleteChallan} clients={clients} onAddClient={handleAddClient} purchaseShops={purchaseShops} onAddPurchaseShop={handleAddPurchaseShop} processTypes={processTypes} onAddProcessType={handleAddProcessType} deliveryChallanNumberConfig={deliveryChallanNumberConfig} invoices={invoices} onDeleteInvoice={handleDeleteInvoice} companyDetails={companyDetails} employees={employees} onAddEmployee={handleAddEmployee} isOutsourcingScreen={true} />}
          {activeScreen === 'Invoices' && <InvoicesScreen clients={clients} deliveryChallans={deliveryChallans} processTypes={processTypes} onAddInvoice={handleAddInvoice} invoiceNumberConfig={invoiceNumberConfig} invoices={invoices} companyDetails={companyDetails} />}
          {activeScreen === 'Payment Received' && <PaymentReceivedScreen payments={paymentsReceived} onAddPayment={handleAddPaymentReceived} onUpdatePayment={handleUpdatePaymentReceived} onDeletePayment={handleDeletePaymentReceived} clients={clients} onAddClient={handleAddClient} />}
          {activeScreen === 'Settings' && <SettingsScreen poConfig={poNumberConfig} onUpdatePoConfig={handleUpdatePoConfig} dcConfig={deliveryChallanNumberConfig} onUpdateDcConfig={handleUpdateDcConfig} invConfig={invoiceNumberConfig} onUpdateInvConfig={handleUpdateInvConfig} />}
          {activeScreen === 'Add Client' && <ShopMasterScreen clients={clients} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} processTypes={processTypes} onAddProcessType={handleAddProcessType} />}
          {activeScreen === 'Add Purchase Shop' && <PurchaseShopMasterScreen shops={purchaseShops} onAddShop={handleAddPurchaseShop} onUpdateShop={handleUpdatePurchaseShop} onDeleteShop={handleDeletePurchaseShop} />}
          {activeScreen === 'Add Employee' && <EmployeeMasterScreen employees={employees} onAddEmployee={handleAddEmployee} onUpdateEmployee={handleUpdateEmployee} onDeleteEmployee={handleDeleteEmployee} />}
          {activeScreen === 'Add Process' && <PartyDCProcessMasterScreen processTypes={processTypes} onAddProcessType={handleAddProcessType} onUpdateProcessType={handleUpdateProcessType} onDeleteProcessType={handleDeleteProcessType} />}
          {activeScreen === 'User Admin' && <UserAdminScreen companyDetails={companyDetails} onUpdate={handleUpdateCompanyDetails} />}
          {activeScreen === 'New Screen' && <ProductsScreen clients={clients} onAddClient={handleAddClient} processTypes={processTypes} onAddProcessType={handleAddProcessType} />}
          {activeScreen === 'Salary & Payslips' && <SalaryScreen employees={employees} attendanceRecords={attendanceRecords} onUpdateEmployee={handleUpdateEmployee} advances={advances} onSavePayslip={handleSavePayslip} companyDetails={companyDetails} payslips={payslips} />}
          {activeScreen === 'Attendance' && <AttendanceScreen employees={employees} attendanceRecords={attendanceRecords} onSave={handleSaveAttendance} />}
        </main>
      </div>
    </div>
  );
};

export default App;
