
import React, { useState, useMemo, useEffect } from 'react';
import DeliveryChallanForm from './DeliveryChallanForm';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, CameraIcon, PrintIcon } from './Icons';
import type { DeliveryChallan, Client, ProcessType, DeliveryChallanNumberConfig, Invoice, CompanyDetails, Employee, PurchaseShop } from '../App';
import ConfirmationModal from './ConfirmationModal';
import InvoiceView from './InvoiceView';
import ChallanView from './ChallanView';

interface DeliveryChallanScreenProps {
  deliveryChallans: DeliveryChallan[];
  onAddChallan: (newChallan: Omit<DeliveryChallan, 'id'>) => Promise<void>;
  onUpdateChallan: (id: string, updatedChallan: DeliveryChallan) => Promise<void>;
  onDeleteChallan: (id: string) => void;
  clients: Client[];
  onAddClient: (newClient: Omit<Client, 'id'>) => void;
  purchaseShops: PurchaseShop[];
  onAddPurchaseShop: (newShop: Omit<PurchaseShop, 'id'>) => void;
  processTypes: ProcessType[];
  onAddProcessType: (process: { name: string, rate: number }) => void;
  deliveryChallanNumberConfig: DeliveryChallanNumberConfig;
  invoices: Invoice[];
  onDeleteInvoice: (id: string) => void;
  companyDetails: CompanyDetails;
  employees: Employee[];
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
}

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const PaginationControls: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    startItem: number;
    endItem: number;
    totalItems: number;
}> = ({ currentPage, totalPages, onPageChange, startItem, endItem, totalItems }) => {
    if (!totalItems || totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-between p-4 border-t">
            <span className="text-sm text-gray-700">
                Showing <span className="font-semibold">{startItem}</span> to <span className="font-semibold">{endItem}</span> of <span className="font-semibold">{totalItems}</span> results
            </span>
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

const DeliveryChallanScreen: React.FC<DeliveryChallanScreenProps> = ({ 
    deliveryChallans,
    onAddChallan, 
    onUpdateChallan,
    onDeleteChallan,
    clients, 
    onAddClient, 
    purchaseShops,
    onAddPurchaseShop,
    processTypes, 
    onAddProcessType,
    deliveryChallanNumberConfig, 
    invoices,
    onDeleteInvoice,
    companyDetails,
    employees,
    onAddEmployee
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'delivered' | 'invoices' | 'outsourcing' | 'rework'>('delivered');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isChallanFormOpen, setIsChallanFormOpen] = useState(false);
  const [challanToEdit, setChallanToEdit] = useState<DeliveryChallan | null>(null);
  const [challanToDelete, setChallanToDelete] = useState<DeliveryChallan | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [challanToPrint, setChallanToPrint] = useState<DeliveryChallan | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const formatPartyNameForDisplay = (partyName: string) => {
    if (partyName.includes('|') && partyName.includes('FROM:')) {
        const fromMatch = partyName.match(/FROM: (.*?)\|/);
        return fromMatch ? fromMatch[1].trim() : partyName;
    }
    return partyName;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const clientForInvoice = useMemo(() => {
    if (!viewingInvoice) return null;
    return clients.find(c => c.name === viewingInvoice.clientName);
  }, [viewingInvoice, clients]);
  
  const invoicedChallanNumbers = useMemo(() => {
    return new Set(
        invoices.flatMap(invoice => 
            invoice.items.flatMap(item => item.challanNumber.split(',').map(s => s.trim()))
        )
    );
  }, [invoices]);

  const { pendingCount, deliveredCount, outsourcingCount, reworkCount } = useMemo(() => {
    const counts = { pending: 0, delivered: 0, outsourcing: 0, rework: 0 };
    for (const challan of deliveryChallans) {
        if (challan.status === 'Rework') {
            counts.rework++;
            continue;
        }
        if ((challan.status === 'Ready to Invoice' || challan.status === 'Delivered') && !invoicedChallanNumbers.has(challan.challanNumber.trim())) {
            counts.delivered++;
            continue;
        }
        if (challan.isOutsourcing && (challan.status !== 'Ready to Invoice' && challan.status !== 'Delivered')) {
            counts.outsourcing++;
            continue;
        }
        if (!challan.isOutsourcing && challan.status === 'Not Delivered') {
            counts.pending++;
        }
    }
    return { 
        pendingCount: counts.pending, 
        deliveredCount: counts.delivered, 
        outsourcingCount: counts.outsourcing, 
        reworkCount: counts.rework 
    };
  }, [deliveryChallans, invoicedChallanNumbers]);

  const filteredChallans = useMemo(() => {
    let listToFilter: DeliveryChallan[];
    switch (activeTab) {
        case 'pending':
            listToFilter = deliveryChallans.filter(c => !c.isOutsourcing && c.status === 'Not Delivered');
            break;
        case 'delivered':
            listToFilter = deliveryChallans.filter(c => (c.status === 'Ready to Invoice' || c.status === 'Delivered') && !invoicedChallanNumbers.has(c.challanNumber.trim()));
            break;
        case 'outsourcing':
            listToFilter = deliveryChallans.filter(c => c.isOutsourcing && (c.status !== 'Ready to Invoice' && c.status !== 'Delivered') && c.status !== 'Rework');
            break;
        case 'rework':
            listToFilter = deliveryChallans.filter(c => c.status === 'Rework');
            break;
        default:
            listToFilter = [];
    }

    const sortedList = listToFilter.sort((a, b) => {
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison !== 0) {
            return dateComparison;
        }
        return b.challanNumber.localeCompare(a.challanNumber, undefined, { numeric: true });
    });

    if (!searchTerm) {
        return sortedList;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return sortedList.filter(challan => 
        challan.partyName.toLowerCase().includes(lowercasedTerm) ||
        challan.challanNumber.toLowerCase().includes(lowercasedTerm) ||
        challan.designNo.toLowerCase().includes(lowercasedTerm)
    );
  }, [deliveryChallans, searchTerm, activeTab, invoicedChallanNumbers]);
  
  const filteredInvoices = useMemo(() => {
    const sortedList = [...invoices].sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
    if (!searchTerm) {
        return sortedList;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return sortedList.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(lowercasedTerm) ||
        invoice.clientName.toLowerCase().includes(lowercasedTerm)
    );
  }, [invoices, searchTerm]);

  const { paginatedChallans, totalChallanPages, challanStartItem, challanEndItem } = useMemo(() => {
    const totalItems = filteredChallans.length;
    if (totalItems === 0) return { paginatedChallans: [], totalChallanPages: 1, challanStartItem: 0, challanEndItem: 0 };
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filteredChallans.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    return { 
        paginatedChallans: paginatedItems, 
        totalChallanPages: totalPages,
        challanStartItem: startIndex + 1,
        challanEndItem: startIndex + paginatedItems.length
    };
  }, [filteredChallans, currentPage]);

  const { paginatedInvoices, totalInvoicePages, invoiceStartItem, invoiceEndItem } = useMemo(() => {
    const totalItems = filteredInvoices.length;
    if (totalItems === 0) return { paginatedInvoices: [], totalInvoicePages: 1, invoiceStartItem: 0, invoiceEndItem: 0 };
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filteredInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    return {
        paginatedInvoices: paginatedItems,
        totalInvoicePages: totalPages,
        invoiceStartItem: startIndex + 1,
        invoiceEndItem: startIndex + paginatedItems.length
    };
  }, [filteredInvoices, currentPage]);

  const handleCloseChallanForm = () => {
    setIsChallanFormOpen(false);
    setChallanToEdit(null);
  };

  const handleSaveChallan = async (challanData: Omit<DeliveryChallan, 'id'>) => {
    if (challanToEdit) {
        await onUpdateChallan(challanToEdit.id, { ...challanData, id: challanToEdit.id });
    } else {
        await onAddChallan(challanData);
    }
    
    if (challanData.status === 'Rework') {
        setActiveTab('rework');
    } else if (challanData.status === 'Not Delivered' && !challanData.isOutsourcing) {
        setActiveTab('pending');
    } else if (challanData.isOutsourcing && (challanData.status !== 'Ready to Invoice' && challanData.status !== 'Delivered')) {
        setActiveTab('outsourcing');
    } else {
        setActiveTab('delivered');
    }
    handleCloseChallanForm();
  };
  
  const handleOpenFormForNewChallan = () => {
    setChallanToEdit(null);
    setIsChallanFormOpen(true);
  };

  const handleOpenFormForEditChallan = (challan: DeliveryChallan) => {
    setChallanToEdit(challan);
    setIsChallanFormOpen(true);
  };

  if (challanToPrint) {
    return <ChallanView challan={challanToPrint} companyDetails={companyDetails} onBack={() => setChallanToPrint(null)} />;
  }

  if (viewingInvoice && clientForInvoice) {
    return <InvoiceView invoice={viewingInvoice} client={clientForInvoice} companyDetails={companyDetails} onBack={() => setViewingInvoice(null)} />;
  }

  return (
    <>
      {isChallanFormOpen && (
        <DeliveryChallanForm
          onClose={handleCloseChallanForm}
          onSave={handleSaveChallan}
          clients={clients}
          onAddClient={onAddClient}
          purchaseShops={purchaseShops}
          onAddPurchaseShop={onAddPurchaseShop}
          processTypes={processTypes}
          onAddProcessType={onAddProcessType}
          deliveryChallanNumberConfig={deliveryChallanNumberConfig}
          challanToEdit={challanToEdit}
          employees={employees}
          onAddEmployee={onAddEmployee}
          companyDetails={companyDetails}
        />
      )}
      {challanToDelete && (
        <ConfirmationModal
            isOpen={!!challanToDelete}
            onClose={() => setChallanToDelete(null)}
            onConfirm={() => { onDeleteChallan(challanToDelete.id); setChallanToDelete(null); }}
            title="Delete Delivery Challan"
            message={`Are you sure you want to delete challan number ${challanToDelete.challanNumber}? This cannot be undone.`}
        />
      )}
      {invoiceToDelete && (
        <ConfirmationModal
            isOpen={!!invoiceToDelete}
            onClose={() => setInvoiceToDelete(null)}
            onConfirm={() => { if(invoiceToDelete) onDeleteInvoice(invoiceToDelete.id); setInvoiceToDelete(null); }}
            title="Delete Invoice"
            message={`Are you sure you want to delete invoice ${invoiceToDelete.invoiceNumber}? This action cannot be undone.`}
        />
      )}
      <div className="bg-white rounded-lg shadow-sm p-5 space-y-5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Delivery Challans</h1>
                <p className="text-gray-500 mt-1">Manage, create, and view delivery challans.</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-grow">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button onClick={handleOpenFormForNewChallan} className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 whitespace-nowrap">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  New Challan
                </button>
            </div>
        </div>

        <div>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('pending')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Pending <span className="bg-yellow-100 text-yellow-800 text-xs font-medium ml-2 px-2 py-0.5 rounded-full">{pendingCount}</span>
                    </button>
                    <button onClick={() => setActiveTab('delivered')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'delivered' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Ready to Invoice <span className="bg-green-100 text-green-800 text-xs font-medium ml-2 px-2 py-0.5 rounded-full">{deliveredCount}</span>
                    </button>
                    <button onClick={() => setActiveTab('outsourcing')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'outsourcing' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Outsourcing <span className="bg-indigo-100 text-indigo-800 text-xs font-medium ml-2 px-2 py-0.5 rounded-full">{outsourcingCount}</span>
                    </button>
                    <button onClick={() => setActiveTab('rework')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'rework' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Rework <span className="bg-orange-100 text-orange-800 text-xs font-medium ml-2 px-2 py-0.5 rounded-full">{reworkCount}</span>
                    </button>
                    <button onClick={() => setActiveTab('invoices')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'invoices' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Generated Invoices <span className="bg-blue-100 text-blue-800 text-xs font-medium ml-2 px-2 py-0.5 rounded-full">{invoices.length}</span>
                    </button>
                </nav>
            </div>
        </div>
        
        {activeTab === 'invoices' ? (
             <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left text-gray-500">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Invoice #</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Client</th>
                            <th scope="col" className="px-6 py-3 text-right">Amount</th>
                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedInvoices.map(invoice => (
                            <tr key={invoice.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <button onClick={() => setViewingInvoice(invoice)} className="font-medium text-blue-600 hover:underline">
                                        {invoice.invoiceNumber}
                                    </button>
                                </td>
                                <td className="px-6 py-4">{formatDateForDisplay(invoice.invoiceDate)}</td>
                                <td className="px-6 py-4">{invoice.clientName}</td>
                                <td className="px-6 py-4 text-right font-medium">₹{invoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => setInvoiceToDelete(invoice)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50" title="Delete Invoice">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredInvoices.length === 0 && (
                     <div className="text-center p-8 text-gray-500">
                        No invoices found.
                    </div>
                )}
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalInvoicePages}
                    onPageChange={setCurrentPage}
                    startItem={invoiceStartItem}
                    endItem={invoiceEndItem}
                    totalItems={filteredInvoices.length}
                />
            </div>
        ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3">Challan #</th>
                    <th scope="col" className="px-4 py-3">Date</th>
                    <th scope="col" className="px-4 py-3">Party Name</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Party DC No</th>
                    <th scope="col" className="px-4 py-3">Process</th>
                    <th scope="col" className="px-4 py-3">Design No</th>
                    <th scope="col" className="px-4 py-3 text-right">Pcs</th>
                    <th scope="col" className="px-4 py-3 text-right">Mtr</th>
                    <th scope="col" className="px-4 py-3 text-right">Width</th>
                    <th scope="col" className="px-4 py-3">Shrinkage</th>
                    <th scope="col" className="px-4 py-3">Pin</th>
                    <th scope="col" className="px-4 py-3">Pick</th>
                    <th scope="col" className="px-4 py-3">Worker Name</th>
                    <th scope="col" className="px-4 py-3">Working Unit</th>
                    <th scope="col" className="px-4 py-3 text-center">Images</th>
                    <th scope="col" className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedChallans.map((challan) => (
                    <tr key={challan.id} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{challan.challanNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDateForDisplay(challan.date)}</td>
                      <td className="px-4 py-3 font-medium">{formatPartyNameForDisplay(challan.partyName)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                            <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                                (challan.status === 'Ready to Invoice' || challan.status === 'Delivered') ? 'bg-green-100 text-green-800' : 
                                challan.status === 'Not Delivered' ? 'bg-yellow-100 text-yellow-800' :
                                challan.status === 'Rework' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {challan.status}
                            </span>
                        </div>
                        {challan.isOutsourcing && (
                            <div className="mt-1">
                                <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                    Outsourcing
                                </span>
                            </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{challan.partyDCNo || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{challan.process.join(', ')}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{challan.designNo}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{challan.pcs}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{challan.mtr}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">{challan.width || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{challan.shrinkage || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{challan.pin || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{challan.pick || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{challan.workerName || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{challan.workingUnit || '-'}</td>
                      <td className="px-4 py-3 text-center">
                         <div className="flex items-center justify-center gap-3">
                            {challan.dcImage && challan.dcImage.length > 0 ? (
                              <div className="relative group">
                                <div className="flex items-center">
                                    <CameraIcon className="w-5 h-5 text-blue-500" />
                                    {challan.dcImage.length > 1 && <span className="text-xs text-blue-500 ml-1">({challan.dcImage.length})</span>}
                                </div>
                                <div className="absolute bottom-full right-0 mb-2 w-32 h-32 bg-white border rounded-md shadow-lg p-1 hidden group-hover:block z-10">
                                  <img src={challan.dcImage[0]} alt="DC Preview" className="w-full h-full object-contain" />
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                            {challan.sampleImage && challan.sampleImage.length > 0 ? (
                              <div className="relative group">
                                <div className="flex items-center">
                                    <CameraIcon className="w-5 h-5 text-green-500" />
                                    {challan.sampleImage.length > 1 && <span className="text-xs text-green-500 ml-1">({challan.sampleImage.length})</span>}
                                </div>
                                <div className="absolute bottom-full right-0 mb-2 w-32 h-32 bg-white border rounded-md shadow-lg p-1 hidden group-hover:block z-10">
                                  <img src={challan.sampleImage[0]} alt="Sample Preview" className="w-full h-full object-contain" />
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleOpenFormForEditChallan(challan)} className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50" title="Edit Challan">
                                <EditIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => setChallanToDelete(challan)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50" title="Delete Challan">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                             {activeTab === 'outsourcing' && (
                                <button onClick={() => setChallanToPrint(challan)} className="p-1 text-gray-400 hover:text-green-500 rounded-full hover:bg-green-50" title="Print Challan">
                                    <PrintIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredChallans.length === 0 && <div className="text-center p-8 text-gray-500">No challans found for this tab.</div>}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalChallanPages}
                onPageChange={setCurrentPage}
                startItem={challanStartItem}
                endItem={challanEndItem}
                totalItems={filteredChallans.length}
              />
            </div>
        )}
      </div>
    </>
  );
};

export default DeliveryChallanScreen;
