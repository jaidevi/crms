import React, { useState, useMemo, useCallback } from 'react';
import PurchaseOrderForm from './PurchaseOrderForm';
import EmployeeAdvanceForm from './EmployeeAdvanceForm';
import OtherExpenseForm from './OtherExpenseForm';
import { PlusIcon, SearchIcon, TrashIcon, ChevronUpIcon, ChevronDownIcon, EditIcon } from './Icons';
// FIX: Added Employee, EmployeeAdvance, and OtherExpense types.
import type { PurchaseOrder, PurchaseShop, PONumberConfig, MasterItem, Employee, EmployeeAdvance, OtherExpense, ExpenseCategory } from '../App';
import ConfirmationModal from './ConfirmationModal';

// FIX: Added props for advances and other expenses to fix type error.
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
}

// Type for sortable column keys for Purchase Orders
type SortableKeys = 'poNumber' | 'poDate' | 'shopName' | 'totalAmount';

// Type for sort configuration for Purchase Orders
interface SortConfig {
  key: SortableKeys;
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

const PurchaseOrderScreen: React.FC<PurchaseOrderScreenProps> = ({
  purchaseOrders, onAddOrder, onUpdateOrder, onDeleteOrder,
  purchaseShops, onAddPurchaseShop, bankNames, onAddBankName,
  poNumberConfig, masterItems, onAddMasterItem,
  advances, employees, onAddAdvance, onUpdateAdvance, onDeleteAdvance,
  otherExpenses, onAddOtherExpense, onUpdateOtherExpense, onDeleteOtherExpense,
  expenseCategories, onAddExpenseCategory
}) => {
  const [activeTab, setActiveTab] = useState<'purchases' | 'advances' | 'other'>('purchases');

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
  const [expenseToEdit, setExpenseToEdit] = useState<OtherExpense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<OtherExpense | null>(null);
  const [otherExpenseSearchTerm, setOtherExpenseSearchTerm] = useState('');

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
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filteredData;
  }, [purchaseOrders, poSearchTerm, sortConfig]);
  
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
  const handleSaveAdvance = useCallback(async (advanceData: EmployeeAdvance) => {
      try {
          if (advanceToEdit) {
              await onUpdateAdvance(advanceData);
          } else {
              const { id, ...newAdvanceData } = advanceData;
              await onAddAdvance(newAdvanceData);
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
  const handleSaveOtherExpense = useCallback(async (expenseData: OtherExpense) => {
    try {
        if (expenseToEdit) {
            await onUpdateOtherExpense(expenseData);
        } else {
            const { id, ...newExpenseData } = expenseData;
            await onAddOtherExpense(newExpenseData);
        }
        setIsOtherExpenseFormOpen(false);
        setExpenseToEdit(null);
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        alert(`Error saving expense:\n${errorMessage}`);
    }
  }, [expenseToEdit, onAddOtherExpense, onUpdateOtherExpense]);
  
  const tabButtonClasses = (tabName: 'purchases' | 'advances' | 'other') => 
    `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm ${
        activeTab === tabName 
        ? 'border-blue-500 text-blue-600' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <div className="bg-white rounded-lg shadow-sm">
        {showPOForm && <PurchaseOrderForm onClose={() => setShowPOForm(false)} onSave={handleSaveOrder} purchaseShops={purchaseShops} onAddPurchaseShop={onAddPurchaseShop} bankNames={bankNames} onAddBankName={onAddBankName} poNumberConfig={poNumberConfig} orderToEdit={orderToEdit} masterItems={masterItems} onAddMasterItem={onAddMasterItem} />}
        {poToDelete && <ConfirmationModal isOpen={!!poToDelete} onClose={() => setPoToDelete(null)} onConfirm={() => { if (poToDelete) { onDeleteOrder(poToDelete); setPoToDelete(null); } }} title="Delete Purchase Order" message={<>Are you sure you want to delete Purchase Order <strong className="font-semibold text-gray-800">{poToDelete}</strong>? This action cannot be undone.</>} confirmText="Yes, Delete" cancelText="No, Keep It" />}
        {isAdvanceFormOpen && <EmployeeAdvanceForm onClose={() => setIsAdvanceFormOpen(false)} onSave={handleSaveAdvance} employees={employees} advanceToEdit={advanceToEdit} />}
        {advanceToDelete && <ConfirmationModal isOpen={!!advanceToDelete} onClose={() => setAdvanceToDelete(null)} onConfirm={() => { if (advanceToDelete) { onDeleteAdvance(advanceToDelete.id); setAdvanceToDelete(null); } }} title="Delete Employee Advance" message={`Are you sure you want to delete this advance of ₹${advanceToDelete.amount} for ${advanceToDelete.employeeName}? This action cannot be undone.`} />}
        {isOtherExpenseFormOpen && <OtherExpenseForm onClose={() => setIsOtherExpenseFormOpen(false)} onSave={handleSaveOtherExpense} expenseToEdit={expenseToEdit} expenseCategories={expenseCategories} onAddExpenseCategory={onAddExpenseCategory} bankNames={bankNames} onAddBankName={onAddBankName} />}
        {expenseToDelete && <ConfirmationModal isOpen={!!expenseToDelete} onClose={() => setExpenseToDelete(null)} onConfirm={() => { if (expenseToDelete) { onDeleteOtherExpense(expenseToDelete.id); setExpenseToDelete(null); } }} title="Delete Expense" message={`Are you sure you want to delete this expense for ${expenseToDelete.itemName} of ₹${expenseToDelete.amount}?`} />}
        
        <div className="p-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
            <p className="text-gray-500 mt-1">Track company expenses from purchase orders, employee advances, and other sources.</p>
        </div>
        
        <div className="border-b border-gray-200 px-5">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button onClick={() => setActiveTab('purchases')} className={tabButtonClasses('purchases')}>Purchase Orders</button>
                <button onClick={() => setActiveTab('advances')} className={tabButtonClasses('advances')}>Employee Advances</button>
                <button onClick={() => setActiveTab('other')} className={tabButtonClasses('other')}>Other Expenses</button>
            </nav>
        </div>
        
        {activeTab === 'purchases' && (
            <div className="p-5 space-y-5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative flex-grow w-full md:w-auto">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Search by PO#, Shop Name, or GST..." value={poSearchTerm} onChange={(e) => setPoSearchTerm(e.target.value)} className="w-full md:w-64 pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <button onClick={() => { setOrderToEdit(null); setShowPOForm(true); }} className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 w-full md:w-auto">
                    <PlusIcon className="w-5 h-5 mr-2" />New Purchase Order
                  </button>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3"><button onClick={() => requestSort('poNumber')} className="flex items-center font-medium hover:text-gray-900">PO Number {getSortIndicator('poNumber')}</button></th>
                                <th scope="col" className="px-6 py-3"><button onClick={() => requestSort('poDate')} className="flex items-center font-medium hover:text-gray-900">Date {getSortIndicator('poDate')}</button></th>
                                <th scope="col" className="px-6 py-3"><button onClick={() => requestSort('shopName')} className="flex items-center font-medium hover:text-gray-900">Shop Name {getSortIndicator('shopName')}</button></th>
                                <th scope="col" className="px-6 py-3 font-medium">Status</th>
                                <th scope="col" className="px-6 py-3"><button onClick={() => requestSort('totalAmount')} className="flex items-center w-full justify-end font-medium hover:text-gray-900">Amount {getSortIndicator('totalAmount')}</button></th>
                                <th scope="col" className="px-6 py-3 text-center font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedOrders.map((order) => (
                                <tr key={order.poNumber} className="bg-white border-b hover:bg-gray-50">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"><button onClick={() => { setOrderToEdit(order); setShowPOForm(true); }} className="text-blue-600 hover:underline font-medium">{order.poNumber}</button></th>
                                    <td className="px-6 py-4">{formatDateForDisplay(order.poDate)}</td>
                                    <td className="px-6 py-4">{order.shopName}</td>
                                    <td className="px-6 py-4"><span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{order.status}</span></td>
                                    <td className="px-6 py-4 text-right font-medium">₹{order.totalAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center"><button onClick={() => setPoToDelete(order.poNumber)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50" aria-label="Delete expense"><TrashIcon className="w-5 h-5" /></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {processedOrders.length === 0 && <div className="text-center p-8 text-gray-500">No purchase orders found.</div>}
                </div>
            </div>
        )}

        {activeTab === 'advances' && (
            <div className="p-5 space-y-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="relative flex-grow w-full md:w-auto"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Search by employee or notes..." value={advanceSearchTerm} onChange={(e) => setAdvanceSearchTerm(e.target.value)} className="w-full md:w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <button onClick={() => { setAdvanceToEdit(null); setIsAdvanceFormOpen(true); }} className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 whitespace-nowrap w-full md:w-auto"><PlusIcon className="w-5 h-5 mr-2" />New Advance</button>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th scope="col" className="px-6 py-3">Date</th><th scope="col" className="px-6 py-3">Employee Name</th><th scope="col" className="px-6 py-3 text-right">Advance Amount</th><th scope="col" className="px-6 py-3 text-right">Paid Amount</th><th scope="col" className="px-6 py-3 text-right">Balance Amount</th><th scope="col" className="px-6 py-3">Notes</th><th scope="col" className="px-6 py-3 text-center">Actions</th></tr></thead>
                        <tbody>
                            {filteredAdvances.map((advance) => {
                                const balanceAmount = advance.amount - advance.paidAmount;
                                return (
                                <tr key={advance.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{formatDateForDisplay(advance.date)}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{advance.employeeName}</td>
                                    <td className="px-6 py-4 text-right font-medium">₹{advance.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right text-green-600">₹{advance.paidAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-red-600">₹{balanceAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4">{advance.notes || '-'}</td>
                                    <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-4"><button onClick={() => {setAdvanceToEdit(advance); setIsAdvanceFormOpen(true);}} className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50" aria-label="Edit advance"><EditIcon className="w-5 h-5" /></button><button onClick={() => setAdvanceToDelete(advance)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50" aria-label="Delete advance"><TrashIcon className="w-5 h-5" /></button></div></td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredAdvances.length === 0 && <div className="text-center p-8 text-gray-500">No advance payments found.</div>}
                </div>
            </div>
        )}

        {activeTab === 'other' && (
             <div className="p-5 space-y-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="relative flex-grow w-full md:w-auto"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Search by item name or notes..." value={otherExpenseSearchTerm} onChange={(e) => setOtherExpenseSearchTerm(e.target.value)} className="w-full md:w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                    <button onClick={() => { setExpenseToEdit(null); setIsOtherExpenseFormOpen(true); }} className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 whitespace-nowrap w-full md:w-auto"><PlusIcon className="w-5 h-5 mr-2" />New Expense</button>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th scope="col" className="px-6 py-3">Date</th><th scope="col" className="px-6 py-3">Category</th><th scope="col" className="px-6 py-3 text-right">Amount</th><th scope="col" className="px-6 py-3">Payment Status</th><th scope="col" className="px-6 py-3">Notes</th><th scope="col" className="px-6 py-3 text-center">Actions</th></tr></thead>
                        <tbody>
                            {filteredOtherExpenses.map((expense) => (
                                <tr key={expense.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{formatDateForDisplay(expense.date)}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{expense.itemName}</td>
                                    <td className="px-6 py-4 text-right font-medium">₹{expense.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${expense.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {expense.paymentStatus || 'Paid'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">{expense.notes || '-'}</td>
                                    <td className="px-6 py-4 text-center"><div className="flex items-center justify-center gap-4"><button onClick={() => {setExpenseToEdit(expense); setIsOtherExpenseFormOpen(true);}} className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50" aria-label="Edit expense"><EditIcon className="w-5 h-5" /></button><button onClick={() => setExpenseToDelete(expense)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50" aria-label="Delete expense"><TrashIcon className="w-5 h-5" /></button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredOtherExpenses.length === 0 && <div className="text-center p-8 text-gray-500">No other expenses found.</div>}
                </div>
            </div>
        )}
    </div>
  );
};

export default PurchaseOrderScreen;