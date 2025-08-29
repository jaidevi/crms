import React, { useState, useMemo } from 'react';
import PurchaseOrderForm from './PurchaseOrderForm';
import { PlusIcon, SearchIcon } from './Icons';
import type { PurchaseOrder } from '../App';

interface PurchaseOrderScreenProps {
  purchaseOrders: PurchaseOrder[];
  onAddOrder: (newOrder: PurchaseOrder) => void;
  banks: string[];
  onAddBank: (bank: string) => void;
}

const getStatusColor = (status: PurchaseOrder['status']) => {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'Approved':
      return 'bg-blue-100 text-blue-800';
    case 'Shipped':
      return 'bg-indigo-100 text-indigo-800';
    case 'Delivered':
      return 'bg-green-100 text-green-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const PurchaseOrderScreen: React.FC<PurchaseOrderScreenProps> = ({ purchaseOrders, onAddOrder, banks, onAddBank }) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveOrder = (newOrder: PurchaseOrder) => {
    onAddOrder(newOrder);
  };

  const filteredOrders = useMemo(() => {
    if (!searchTerm) {
      return purchaseOrders;
    }
    return purchaseOrders.filter(
      (order) =>
        order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shopName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [purchaseOrders, searchTerm]);

  if (showForm) {
    return <PurchaseOrderForm onClose={() => setShowForm(false)} onSave={handleSaveOrder} banks={banks} onAddBank={onAddBank} />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between p-5 border-b border-gray-200 gap-4">
        <h1 className="text-xl font-semibold text-gray-800">Purchase Orders</h1>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by PO# or Shop Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Order
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">PO Number</th>
              <th scope="col" className="px-6 py-3">Shop Name</th>
              <th scope="col" className="px-6 py-3">Order Date</th>
              <th scope="col" className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.poNumber} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{order.poNumber}</td>
                  <td className="px-6 py-4">{order.shopName}</td>
                  <td className="px-6 py-4">{order.orderDate}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm ? `No orders found for "${searchTerm}".` : 'No purchase orders to display.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseOrderScreen;