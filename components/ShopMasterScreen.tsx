
import React, { useState, useMemo } from 'react';
import { PlusIcon, EditIcon, TrashIcon } from './Icons';
import type { Client, ProcessType } from '../types';
import ShopMasterModal from './ShopMasterModal';
import ConfirmationModal from './ConfirmationModal';

interface ClientMasterScreenProps {
  clients: Client[];
  onAddClient: (newClient: Omit<Client, 'id'>) => void;
  onUpdateClient: (updatedClient: Client) => void;
  onDeleteClient: (id: string) => void;
  processTypes: ProcessType[];
  onAddProcessType: (process: { name: string, rate: number }) => void;
}

const ClientMasterScreen: React.FC<ClientMasterScreenProps> = ({ clients, onAddClient, onUpdateClient, onDeleteClient, processTypes, onAddProcessType }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  
  const sortedClients = useMemo(() => [...clients].sort((a, b) => a.name.localeCompare(b.name)), [clients]);

  const handleOpenModalForEdit = (client: Client) => {
    setClientToEdit(client);
    setIsModalOpen(true);
  };

  const handleOpenModalForNew = () => {
    setClientToEdit(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setClientToEdit(null);
  };

  const handleSaveClient = (clientData: Client) => {
    if (clientToEdit) {
      onUpdateClient(clientData);
    } else {
      const { id, ...newClientData } = clientData;
      onAddClient(newClientData);
    }
    handleCloseModal();
  };
  
  const handleConfirmDelete = () => {
    if (clientToDelete) {
      onDeleteClient(clientToDelete.id);
      setClientToDelete(null);
    }
  };

  return (
    <>
      {isModalOpen && (
        <ShopMasterModal
          onClose={handleCloseModal}
          onSave={handleSaveClient}
          existingClientNames={clients.map(c => c.name)}
          clientToEdit={clientToEdit}
          processTypes={processTypes}
          onAddProcessType={onAddProcessType}
        />
      )}
      {clientToDelete && (
        <ConfirmationModal
          isOpen={!!clientToDelete}
          onClose={() => setClientToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Client"
          message={
            <>
              Are you sure you want to delete the client{' '}
              <strong className="font-semibold text-gray-800">{clientToDelete.name}</strong>?
              This action cannot be undone.
            </>
          }
        />
      )}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">Add Client</h1>
          <button
            onClick={handleOpenModalForNew}
            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Client
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Client Name</th>
                <th scope="col" className="px-6 py-3">Phone</th>
                <th scope="col" className="px-6 py-3">GST No</th>
                <th scope="col" className="px-6 py-3">PAN No</th>
                <th scope="col" className="px-6 py-3">Payment Terms</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedClients.map((client) => (
                <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {client.name}
                  </th>
                  <td className="px-6 py-4">{client.phone || '-'}</td>
                  <td className="px-6 py-4">{client.gstNo || '-'}</td>
                  <td className="px-6 py-4">{client.panNo || '-'}</td>
                  <td className="px-6 py-4">{client.paymentTerms || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-4">
                        <button onClick={() => handleOpenModalForEdit(client)} className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50" aria-label="Edit client">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setClientToDelete(client)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50" aria-label="Delete client">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && (
            <div className="text-center p-8 text-gray-500">
              No clients found. Click "New Client" to add one.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ClientMasterScreen;
