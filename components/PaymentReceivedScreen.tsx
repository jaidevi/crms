
import React, { useState, useMemo } from 'react';
import PaymentReceivedForm from './PaymentReceivedForm';
import ConfirmationModal from './ConfirmationModal';
import { PlusIcon, SearchIcon, EditIcon, TrashIcon, CameraIcon } from './Icons';
import type { PaymentReceived, Client, Invoice } from '../types';

interface PaymentReceivedScreenProps {
    payments: PaymentReceived[];
    onAddPayment: (payment: Omit<PaymentReceived, 'id'>) => void;
    onUpdatePayment: (payment: PaymentReceived) => void;
    onDeletePayment: (id: string) => void;
    clients: Client[];
    onAddClient: (newClient: Omit<Client, 'id'>) => void;
    invoices: Invoice[];
}

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return 'N/A';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const PaymentReceivedScreen: React.FC<PaymentReceivedScreenProps> = ({ payments, onAddPayment, onUpdatePayment, onDeletePayment, clients, onAddClient, invoices }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [paymentToEdit, setPaymentToEdit] = useState<PaymentReceived | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<PaymentReceived | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPayments = useMemo(() => {
        const sorted = [...payments].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
        if (!searchTerm) {
            return sorted;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return sorted.filter(p =>
            p.clientName.toLowerCase().includes(lowercasedTerm) ||
            (p.referenceNumber && p.referenceNumber.toLowerCase().includes(lowercasedTerm))
        );
    }, [payments, searchTerm]);

    const handleOpenForNew = () => {
        setPaymentToEdit(null);
        setIsFormOpen(true);
    };

    const handleOpenForEdit = (payment: PaymentReceived) => {
        setPaymentToEdit(payment);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setPaymentToEdit(null);
    };

    const handleSavePayment = (paymentData: PaymentReceived) => {
        if (paymentToEdit) {
            onUpdatePayment(paymentData);
        } else {
            const { id, ...newPaymentData } = paymentData;
            onAddPayment(newPaymentData);
        }
        handleCloseForm();
    };

    const handleDeleteClick = (payment: PaymentReceived) => {
        setPaymentToDelete(payment);
    };

    const handleConfirmDelete = () => {
        if (paymentToDelete) {
            onDeletePayment(paymentToDelete.id);
            setPaymentToDelete(null);
        }
    };

    return (
        <>
            {isFormOpen && (
                <PaymentReceivedForm
                    onClose={handleCloseForm}
                    onSave={handleSavePayment}
                    clients={clients}
                    onAddClient={onAddClient}
                    paymentToEdit={paymentToEdit}
                    invoices={invoices}
                />
            )}
            {paymentToDelete && (
                <ConfirmationModal
                    isOpen={!!paymentToDelete}
                    onClose={() => setPaymentToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title="Delete Payment Record"
                    message={`Are you sure you want to delete this payment record of ₹${paymentToDelete.amount} from ${paymentToDelete.clientName}? This action cannot be undone.`}
                />
            )}
            <div className="bg-white rounded-lg shadow-sm p-5 space-y-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Payments Received</h1>
                        <p className="text-gray-500 mt-1">Track and manage incoming payments from clients.</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-grow">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by client or reference..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full md:w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            onClick={handleOpenForNew}
                            className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700 whitespace-nowrap"
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            New Payment
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Client Name</th>
                                <th scope="col" className="px-6 py-3 text-right">Opening Bal</th>
                                <th scope="col" className="px-6 py-3 text-right">Amount Received</th>
                                <th scope="col" className="px-6 py-3 text-center">Proof</th>
                                <th scope="col" className="px-6 py-3">Mode</th>
                                <th scope="col" className="px-6 py-3">Reference #</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.map((payment) => (
                                <tr key={payment.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{formatDateForDisplay(payment.paymentDate)}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{payment.clientName}</td>
                                    <td className="px-6 py-4 text-right font-medium text-secondary-500">₹{payment.openingBalance.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-medium text-primary-600">₹{payment.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                        {payment.image ? (
                                            <div className="relative group inline-block">
                                                <CameraIcon className="w-5 h-5 text-blue-500 mx-auto cursor-help" />
                                                <div className="absolute z-20 hidden group-hover:block bg-white border rounded shadow-lg p-2 mt-2 right-0">
                                                    <img src={payment.image} alt="Proof" className="max-w-xs max-h-48 object-contain" />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{payment.paymentMode}</td>
                                    <td className="px-6 py-4">{payment.referenceNumber || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-4">
                                            <button onClick={() => handleOpenForEdit(payment)} className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50" aria-label="Edit payment">
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDeleteClick(payment)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50" aria-label="Delete payment">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredPayments.length === 0 && (
                        <div className="text-center p-8 text-gray-500">
                            No payment records found.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PaymentReceivedScreen;
