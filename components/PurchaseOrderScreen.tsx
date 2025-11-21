
import React, { useState, useMemo, useCallback } from 'react';
import PurchaseOrderForm from './PurchaseOrderForm';
import EmployeeAdvanceForm from './EmployeeAdvanceForm';
import OtherExpenseForm from './OtherExpenseForm';
import TimberExpenseForm from './TimberExpenseForm';
import TimberPaymentForm from './TimberPaymentForm';
import { PlusIcon, SearchIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, EditIcon, WalletIcon } from './Icons';
import type { PurchaseOrder, PurchaseShop, PONumberConfig, MasterItem, Employee, EmployeeAdvance, OtherExpense, ExpenseCategory, TimberExpense, SupplierPayment, SupplierPaymentNumberConfig } from '../App';
import ConfirmationModal from './ConfirmationModal';

interface PurchaseOrderScreenProps {
  purchaseOrders: PurchaseOrder[];
  onAddOrder: (newOrder: PurchaseOrder) => void;
  onUpdateOrder: (poNumberToUpdate: string, updatedOrder: PurchaseOrder) => void;
  onDeleteOrder: (poNumberToDelete: string) => void;
  purchaseShops: PurchaseShop[];
  onAddPurchaseShop: (newShop: Omit<PurchaseShop, 'id'>) => void;
  bankNames: string[];
  onAddBankName: (newBankName: string) => void;
  poNumberConfig: PONumberConfig;
  masterItems: MasterItem[];
  onAddMasterItem: (itemData: { name: string, rate: number }) => Promise<MasterItem | null>;
  advances: EmployeeAdvance[];
  employees: Employee[];
  onAddAdvance: (advance: Omit<EmployeeAdvance, 'id'>) => Promise<void>;
  onUpdateAdvance: (advance: EmployeeAdvance) => Promise<void>;
  onDeleteAdvance: (id: string) => void;
  otherExpenses: OtherExpense[];
  onAddOtherExpense: (expense: Omit<OtherExpense, 'id'>) => Promise<void>;
  onUpdateOtherExpense: (expense: OtherExpense) => Promise<void>;
  onDeleteOtherExpense: (id: string) => void;
  expenseCategories: ExpenseCategory[];
  onAddExpenseCategory: (name: string) => Promise<ExpenseCategory | null>;
  timberExpenses: TimberExpense[];
  onAddTimberExpense: (expense: Omit<TimberExpense, 'id'>) => Promise<void>;
  onUpdateTimberExpense: (expense: TimberExpense) => Promise<void>;
  onDeleteTimberExpense: (id: string) => void;
  supplierPayments: SupplierPayment[];
  supplierPaymentConfig: SupplierPaymentNumberConfig;
  onAddSupplierPayment: (payment: Omit<SupplierPayment, 'id'>) => Promise<void>;
}

const toYMDString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Type for sortable column keys for Purchase Orders
type SortableKeys = 'poNumber' | 'poDate' | 'shopName' | 'dueDate' | 'totalAmount';
type TimberSortableKeys = 'date' | 'supplierName' | 'amount' | 'dueDate' | 'paidAmount' | 'balanceAmount';

// Type for sort configuration for Purchase Orders
interface SortConfig {
  key: SortableKeys;
  direction: 'ascending' | 'descending';
}

interface TimberSortConfig {
  key: TimberSortableKeys;
  direction: 'ascending' | 'descending';
}


interface DisplayAdvance extends EmployeeAdvance {
    employeeName: string;
}

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const parsePaymentTerms = (terms: string | undefined): number => {
    if (!terms) return Infinity;
    const lowerTerms = terms.toLowerCase();
    if (lowerTerms.includes('due on receipt')) return 0;
    
    const match = lowerTerms.match(/(\d+)/);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    
    return Infinity;
};

const PurchaseOrderScreen: React.FC<PurchaseOrderScreenProps> = ({
  purchaseOrders, onAddOrder, onUpdateOrder, onDeleteOrder,
  purchaseShops, onAddPurchaseShop, bankNames, onAddBankName,
  poNumberConfig, masterItems, onAddMasterItem,
  advances, employees, onAddAdvance, onUpdateAdvance, onDeleteAdvance,
  otherExpenses, onAddOtherExpense, onUpdateOtherExpense, onDeleteOtherExpense,
  expenseCategories, onAddExpenseCategory,
  timberExpenses, onAddTimberExpense, onUpdateTimberExpense, onDeleteTimberExpense,
  supplierPayments, supplierPaymentConfig, onAddSupplierPayment
}) => {
  const [activeTab, setActiveTab] = useState<'purchases' | 'advances' | 'other' | 'timber'>('purchases');

  // State for Purchase Orders
  const [showPOForm, setShowPOForm] = useState(false);
  const [poSearchTerm, setPoSearchTerm] = useState('');
  const [orderToEdit, setOrderToEdit] = useState<PurchaseOrder | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'poDate', direction: 'descending' });
  const [poToDelete, setPoToDelete] = useState<string | null>(null);

  // State for Employee Advances
  const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false);
  const [advanceToEdit, setAdvanceToEdit] = useState<EmployeeAdvance | null>(null);
  const [advanceToDelete, setAdvanceToDelete] = useState<DisplayAdvance | null>(null);
  const [advanceSearchTerm, setAdvanceSearchTerm] = useState('');

  // State for Other Expenses
  const [isOtherExpenseFormOpen, setIsOtherExpenseFormOpen] = useState(false);
  const [otherExpenseToEdit, setOtherExpenseToEdit] = useState<OtherExpense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<OtherExpense | null>(null);
  const [otherExpenseSearchTerm, setOtherExpenseSearchTerm] = useState('');

  // State for Timber Expenses
  const [isTimberFormOpen, setIsTimberFormOpen] = useState(false);
  const [timberToEdit, setTimberToEdit] = useState<TimberExpense | null>(null);
  const [timberSortConfig, setTimberSortConfig] = useState<TimberSortConfig>({ key: 'date', direction: 'descending' });
  const [timberToDelete, setTimberToDelete] = useState<TimberExpense | null>(null);
  const [timberSearchTerm, setTimberSearchTerm] = useState('');
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);


  const getDueDate = useCallback((item: PurchaseOrder | OtherExpense | TimberExpense): Date | null => {
      const itemDate = 'poDate' in item ? item.poDate : item.date;
      if (!itemDate) return null;
      const days = parsePaymentTerms(item.paymentTerms);
      if (days === Infinity) return null;
      const date = new Date(itemDate + 'T00:00:00');
      date.setDate(date.getDate() + days);
      return date;
  }, []);

  // Memoized data for Purchase Orders
  const processedOrders = useMemo(() => {
    let filteredData = [...purchaseOrders];
    if (poSearchTerm) {
      const lowercasedTerm = poSearchTerm.toLowerCase();
      filteredData = filteredData.filter(
        (order) =>
          order.poNumber.toLowerCase().includes(lowercasedTerm) ||
          order.shopName.toLowerCase().includes(lowercasedTerm) ||
          order.gstNo.toLowerCase().includes(lowercasedTerm)
      );
    }
    if (sortConfig.key) {
        filteredData.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            if (sortConfig.key === 'dueDate') {
                aValue = getDueDate(a)?.getTime() ?? (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
                bValue = getDueDate(b)?.getTime() ?? (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
            } else {
                aValue = a[sortConfig.key as Exclude<SortableKeys, 'dueDate'>];
                bValue = b[sortConfig.key as Exclude<SortableKeys, 'dueDate'>];
            }

            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }
    return filteredData;
  }, [purchaseOrders, poSearchTerm, sortConfig, getDueDate]);
  
  // Handlers for Purchase Orders
  const handleSaveOrder = (orderData: PurchaseOrder) => {
    if (orderToEdit) {
      onUpdateOrder(orderToEdit.poNumber, orderData);
    } else {
      onAddOrder(orderData);
    }
    setShowPOForm(false);
    setOrderToEdit(null);
  };
  
  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (columnKey: SortableKeys) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ascending' 
      ? <ChevronUpIcon className="w-4 h-4 ml-1" /> 
      : <ChevronDownIcon className="w-4 h-4 ml-1" />;
  };

  // Memoized data for Employee Advances
  const employeeMap = useMemo(() => new Map(employees.map(e => [e.id, e.name])), [employees]);

  const filteredAdvances = useMemo(() => {
      const displayAdvances: DisplayAdvance[] = advances.map(adv => ({
          ...adv,
          employeeName: employeeMap.get(adv.employeeId) || 'Unknown Employee',
      }));
      const sorted = [...displayAdvances].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (!advanceSearchTerm) return sorted;
      const lowercasedTerm = advanceSearchTerm.toLowerCase();
      return sorted.filter(p =>
          p.employeeName.toLowerCase().includes(lowercasedTerm) ||
          (p.notes && p.notes.toLowerCase().includes(lowercasedTerm))
      );
  }, [advances, advanceSearchTerm, employeeMap]);

  // Handlers for Employee Advances
  const handleSaveAdvance = useCallback(async (advanceData: Omit<EmployeeAdvance, 'id'> | EmployeeAdvance) => {
      try {
          if ('id' in advanceData && advanceToEdit) {
              await onUpdateAdvance(advanceData as EmployeeAdvance);
          } else {
              await onAddAdvance(advanceData as Omit<EmployeeAdvance, 'id'>);
          }
          setIsAdvanceFormOpen(false);
          setAdvanceToEdit(null);
      } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
          alert(`Error saving advance:\n${errorMessage}`);
      }
  }, [advanceToEdit, onAddAdvance, onUpdateAdvance]);

  // Memoized data for Other Expenses
  const filteredOtherExpenses = useMemo(() => {
    const sorted = [...otherExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (!otherExpenseSearchTerm) return sorted;
    const lowercasedTerm = otherExpenseSearchTerm.toLowerCase();
    return sorted.filter(p =>
        p.itemName.toLowerCase().includes(lowercasedTerm) ||
        (p.notes && p.notes.toLowerCase().includes(lowercasedTerm))
    );
  }, [otherExpenses, otherExpenseSearchTerm]);

  // Handlers for Other Expenses
  const handleSaveOtherExpense = useCallback(async (expenseData: Omit<OtherExpense, 'id'> | OtherExpense) => {
    try {
        if ('id' in expenseData && otherExpenseToEdit) {
            await onUpdateOtherExpense(expenseData as OtherExpense);
        } else {
            await onAddOtherExpense(expenseData as Omit<OtherExpense, 'id'>);
        }
        setIsOtherExpenseFormOpen(false);
        setOtherExpenseToEdit(null);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        alert(`Error saving expense:\n${errorMessage}`);
    }
  }, [otherExpenseToEdit, onAddOtherExpense, onUpdateOtherExpense]);
  
    // Handlers for Timber
    const requestTimberSort = (key: TimberSortableKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (timberSortConfig.key === key && timberSortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setTimberSortConfig({ key, direction });
    };
    
    const getTimberSortIndicator = (columnKey: TimberSortableKeys) => {
        if (timberSortConfig.key !== columnKey) return null;
        return timberSortConfig.direction === 'ascending' 
          ? <ChevronUpIcon className="w-4 h-4 ml-1" /> 
          : <ChevronDownIcon className="w-4 h-4 ml-1" />;
    };

    // Memoized data for Timber Expenses with Allocation
    const enrichedTimberExpenses = useMemo(() => {
        // 1. Group expenses by supplier
        const expensesBySupplier: Record<string, TimberExpense[]> = {};
        timberExpenses.forEach(e => {
            if (!expensesBySupplier[e.supplierName]) expensesBySupplier[e.supplierName] = [];
            expensesBySupplier[e.supplierName].push(e);
        });

        // 2. Group payments by supplier
        const paymentsBySupplier: Record<string, number> = {};
        supplierPayments.forEach(p => {
            paymentsBySupplier[p.supplierName] = (paymentsBySupplier[p.supplierName] || 0) + p.amount;
        });

        const enriched: (TimberExpense & { paidAmount: number; balanceAmount: number })[] = [];
        
        Object.keys(expensesBySupplier).forEach(supplier => {
            // Sort by Date ASC for FIFO allocation
            const supplierExpenses = expensesBySupplier[supplier].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            let totalPaid = paymentsBySupplier[supplier] || 0;

            supplierExpenses.forEach(exp => {
                const paidForThis = Math.min(exp.amount, totalPaid);
                totalPaid = Math.max(0, totalPaid - paidForThis);
                
                enriched.push({
                    ...exp,
                    paidAmount: paidForThis,
                    balanceAmount: exp.amount - paidForThis
                });
            });
        });
        
        // Handle any expenses that might have no supplier name (should be rare due to validation)
        timberExpenses.forEach(e => {
            if (!e.supplierName) {
                enriched.push({ ...e, paidAmount: 0, balanceAmount: e.amount });
            }
        });

        return enriched;
    }, [timberExpenses, supplierPayments]);

    // Memoized data for Timber Expenses
    const filteredTimberExpenses = useMemo(() => {
        let filteredData = [...enrichedTimberExpenses];
        if (timberSearchTerm) {
            const lowercasedTerm = timberSearchTerm.toLowerCase();
            filteredData = filteredData.filter(p =>
                p.supplierName.toLowerCase().includes(lowercasedTerm) ||
                (p.notes && p.notes.toLowerCase().includes(lowercasedTerm))
            );
        }
        if (timberSortConfig.key) {
            filteredData.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (timberSortConfig.key === 'dueDate') {
                    aValue = getDueDate(a)?.getTime() ?? (timberSortConfig.direction === 'ascending' ? Infinity : -Infinity);
                    bValue = getDueDate(b)?.getTime() ?? (timberSortConfig.direction === 'ascending' ? Infinity : -Infinity);
                } else {
                    aValue = a[timberSortConfig.key as Exclude<TimberSortableKeys, 'dueDate'>];
                    bValue = b[timberSortConfig.key as Exclude<TimberSortableKeys, 'dueDate'>];
                }

                if (aValue < bValue) return timberSortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return timberSortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filteredData;
  }, [enrichedTimberExpenses, timberSearchTerm, timberSortConfig, getDueDate]);

  // Handlers for Timber Expenses
  const handleSaveTimberExpense = useCallback(async (expenseData: Omit<TimberExpense, 'id'> | TimberExpense) => {
    try {
        if ('id' in expenseData && timberToEdit) {
            await onUpdateTimberExpense(expenseData as TimberExpense);
        } else {
            await onAddTimberExpense(expenseData as Omit<TimberExpense, 'id'>);
        }
        setIsTimberFormOpen(false);
        setTimberToEdit(null);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        alert(`Error saving timber expense:\n${errorMessage}`);
    }
  }, [timberToEdit, onAddTimberExpense, onUpdateTimberExpense]);

  const handleSavePayment = useCallback(async (payment: Omit<SupplierPayment, 'id'>) => {
      try {
          await onAddSupplierPayment(payment);
          setIsPaymentFormOpen(false);
          alert('Payment recorded successfully!');
      } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
          alert(`Error saving payment:\n${errorMessage}`);
      }
  }, [onAddSupplierPayment]);


  const tabButtonClasses = (tabName: 'purchases' | 'advances' | 'other' | 'timber') => 
    `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm ${
        activeTab === tabName 
        ? 'border-primary-500 text-primary-600' 
        : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
    }`;

  return (
    <div className="bg-white rounded-lg shadow-sm">
        {showPOForm && <PurchaseOrderForm onClose={() => setShowPOForm(false)} onSave={handleSaveOrder} purchaseShops={purchaseShops} onAddPurchaseShop={onAddPurchaseShop} bankNames={bankNames} onAddBankName={onAddBankName} poNumberConfig={poNumberConfig} orderToEdit={orderToEdit} masterItems={masterItems} onAddMasterItem={onAddMasterItem} />}
        {poToDelete && <ConfirmationModal isOpen={!!poToDelete} onClose={() => setPoToDelete(null)} onConfirm={() => { if (poToDelete) { onDeleteOrder(poToDelete); setPoToDelete(null); } }} title="Delete Purchase Order" message={<>Are you sure you want to delete Purchase Order <strong className="font-semibold text-secondary-800">{poToDelete}</strong>? This action cannot be undone.</>} confirmText="Yes, Delete" cancelText="No, Keep It" />}
        {isAdvanceFormOpen && <EmployeeAdvanceForm onClose={() => setIsAdvanceFormOpen(false)} onSave={handleSaveAdvance} employees={employees} advanceToEdit={advanceToEdit} />}
        {advanceToDelete && <ConfirmationModal isOpen={!!advanceToDelete} onClose={() => setAdvanceToDelete(null)} onConfirm={() => { if (advanceToDelete) { onDeleteAdvance(advanceToDelete.id); setAdvanceToDelete(null); } }} title="Delete Employee Advance" message={`Are you sure you want to delete this advance of ₹${advanceToDelete.amount} for ${advanceToDelete.employeeName}? This action cannot be undone.`} />}
        {isOtherExpenseFormOpen && <OtherExpenseForm onClose={() => setIsOtherExpenseFormOpen(false)} onSave={handleSaveOtherExpense} expenseToEdit={otherExpenseToEdit} expenseCategories={expenseCategories} onAddExpenseCategory={onAddExpenseCategory} bankNames={bankNames} onAddBankName={onAddBankName} />}
        {expenseToDelete && <ConfirmationModal isOpen={!!expenseToDelete} onClose={() => setExpenseToDelete(null)} onConfirm={() => { if (expenseToDelete) { onDeleteOtherExpense(expenseToDelete.id); setExpenseToDelete(null); } }} title="Delete Expense" message={`Are you sure you want to delete this expense for ${expenseToDelete.itemName} of ₹${expenseToDelete.amount}?`} />}
        {isTimberFormOpen && <TimberExpenseForm onClose={() => setIsTimberFormOpen(false)} onSave={handleSaveTimberExpense} expenseToEdit={timberToEdit} suppliers={purchaseShops} onAddSupplier={onAddPurchaseShop} bankNames={bankNames} onAddBankName={onAddBankName} />}
        {timberToDelete && <ConfirmationModal isOpen={!!timberToDelete} onClose={() => setTimberToDelete(null)} onConfirm={() => { if (timberToDelete) { onDeleteTimberExpense(timberToDelete.id); setTimberToDelete(null); } }} title="Delete Timber Expense" message={`Are you sure you want to delete this timber expense from ${timberToDelete.supplierName} of ₹${timberToDelete.amount}?`} />}
        {isPaymentFormOpen && <TimberPaymentForm onClose={() => setIsPaymentFormOpen(false)} onSave={handleSavePayment} suppliers={purchaseShops} paymentConfig={supplierPaymentConfig} timberExpenses={timberExpenses} supplierPayments={supplierPayments} />}
        
        <div className="p-5 border-b border-secondary-200">
            <h1 className="text-2xl font-bold text-secondary-800">Expenses</h1>
            <p className="text-secondary-500 mt-1">Track company expenses from purchase orders, employee advances, and other sources.</p>
        </div>
        
        <div className="border-b border-secondary-200 px-5">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button onClick={() => setActiveTab('purchases')} className={tabButtonClasses('purchases')}>Purchase Orders</button>
                <button onClick={() => setActiveTab('advances')} className={tabButtonClasses('advances')}>Employee Advances</button>
                <button onClick={() => setActiveTab('other')} className={tabButtonClasses('other')}>Other Expenses</button>
                <button onClick={() => setActiveTab('timber')} className={tabButtonClasses('timber')}>Timber</button>
            </nav>
        </div>
        
        {activeTab === 'purchases' && (
            <div className="p-5 space-y-5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative flex-grow w-full md:w-auto">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                    <input type="text" placeholder="Search by PO#, Shop Name, or GST..." value={poSearchTerm} onChange={(e) => setPoSearchTerm(e.target.value)} className="w-full md:w-64 pl-10 pr-4 py-2.5 text-sm border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <button onClick={() => { setOrderToEdit(null); setShowPOForm(true); }} className="flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary-700 w-full md:w-auto">
                    <PlusIcon className="w-5 h-5 mr-2" />New Purchase Order
                  </button>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left text-secondary-500">
                        <thead className="text-xs text-secondary-700 uppercase bg-secondary-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-secondary-100" onClick={() => requestSort('poNumber')}>
                                    <div className="flex items-center">PO Number {getSortIndicator('poNumber')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-secondary-100" onClick={() => requestSort('poDate')}>
                                    <div className="flex items-center">Date {getSortIndicator('poDate')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-secondary-100" onClick={() => requestSort('shopName')}>
                                    <div className="flex items-center">Shop Name {getSortIndicator('shopName')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-secondary-100" onClick={() => requestSort('dueDate')}>
                                    <div className="flex items-center">Due Date {getSortIndicator('dueDate')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-right cursor-pointer hover:bg-secondary-100" onClick={() => requestSort('totalAmount')}>
                                    <div className="flex items-center justify-end">Amount {getSortIndicator('totalAmount')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedOrders.map((order) => {
                                const dueDate = getDueDate(order);
                                const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                                const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && order.status !== 'Paid';
                                
                                return (
                                <tr key={order.poNumber} className="bg-white border-b hover:bg-secondary-50">
                                    <th scope="row" className="px-6 py-4 font-medium text-secondary-900 whitespace-nowrap">{order.poNumber}</th>
                                    <td className="px-6 py-4">{formatDateForDisplay(order.poDate)}</td>
                                    <td className="px-6 py-4">{order.shopName}</td>
                                    <td className="px-6 py-4">
                                        <div>{dueDate ? formatDateForDisplay(toYMDString(dueDate)) : '-'}</div>
                                        {daysUntilDue !== null && order.status !== 'Paid' && (
                                            <div className={`text-xs mt-0.5 ${isOverdue ? 'text-danger-600 font-medium' : 'text-secondary-500'}`}>
                                                {isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} day(s)` : `Due in ${daysUntilDue} day(s)`}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                            order.status === 'Paid' ? 'bg-success-100 text-success-800' : 
                                            isOverdue ? 'bg-danger-100 text-danger-800' : 'bg-warning-100 text-warning-800'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium">₹{order.totalAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-4">
                                            <button onClick={() => { setOrderToEdit(order); setShowPOForm(true); }} className="p-1 text-secondary-400 hover:text-primary-500 rounded-full hover:bg-primary-50" aria-label="Edit order"><EditIcon className="w-5 h-5" /></button>
                                            <button onClick={() => setPoToDelete(order.poNumber)} className="p-1 text-secondary-400 hover:text-danger-500 rounded-full hover:bg-danger-50" aria-label="Delete order"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    {processedOrders.length === 0 && <div className="text-center p-8 text-secondary-500">No purchase orders found.</div>}
                </div>
            </div>
        )}

        {activeTab === 'advances' && (
            <div className="p-5 space-y-5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative flex-grow w-full md:w-auto">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                        <input type="text" placeholder="Search by employee or notes..." value={advanceSearchTerm} onChange={(e) => setAdvanceSearchTerm(e.target.value)} className="w-full md:w-64 pl-10 pr-4 py-2.5 text-sm border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <button onClick={() => { setAdvanceToEdit(null); setIsAdvanceFormOpen(true); }} className="flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary-700 w-full md:w-auto">
                        <PlusIcon className="w-5 h-5 mr-2" />New Advance
                    </button>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left text-secondary-500">
                        <thead className="text-xs text-secondary-700 uppercase bg-secondary-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Employee Name</th>
                                <th scope="col" className="px-6 py-3 text-right">Advance Amount</th>
                                <th scope="col" className="px-6 py-3 text-right">Paid Amount</th>
                                <th scope="col" className="px-6 py-3 text-right">Balance Amount</th>
                                <th scope="col" className="px-6 py-3">Notes</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdvances.map((advance) => {
                                const balanceAmount = advance.amount - advance.paidAmount;
                                return (
                                <tr key={advance.id} className="bg-white border-b hover:bg-secondary-50">
                                    <td className="px-6 py-4">{formatDateForDisplay(advance.date)}</td>
                                    <td className="px-6 py-4 font-medium text-secondary-900">{advance.employeeName}</td>
                                    <td className="px-6 py-4 text-right font-medium">₹{advance.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right text-success-600">₹{advance.paidAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-danger-600">₹{balanceAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4">{advance.notes || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-4">
                                            <button onClick={() => { setAdvanceToEdit(advance); setIsAdvanceFormOpen(true); }} className="p-1 text-secondary-400 hover:text-primary-500 rounded-full hover:bg-primary-50" aria-label="Edit advance"><EditIcon className="w-5 h-5" /></button>
                                            <button onClick={() => setAdvanceToDelete(advance)} className="p-1 text-secondary-400 hover:text-danger-500 rounded-full hover:bg-danger-50" aria-label="Delete advance"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredAdvances.length === 0 && <div className="text-center p-8 text-secondary-500">No advance payments found.</div>}
                </div>
            </div>
        )}

        {activeTab === 'other' && (
             <div className="p-5 space-y-5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative flex-grow w-full md:w-auto">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                        <input type="text" placeholder="Search by item or notes..." value={otherExpenseSearchTerm} onChange={(e) => setOtherExpenseSearchTerm(e.target.value)} className="w-full md:w-64 pl-10 pr-4 py-2.5 text-sm border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <button onClick={() => { setOtherExpenseToEdit(null); setIsOtherExpenseFormOpen(true); }} className="flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary-700 w-full md:w-auto">
                        <PlusIcon className="w-5 h-5 mr-2" />New Expense
                    </button>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left text-secondary-500">
                        <thead className="text-xs text-secondary-700 uppercase bg-secondary-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Category</th>
                                <th scope="col" className="px-6 py-3">Due Date</th>
                                <th scope="col" className="px-6 py-3">Notes</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-right">Amount</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOtherExpenses.map((expense) => {
                                const dueDate = getDueDate(expense);
                                const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                                const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && expense.paymentStatus !== 'Paid';

                                return (
                                    <tr key={expense.id} className="bg-white border-b hover:bg-secondary-50">
                                        <td className="px-6 py-4">{formatDateForDisplay(expense.date)}</td>
                                        <td className="px-6 py-4 font-medium text-secondary-900">{expense.itemName}</td>
                                        <td className="px-6 py-4">
                                            <div>{dueDate ? formatDateForDisplay(toYMDString(dueDate)) : '-'}</div>
                                             {daysUntilDue !== null && expense.paymentStatus !== 'Paid' && (
                                                <div className={`text-xs mt-0.5 ${isOverdue ? 'text-danger-600 font-medium' : 'text-secondary-500'}`}>
                                                    {isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} day(s)` : `Due in ${daysUntilDue} day(s)`}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">{expense.notes || '-'}</td>
                                         <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                                expense.paymentStatus === 'Paid' ? 'bg-success-100 text-success-800' : 
                                                isOverdue ? 'bg-danger-100 text-danger-800' : 'bg-warning-100 text-warning-800'
                                            }`}>
                                                {expense.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">₹{expense.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                <button onClick={() => { setOtherExpenseToEdit(expense); setIsOtherExpenseFormOpen(true); }} className="p-1 text-secondary-400 hover:text-primary-500 rounded-full hover:bg-primary-50" aria-label="Edit expense"><EditIcon className="w-5 h-5" /></button>
                                                <button onClick={() => setExpenseToDelete(expense)} className="p-1 text-secondary-400 hover:text-danger-500 rounded-full hover:bg-danger-50" aria-label="Delete expense"><TrashIcon className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {filteredOtherExpenses.length === 0 && <div className="text-center p-8 text-secondary-500">No other expenses found.</div>}
                </div>
            </div>
        )}

        {activeTab === 'timber' && (
             <div className="p-5 space-y-5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative flex-grow w-full md:w-auto">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                        <input type="text" placeholder="Search by supplier or notes..." value={timberSearchTerm} onChange={(e) => setTimberSearchTerm(e.target.value)} className="w-full md:w-64 pl-10 pr-4 py-2.5 text-sm border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => { setTimberToEdit(null); setIsTimberFormOpen(true); }} className="flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary-700 w-full md:w-auto">
                            <PlusIcon className="w-5 h-5 mr-2" />New Timber Entry
                        </button>
                         <button onClick={() => { setIsPaymentFormOpen(true); }} className="flex items-center justify-center bg-success-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-success-700 w-full md:w-auto">
                            <WalletIcon className="w-5 h-5 mr-2" />Pay
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left text-secondary-500">
                        <thead className="text-xs text-secondary-700 uppercase bg-secondary-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-secondary-100" onClick={() => requestTimberSort('date')}>
                                    <div className="flex items-center">Date {getTimberSortIndicator('date')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-secondary-100" onClick={() => requestTimberSort('supplierName')}>
                                    <div className="flex items-center">Supplier {getTimberSortIndicator('supplierName')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3 cursor-pointer hover:bg-secondary-100" onClick={() => requestTimberSort('dueDate')}>
                                    <div className="flex items-center">Due Date {getTimberSortIndicator('dueDate')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-center">CFT</th>
                                <th scope="col" className="px-6 py-3 text-center">RATE</th>
                                <th scope="col" className="px-6 py-3 text-right cursor-pointer hover:bg-secondary-100" onClick={() => requestTimberSort('amount')}>
                                    <div className="flex items-center justify-end">Amount {getTimberSortIndicator('amount')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-right cursor-pointer hover:bg-secondary-100" onClick={() => requestTimberSort('paidAmount')}>
                                    <div className="flex items-center justify-end">Paid {getTimberSortIndicator('paidAmount')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-right cursor-pointer hover:bg-secondary-100" onClick={() => requestTimberSort('balanceAmount')}>
                                    <div className="flex items-center justify-end">Balance {getTimberSortIndicator('balanceAmount')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-center">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTimberExpenses.map((expense) => {
                                const dueDate = getDueDate(expense);
                                const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;
                                const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && expense.balanceAmount > 0;
                                const isPaid = expense.balanceAmount <= 0;

                                return (
                                    <tr key={expense.id} className="bg-white border-b hover:bg-secondary-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{formatDateForDisplay(expense.date)}</td>
                                        <td className="px-6 py-4 font-medium text-secondary-900">{expense.supplierName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>{dueDate ? formatDateForDisplay(toYMDString(dueDate)) : '-'}</div>
                                            {daysUntilDue !== null && !isPaid && (
                                                <div className={`text-xs mt-0.5 ${isOverdue ? 'text-danger-600 font-medium' : 'text-secondary-500'}`}>
                                                    {isOverdue ? `Due in ${Math.abs(daysUntilDue)} day(s)` : `Due in ${daysUntilDue} day(s)`}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">{expense.cft.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">₹{expense.rate.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-medium text-secondary-700">₹{expense.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-medium text-success-600">₹{expense.paidAmount.toFixed(2)}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${isPaid ? 'text-secondary-400' : 'text-danger-600'}`}>₹{expense.balanceAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                <button onClick={() => { setTimberToEdit(expense); setIsTimberFormOpen(true); }} className="p-1 text-secondary-400 hover:text-primary-500 rounded-full hover:bg-primary-50" aria-label="Edit expense"><EditIcon className="w-5 h-5" /></button>
                                                <button onClick={() => setTimberToDelete(expense)} className="p-1 text-secondary-400 hover:text-danger-500 rounded-full hover:bg-danger-50" aria-label="Delete expense"><TrashIcon className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {filteredTimberExpenses.length === 0 && <div className="text-center p-8 text-secondary-500">No timber expenses found.</div>}
                </div>
            </div>
        )}
    </div>
  );
};

export default PurchaseOrderScreen;
