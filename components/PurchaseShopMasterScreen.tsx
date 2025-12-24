
import React, { useState, useMemo } from 'react';
import { PlusIcon, EditIcon, TrashIcon } from './Icons';
import type { PurchaseShop } from '../types';
import PurchaseShopModal from './PurchaseShopModal';
import ConfirmationModal from './ConfirmationModal';

interface PurchaseShopMasterScreenProps {
  shops: PurchaseShop[];
  onAddShop: (newShop: Omit<PurchaseShop, 'id'>) => void;
  onUpdateShop: (updatedShop: PurchaseShop) => void;
  onDeleteShop: (id: string) => void;
}

const PurchaseShopMasterScreen: React.FC<PurchaseShopMasterScreenProps> = ({ shops, onAddShop, onUpdateShop, onDeleteShop }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shopToEdit, setShopToEdit] = useState<PurchaseShop | null>(null);
  const [shopToDelete, setShopToDelete] = useState<PurchaseShop | null>(null);
  
  const sortedShops = useMemo(() => [...shops].sort((a, b) => a.name.localeCompare(b.name)), [shops]);

  const handleOpenModalForEdit = (shop: PurchaseShop) => {
    setShopToEdit(shop);
    setIsModalOpen(true);
  };

  const handleOpenModalForNew = () => {
    setShopToEdit(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setShopToEdit(null);
  };

  const handleSaveShop = (shopData: PurchaseShop) => {
    if (shopToEdit) {
      onUpdateShop(shopData);
    } else {
      const { id, ...newShopData } = shopData;
      onAddShop(newShopData);
    }
    handleCloseModal();
  };
  
  const handleConfirmDelete = () => {
    if (shopToDelete) {
      onDeleteShop(shopToDelete.id);
      setShopToDelete(null);
    }
  };

  return (
    <>
      {isModalOpen && (
        <PurchaseShopModal
          onClose={handleCloseModal}
          onSave={handleSaveShop}
          existingShopNames={shops.map(s => s.name)}
          shopToEdit={shopToEdit}
        />
      )}
      {shopToDelete && (
        <ConfirmationModal
          isOpen={!!shopToDelete}
          onClose={() => setShopToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Purchase Shop"
          message={
            <>
              Are you sure you want to delete the shop{' '}
              <strong className="font-semibold text-gray-800">{shopToDelete.name}</strong>?
              This action cannot be undone.
            </>
          }
        />
      )}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">Add Purchase Shop</h1>
          <button
            onClick={handleOpenModalForNew}
            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add Shop
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Shop Name</th>
                <th scope="col" className="px-6 py-3">Phone</th>
                <th scope="col" className="px-6 py-3">GST No</th>
                <th scope="col" className="px-6 py-3">PAN No</th>
                <th scope="col" className="px-6 py-3">Payment Terms</th>
                <th scope="col" className="px-6 py-3 text-right">Opening Bal</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedShops.map((shop) => (
                <tr key={shop.id} className="bg-white border-b hover:bg-gray-50">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {shop.name}
                  </th>
                  <td className="px-6 py-4">{shop.phone || '-'}</td>
                  <td className="px-6 py-4">{shop.gstNo || '-'}</td>
                  <td className="px-6 py-4">{shop.panNo || '-'}</td>
                  <td className="px-6 py-4">{shop.paymentTerms || '-'}</td>
                  <td className="px-6 py-4 text-right">₹{(shop.openingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-4">
                        <button onClick={() => handleOpenModalForEdit(shop)} className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50" aria-label="Edit shop">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setShopToDelete(shop)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50" aria-label="Delete shop">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {shops.length === 0 && (
            <div className="text-center p-8 text-gray-500">
              No shops found. Click "Add Shop" to add one.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PurchaseShopMasterScreen;
