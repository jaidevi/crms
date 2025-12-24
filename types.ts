
export type PaymentMode = 'Cash' | 'Cheque' | 'NEFT' | 'GPay' | 'Credit Card' | 'Bank Transfer' | 'Other';
export type OrderStatus = 'Paid' | 'Unpaid' | 'Partially Paid';
export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Holiday';

export interface CompanyDetails {
  name: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  gstin: string;
  hsnSac: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  logoUrl: string;
  reportNotificationEmail?: string;
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

export interface Employee {
  id: string;
  name: string;
  designation: string;
  phone: string;
  dailyWage: number;
  monthlyWage?: number;
  ratePerMeter: number;
}

export interface MasterItem {
  id: string;
  name: string;
  rate: number;
}

export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
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
  paymentTerms: string;
  referenceId?: string;
  bankName?: string;
  chequeDate?: string;
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
  itemName: string; // Used as category name
  amount: number;
  notes: string;
  bankName?: string;
  chequeDate?: string;
  paymentMode: PaymentMode;
  paymentStatus: OrderStatus;
  paymentTerms: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface TimberExpense {
  id: string;
  date: string;
  supplierName: string;
  openingBalance: number;
  loadWeight: number;
  vehicleWeight: number;
  cft: number;
  rate: number;
  amount: number;
  notes: string;
  bankName?: string;
  chequeDate?: string;
  paymentMode: PaymentMode;
  paymentStatus: OrderStatus;
  paymentTerms: string;
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
  splitProcess: string[];
  designNo: string;
  pcs: number;
  mtr: number;
  finalMeter: number;
  width: number;
  shrinkage: string;
  pin: string;
  pick: string;
  percentage: string;
  extraWork: string;
  status: string; // 'Not Delivered', 'Ready to Invoice', 'Delivered', 'Rework'
  workerName: string;
  workingUnit: string;
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
  taxType: 'GST' | 'NGST';
}

export interface PaymentReceived {
  id: string;
  clientName: string;
  paymentDate: string;
  amount: number;
  openingBalance: number;
  paymentMode: PaymentMode;
  referenceNumber: string;
  notes: string;
  image?: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string; // YYYY-MM-DD
  morningStatus: AttendanceStatus;
  eveningStatus: AttendanceStatus;
  morningOvertimeHours: number;
  eveningOvertimeHours: number;
  metersProduced: number;
  createdAt: string;
  updatedAt: string;
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