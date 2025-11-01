
import React, { useState, useMemo } from 'react';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from './Icons';
import type { ProcessType } from '../App';
import ProcessTypeModal from './PartyDCProcessModal';
import ConfirmationModal from './ConfirmationModal';

interface ProcessTypeMasterScreenProps {
  processTypes: ProcessType[];
  onAddProcessType: (process: { name: string, rate: number }) => void;
  onUpdateProcessType: (id: string, process: { name: string, rate: number }) => void;
  onDeleteProcessType: (id: string) => void;
}

const ProcessTypeMasterScreen: React.FC<ProcessTypeMasterScreenProps> = ({ processTypes, onAddProcessType, onUpdateProcessType, onDeleteProcessType }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processToEdit, setProcessToEdit] = useState<ProcessType | null>(null);
  const [processToDelete, setProcessToDelete] = useState<ProcessType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProcessTypes = useMemo(() => {
    const sorted = [...processTypes].sort((a, b) => a.name.localeCompare(b.name));
    if (!searchTerm) {
      return sorted;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return sorted.filter(p => p.name.toLowerCase().includes(lowercasedTerm));
  }, [processTypes, searchTerm]);

  const handleOpenModalForNew = () => {
    setProcessToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (process: ProcessType) => {
    setProcessToEdit(process);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProcessToEdit(null);
  };
  
  const handleSaveProcess = (processData: { name: string, rate: number }) => {
    if (processToEdit) {
      onUpdateProcessType(processToEdit.id, processData);
    } else {
      onAddProcessType(processData);
    }
    handleCloseModal();
  };
  
  const handleDeleteClick = (process: ProcessType) => {
    setProcessToDelete(process);
  };

  const handleConfirmDelete = () => {
    if (processToDelete) {
      onDeleteProcessType(processToDelete.id);
      setProcessToDelete(null);
    }
  };

  return (
    <>
      {isModalOpen && (
        <ProcessTypeModal
          onClose={handleCloseModal}
          onSave={handleSaveProcess}
          existingProcessNames={processTypes.map(p => p.name)}
          processToEdit={processToEdit}
        />
      )}
       {processToDelete && (
        <ConfirmationModal
          isOpen={!!processToDelete}
          onClose={() => setProcessToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Process Type"
          message={
            <>
              Are you sure you want to delete the process type{' '}
              <strong className="font-semibold text-gray-800">{processToDelete.name}</strong>? This action cannot be undone.
            </>
          }
        />
      )}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between p-5 border-b border-gray-200 gap-4">
          <h1 className="text-xl font-semibold text-gray-800">Add Process</h1>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by process type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleOpenModalForNew}
              className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              New Process Type
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Process Type</th>
                <th scope="col" className="px-6 py-3 text-right">Default Rate</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcessTypes.map((process) => (
                <tr key={process.id} className="bg-white border-b hover:bg-gray-50">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {process.name}
                  </th>
                  <td className="px-6 py-4 text-right">
                    {process.rate !== undefined ? `₹${process.rate.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                     <div className="flex items-center justify-center gap-4">
                        <button onClick={() => handleOpenModalForEdit(process)} className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50" aria-label="Edit process">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteClick(process)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50" aria-label="Delete process">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProcessTypes.length === 0 && (
            <div className="text-center p-8 text-gray-500">
              {searchTerm
                ? `No process types found matching "${searchTerm}".`
                : 'No process types found. Click "New Process Type" to add one.'}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProcessTypeMasterScreen;
