

import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, PlusIcon, TrashIcon } from './Icons';
import type { Client, ProcessType } from '../App';
import { indianStates } from '../data/indian-locations';
import ProcessTypeModal from './PartyDCProcessModal';

interface ShopMasterModalProps {
    onClose: () => void;
    onSave: (newClient: Client) => void;
    existingClientNames: string[];
    clientToEdit?: Client | null;
    processTypes: ProcessType[];
    onAddProcessType: (process: { name: string, rate: number }) => void;
}

// Define a local type for the UI state of a process line item
interface ClientProcessLineItem {
  id: string; // for React key
  processName: string;
  quantity: number;
  rate: number;
  amount: number;
}

const BLANK_CLIENT: Client = {
    id: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNo: '',
    panNo: '',
    paymentTerms: 'Due on receipt',
    processes: [],
};

const ShopMasterModal: React.FC<ShopMasterModalProps> = ({ onClose, onSave, existingClientNames, clientToEdit, processTypes, onAddProcessType }) => {
    const [client, setClient] = useState<Omit<Client, 'processes'>>(clientToEdit || BLANK_CLIENT);
    const [processes, setProcesses] = useState<ClientProcessLineItem[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [showAddProcessModal, setShowAddProcessModal] = useState(false);
    const [editingProcessId, setEditingProcessId] = useState<string | null>(null);

    
    useEffect(() => {
        const initialClient = clientToEdit || BLANK_CLIENT;
        const { processes: clientProcesses, ...clientDetails } = initialClient;
        setClient(clientDetails);
        
        // Convert from App's ClientProcess to local ClientProcessLineItem
        setProcesses(clientProcesses?.map(p => ({
            id: `p-${Date.now()}-${Math.random()}`,
            processName: p.processName,
            rate: p.rate,
            quantity: 1, // Default quantity for UI
            amount: p.rate, // Initial amount
        })) || []);

        setErrors({});
        
        if (initialClient.state) {
            const stateData = indianStates.find(s => s.state === initialClient.state);
            setAvailableCities(stateData ? stateData.cities.sort() : []);
        } else {
            setAvailableCities([]);
        }
    }, [clientToEdit]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'state') {
            const stateData = indianStates.find(s => s.state === value);
            setAvailableCities(stateData ? stateData.cities.sort() : []);
            setClient(prev => ({ ...prev, state: value, city: '' }));
        } else {
            const finalValue = name === 'name' ? value.toUpperCase() : value;
            setClient(prev => ({ ...prev, [name]: finalValue }));
        }

        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    const addProcessLineItem = () => {
        const newItem: ClientProcessLineItem = {
            id: `item-${Date.now()}-${Math.random()}`,
            processName: '',
            quantity: 1,
            rate: 0,
            amount: 0,
        };
        setProcesses(prev => [...prev, newItem]);
    };

    const updateProcessLineItem = (id: string, updates: Partial<Omit<ClientProcessLineItem, 'id' | 'amount'>>) => {
        setProcesses(prev =>
            prev.map(item => {
                if (item.id === id) {
                    const updatedItem = { ...item, ...updates };
                    const quantity = Math.max(0, Number(updatedItem.quantity));
                    const rate = Math.max(0, Number(updatedItem.rate));
                    updatedItem.quantity = quantity;
                    updatedItem.rate = rate;
                    updatedItem.amount = quantity * rate;
                    return updatedItem;
                }
                return item;
            })
        );
    };

    const removeProcessLineItem = (id: string) => {
        setProcesses(prev => prev.filter(item => item.id !== id));
    };
    
    const handleProcessSelection = (lineItemId: string, selectedValue: string) => {
        if (selectedValue === '_add_new_') {
            setEditingProcessId(lineItemId);
            setShowAddProcessModal(true);
        } else {
            const selectedProcess = processTypes.find(p => p.name === selectedValue);
            if (selectedProcess) {
                updateProcessLineItem(lineItemId, {
                    processName: selectedProcess.name,
                    rate: selectedProcess.rate || 0
                });
            } else {
                updateProcessLineItem(lineItemId, { processName: '' });
            }
        }
    };
    
    const handleSaveNewProcess = (processData: { name: string; rate: number; }) => {
        onAddProcessType(processData);
        if (editingProcessId) {
            updateProcessLineItem(editingProcessId, {
                processName: processData.name,
                rate: processData.rate
            });
        }
        setShowAddProcessModal(false);
        setEditingProcessId(null);
    };

    const totalAmount = useMemo(() => {
        return processes.reduce((total, item) => total + item.amount, 0);
    }, [processes]);

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        const trimmedName = client.name.trim();

        if (!trimmedName) {
            newErrors.name = 'Client name cannot be empty.';
        } else {
            const normalize = (name: string) => name.toLowerCase().replace(/[\s&'.,-/]/g, '').replace(/s$/, '');
            const normalizedTrimmedName = normalize(trimmedName);
            const otherClientNames = clientToEdit
                ? existingClientNames.filter(name => name.toLowerCase() !== clientToEdit.name.toLowerCase())
                : existingClientNames;

            if (otherClientNames.some(name => normalize(name) === normalizedTrimmedName)) {
                newErrors.name = 'A client with this name or a very similar name already exists.';
            }
        }

        if (client.phone && !/^(?:\+91)?[6789]\d{9}$/.test(client.phone.trim())) {
            newErrors.phone = 'Invalid Indian mobile number (e.g., 9876543210).';
        }

        if (client.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email.trim())) {
            newErrors.email = 'Invalid email address.';
        }

        if (client.gstNo && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(client.gstNo.trim())) {
            newErrors.gstNo = 'Invalid GST number format.';
        }

        if (client.panNo && !/^[A-Z]{5}\d{4}[A-Z]{1}$/i.test(client.panNo.trim())) {
            newErrors.panNo = 'Invalid PAN number format.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleSave = () => {
        if (!validate()) {
            return;
        }
        
        const validProcessesForSave = processes
          .filter(p => p.processName.trim() !== '')
          .map(({ processName, rate }) => ({ processName, rate }));

        onSave({ ...client, name: client.name.trim(), processes: validProcessesForSave });
    };

    const inputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
    const modalTitle = clientToEdit ? 'Edit Client' : 'Add New Client';
    const saveButtonText = clientToEdit ? 'Update Client' : 'Save Client';
    const paymentTermOptions = ['Due on receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60'];

    return (
        <>
        {showAddProcessModal && <ProcessTypeModal onClose={() => setShowAddProcessModal(false)} onSave={handleSaveNewProcess} existingProcessNames={processTypes.map(p => p.name)} />}
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start p-4 pt-10" role="dialog" aria-modal="true" aria-labelledby="client-master-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 animate-fade-in-down">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 id="client-master-modal-title" className="text-lg font-semibold text-gray-800">{modalTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200" aria-label="Close">
                        <CloseIcon className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    <fieldset className="border border-gray-200 rounded-lg p-4">
                        <legend className="text-base font-semibold text-gray-900 px-2">Basic Information</legend>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Client Name <span className="text-red-500">*</span>
                                </label>
                                <input id="name" name="name" type="text" value={client.name} onChange={handleChange} className={`${inputClasses} ${errors.name ? 'border-red-500' : ''}`} autoFocus />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input id="phone" name="phone" type="tel" value={client.phone} onChange={handleChange} className={`${inputClasses} ${errors.phone ? 'border-red-500' : ''}`} />
                                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input id="email" name="email" type="email" value={client.email} onChange={handleChange} className={`${inputClasses} ${errors.email ? 'border-red-500' : ''}`} />
                                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                            </div>
                        </div>
                    </fieldset>
                    
                    <fieldset className="border border-gray-200 rounded-lg p-4">
                        <legend className="text-base font-semibold text-gray-900 px-2">Address</legend>
                        <div className="space-y-4 pt-4">
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea id="address" name="address" rows={2} value={client.address} onChange={handleChange} className={inputClasses}></textarea>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <select id="state" name="state" value={client.state} onChange={handleChange} className={inputClasses}>
                                        <option value="">Select a state</option>
                                        {indianStates.map(s => (
                                            <option key={s.state} value={s.state}>{s.state}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                    <select id="city" name="city" value={client.city} onChange={handleChange} className={inputClasses} disabled={!client.state || availableCities.length === 0}>
                                        <option value="">{client.state ? 'Select a district' : 'Select a state first'}</option>
                                        {availableCities.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                    <input id="pincode" name="pincode" type="text" value={client.pincode} onChange={handleChange} className={inputClasses} />
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="border border-gray-200 rounded-lg p-4">
                        <legend className="text-base font-semibold text-gray-900 px-2">Financial &amp; Tax Details</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                            <div>
                                <label htmlFor="gstNo" className="block text-sm font-medium text-gray-700 mb-1">GST NO</label>
                                <input id="gstNo" name="gstNo" type="text" value={client.gstNo} onChange={handleChange} className={`${inputClasses} ${errors.gstNo ? 'border-red-500' : ''}`} />
                                 {errors.gstNo && <p className="mt-1 text-sm text-red-500">{errors.gstNo}</p>}
                            </div>
                            <div>
                                <label htmlFor="panNo" className="block text-sm font-medium text-gray-700 mb-1">PAN No</label>
                                <input id="panNo" name="panNo" type="text" value={client.panNo || ''} onChange={handleChange} className={`${inputClasses} ${errors.panNo ? 'border-red-500' : ''}`} />
                                {errors.panNo && <p className="mt-1 text-sm text-red-500">{errors.panNo}</p>}
                            </div>
                            <div>
                                <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                                <select id="paymentTerms" name="paymentTerms" value={client.paymentTerms || ''} onChange={handleChange} className={inputClasses}>
                                    {paymentTermOptions.map(term => (
                                        <option key={term} value={term}>{term}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="border border-gray-200 rounded-lg p-4">
                        <legend className="text-base font-semibold text-gray-900 px-2">Associated Processes</legend>
                        <div className="space-y-2 pt-4">
                            <div className="grid grid-cols-12 gap-4 px-3 py-2 bg-gray-50 rounded-md text-xs font-medium text-gray-500 tracking-wider uppercase">
                                <div className="col-span-5">Type of Process</div>
                                <div className="col-span-2 text-right">Quantity</div>
                                <div className="col-span-2 text-right">Rate</div>
                                <div className="col-span-2 text-right">Amount</div>
                                <div className="col-span-1"></div>
                            </div>

                            <div className="space-y-3 pt-2">
                                {processes.map((item) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-5">
                                            <select value={item.processName} onChange={e => handleProcessSelection(item.id, e.target.value)} className={inputClasses}>
                                                <option value="">Select a process</option>
                                                {processTypes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                                <option value="_add_new_" className="text-blue-600 font-semibold">++ Add New Process ++</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <input type="number" value={item.quantity} min="0" readOnly className={`${inputClasses} text-right bg-gray-100`} aria-label="Quantity" />
                                        </div>
                                        <div className="col-span-2">
                                            <input type="number" value={item.rate} min="0" step="0.01" onChange={e => updateProcessLineItem(item.id, { rate: Number(e.target.value) })} className={`${inputClasses} text-right`} aria-label="Rate" />
                                        </div>
                                        <div className="col-span-2 text-right text-sm text-gray-800 font-medium">
                                            ₹{item.amount.toFixed(2)}
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <button onClick={() => removeProcessLineItem(item.id)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50" aria-label="Remove item">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <button onClick={addProcessLineItem} className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mt-2">
                                    <PlusIcon className="w-4 h-4 mr-1" />
                                    Add Process
                                </button>
                            </div>
                             <div className="flex items-center justify-end pt-4 border-t mt-4">
                                <span className="text-sm text-gray-600">Total Amount: </span>
                                <span className="text-lg font-bold text-gray-900 ml-2">₹{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </fieldset>
                </div>
                <div className="flex justify-end items-center p-4 bg-gray-50 border-t rounded-b-lg space-x-3">
                    <button onClick={onClose} type="button" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-semibold hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} type="button" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">{saveButtonText}</button>
                </div>
            </div>
        </div>
        </>
    );
};

export default ShopMasterModal;
