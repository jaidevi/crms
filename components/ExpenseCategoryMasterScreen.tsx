import React, { useState, useMemo } from 'react';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from './Icons';
import type { ExpenseCategory } from '../types';
import AddExpenseCategoryModal from './AddExpenseCategoryModal';
import ConfirmationModal from './ConfirmationModal';

interface ExpenseCategoryMasterScreenProps {
  categories: ExpenseCategory[];
  onAdd: (name: string) => Promise<ExpenseCategory | null>;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ExpenseCategoryMasterScreen: React.FC<ExpenseCategoryMasterScreenProps> = ({ categories, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<ExpenseCategory | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ExpenseCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = useMemo(() => {
    const sorted = [...categories].sort((a, b) => a.name.localeCompare(b.name));
    if (!searchTerm) {
      return sorted;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return sorted.filter(p => p.name.toLowerCase().includes(lowercasedTerm));
  }, [categories, searchTerm]);

  const handleOpenModalForNew = () => {
    setItemToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (category: ExpenseCategory) => {
    setItemToEdit(category);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setItemToEdit(null);
  };
  
  const handleSave = async (name: string) => {
    if (itemToEdit) {
      await onUpdate(itemToEdit.id, name);
    } else {
      await onAdd(name);
    }
    handleCloseModal();
  };
  
  const handleDeleteClick = (category: ExpenseCategory) => {
    setItemToDelete(category);
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await onDelete(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <>
      {isModalOpen && (
        <AddExpenseCategoryModal
          onClose={handleCloseModal}
          onSave={handleSave}
          existingCategoryNames={categories.map(c => c.name)}
          categoryToEdit={itemToEdit}
        />
      )}
       {itemToDelete && (
        <ConfirmationModal
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Expense Category"
          message={
            <>
              Are you sure you want to delete the category{' '}
              <strong className="font-semibold text-secondary-800">{itemToDelete.name}</strong>? This will not delete historical expenses but will remove the category from selection.
            </>
          }
        />
      )}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between p-5 border-b border-secondary-200 gap-4">
          <div>
            <h1 className="text-xl font-semibold text-secondary-800">Expense Categories</h1>
            <p className="text-xs text-secondary-500 mt-1">Manage standard categories for non-purchase expenses.</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2.5 text-sm border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={handleOpenModalForNew}
              className="flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Category
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-secondary-500">
            <thead className="text-xs text-secondary-700 uppercase bg-secondary-50">
              <tr>
                <th scope="col" className="px-6 py-3">Category Name</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category.id} className="bg-white border-b hover:bg-secondary-50 transition-colors">
                  <th scope="row" className="px-6 py-4 font-medium text-secondary-900 whitespace-nowrap">
                    {category.name}
                  </th>
                  <td className="px-6 py-4 text-center">
                     <div className="flex items-center justify-center gap-4">
                        <button onClick={() => handleOpenModalForEdit(category)} className="p-1 text-secondary-400 hover:text-primary-500 rounded-full hover:bg-primary-50 transition-colors" aria-label="Edit">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteClick(category)} className="p-1 text-secondary-400 hover:text-danger-500 rounded-full hover:bg-danger-50 transition-colors" aria-label="Delete">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCategories.length === 0 && (
            <div className="text-center p-12 text-secondary-500 bg-secondary-50/50">
              {searchTerm
                ? `No categories found matching "${searchTerm}".`
                : 'No expense categories found. Click "New Category" to add your first one.'}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ExpenseCategoryMasterScreen;