
import React, { useState, useMemo, useCallback } from 'react';
import EmployeeAdvanceForm from './EmployeeAdvanceForm';
import ConfirmationModal from './ConfirmationModal';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon } from './Icons';
import type { EmployeeAdvance, Employee, PurchaseOrder } from '../types';

interface DisplayAdvance extends EmployeeAdvance {
    employeeName: string;
}

interface ExpensesScreenProps {
  advances: EmployeeAdvance[];
  employees: Employee[];
  onAddAdvance: (advance: Omit<EmployeeAdvance, 'id'>) => Promise<void>;
  onUpdateAdvance: (advance: EmployeeAdvance) => Promise<void>;
  onDeleteAdvance: (id: string) => void;
  purchaseOrders: PurchaseOrder[];
}

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const ExpensesScreen: React.FC<ExpensesScreenProps> = ({
    advances, employees, onAddAdvance, onUpdateAdvance, onDeleteAdvance, purchaseOrders
}) => {
    const [activeTab, setActiveTab] = useState<'purchases' | 'advances'>('purchases');
    
    // --- Employee Advance Logic ---
    const [isAdvanceFormOpen, setIsAdvanceFormOpen] = useState(false);
    const [advanceToEdit, setAdvanceToEdit] = useState<EmployeeAdvance | null>(null);
    const [advanceToDelete, setAdvanceToDelete] = useState<DisplayAdvance | null>(null);
    const [advanceSearchTerm, setAdvanceSearchTerm] = useState('');

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

    const handleOpenAdvanceForNew = useCallback(() => { setAdvanceToEdit(null); setIsAdvanceFormOpen(true); }, []);
    const handleOpenAdvanceForEdit = useCallback((advance: EmployeeAdvance) => { setAdvanceToEdit(advance); setIsAdvanceFormOpen(true); }, []);
    const handleCloseAdvanceForm = useCallback(() => { setIsAdvanceFormOpen(false); setAdvanceToEdit(null); }, []);
    const handleDeleteAdvanceClick = useCallback((advance: DisplayAdvance) => { setAdvanceToDelete(advance); }, []);
    const handleConfirmAdvanceDelete = useCallback(() => {
        if (advanceToDelete) { onDeleteAdvance(advanceToDelete.id); setAdvanceToDelete(null); }
    }, [advanceToDelete, onDeleteAdvance]);

    // --- Purchase Order Logic ---
    const [purchaseSearchTerm, setPurchaseSearchTerm] = useState('');
    const filteredPurchaseOrders = useMemo(() => {
        const sorted = [...purchaseOrders].sort((a, b) => new Date(b.poDate).getTime() - new Date(a.poDate).getTime());
        if (!purchaseSearchTerm) return sorted;
        const lowercasedTerm = purchaseSearchTerm.toLowerCase();
        return sorted.filter(po =>
            po.poNumber.toLowerCase().includes(lowercasedTerm) ||
            po.shopName.toLowerCase().includes(lowercasedTerm) ||
            po.status.toLowerCase().includes(lowercasedTerm)
        );
    }, [purchaseOrders, purchaseSearchTerm]);
    
    const tabButtonClasses = (tabName: 'purchases' | 'advances') => 
        `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm ${
            activeTab === tabName 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;

    return (
        <div className="bg-white rounded-lg shadow-sm">
            {isAdvanceFormOpen && <EmployeeAdvanceForm onClose={handleCloseAdvanceForm} onSave={handleSaveAdvance} employees={employees} advanceToEdit={advanceToEdit} />}
            {advanceToDelete && <ConfirmationModal isOpen={!!advanceToDelete} onClose={() => setAdvanceToDelete(null)} onConfirm={handleConfirmAdvanceDelete} title="Delete Employee Advance" message={`Are you sure you want to delete this advance of ₹${advanceToDelete.amount} for ${advanceToDelete.employeeName}? This action cannot be undone.`} />}
            
            <div className="p-5 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
                <p className="text-gray-500 mt-1">Track company expenses from purchase orders and employee advances.</p>
            </div>
            
             <div className="border-b border-gray-200 px-5">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('purchases')} className={tabButtonClasses('purchases')}>
                        Purchase Orders
                    </button>
                    <button onClick={() => setActiveTab('advances')} className={tabButtonClasses('advances')}>
                        Employee Advances
                    </button>
                </nav>
            </div>
            
            {activeTab === 'purchases' && (
                <div className="p-5 space-y-5">
                    <div className="flex justify-start">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" placeholder="Search by PO#, Shop Name..." value={purchaseSearchTerm} onChange={(e) => setPurchaseSearchTerm(e.target.value)} className="w-full md:w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">PO Number</th>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                    <th scope="col" className="px-6 py-3">Shop Name</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                    <th scope="col" className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPurchaseOrders.map(order => (
                                    <tr key={order.poNumber} className="bg-white border-b hover:bg-gray-50">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{order.poNumber}</th>
                                        <td className="px-6 py-4">{formatDateForDisplay(order.poDate)}</td>
                                        <td className="px-6 py-4">{order.shopName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                                order.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">₹{order.totalAmount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredPurchaseOrders.length === 0 && <div className="text-center p-8 text-gray-500">No purchase orders found.</div>}
                    </div>
                </div>
            )}
            
            {activeTab === 'advances' && (
                <div className="p-5 space-y-5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="relative flex-grow w-full md:w-auto">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" placeholder="Search by employee or notes..." value={advanceSearchTerm} onChange={(e) => setAdvanceSearchTerm(e.target.value)} className="w-full md:w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <button onClick={handleOpenAdvanceForNew} className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 whitespace-nowrap w-full md:w-auto">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            New Advance
                        </button>
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
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
                                    <tr key={advance.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4">{formatDateForDisplay(advance.date)}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{advance.employeeName}</td>
                                        <td className="px-6 py-4 text-right font-medium">₹{advance.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-green-600">₹{advance.paidAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-red-600">₹{balanceAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4">{advance.notes || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-4">
                                                <button onClick={() => handleOpenAdvanceForEdit(advance)} className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50" aria-label="Edit advance"><EditIcon className="w-5 h-5" /></button>
                                                <button onClick={() => handleDeleteAdvanceClick(advance)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50" aria-label="Delete advance"><TrashIcon className="w-5 h-5" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredAdvances.length === 0 && <div className="text-center p-8 text-gray-500">No advance payments found.</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpensesScreen;
