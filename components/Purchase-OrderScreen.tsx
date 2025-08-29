
import React, { useState, useMemo } from 'react';
import PurchaseOrderForm from './PurchaseOrderForm';
import { PlusIcon, SearchIcon } from './Icons';
import type { PurchaseOrder } from '../App';

interface PurchaseOrderScreenProps {
  purchaseOrders: PurchaseOrder[];
  onAddOrder: (newOrder: PurchaseOrder) => void;
  shopNames: string[];
  onAddShopName: (newShopName: string) => void;
  bankNames: string[];
  onAddBankName: (newBankName: string) => void;
}

const PurchaseOrderScreen: React.FC<PurchaseOrderScreenProps> = ({ purchaseOrders, onAddOrder, shopNames, onAddShopName, bankNames, onAddBankName }) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = useMemo(() => {
    if (!searchTerm) {
      return purchaseOrders;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return purchaseOrders.filter(
      (order) =>
        order.poNumber.toLowerCase().includes(lowercasedTerm) ||
        order.shopName.toLowerCase().includes(lowercasedTerm) ||
        order.gstNo.toLowerCase().includes(lowercasedTerm)
    );
  }, [purchaseOrders, searchTerm]);
  
  const handleSaveOrder = (newOrder: PurchaseOrder) => {
    onAddOrder(newOrder);
    setShowForm(false); // Close form on save
  };

  return (
    <>
      {showForm && <PurchaseOrderForm onClose={() => setShowForm(false)} onSave={handleSaveOrder} shopNames={shopNames} onAddShopName={onAddShopName} bankNames={bankNames} onAddBankName={onAddBankName} />}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between p-5 border-b border-gray-200 gap-4">
          <h1 className="text-xl font-semibold text-gray-800">Purchase Orders</h1>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by PO#, Shop Name, or GST..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button onClick={() => setShowForm(true)} className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700">
              <PlusIcon className="w-5 h-5 mr-2" />
              New Purchase Order
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
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
              {filteredOrders.map((order) => (
                <tr key={order.poNumber} className="bg-white border-b hover:bg-gray-50">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {order.poNumber}
                  </th>
                  <td className="px-6 py-4">{order.poDate}</td>
                  <td className="px-6 py-4">{order.shopName}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'Paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">${order.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="text-center p-8 text-gray-500">
                No purchase orders found.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// FIX: Added default export to the component.
export default PurchaseOrderScreen;
