
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CloseIcon, CalendarIcon, ChevronDownIcon, ImageIcon, SpinnerIcon, CheckIcon } from './Icons';
import DatePicker from './DatePicker';
import AddShopModal from './AddShopModal';
import EmployeeModal from './EmployeeModal';
import ProcessTypeModal from './PartyDCProcessModal';
// FIX: Removed unused 'DataEntry' type which is not exported from App.tsx
import type { DeliveryChallan, Client, ProcessType, DeliveryChallanNumberConfig, Employee } from '../App';

interface DeliveryChallanFormProps {
    onClose: () => void;
    onSave: (entry: Omit<DeliveryChallan, 'id'>) => void | Promise<void>;
    clients: Client[];
    onAddClient: (newClient: Omit<Client, 'id'>) => void;
    processTypes: ProcessType[];
    onAddProcessType: (process: { name: string, rate: number }) => void;
    challanToEdit?: DeliveryChallan | null;
    deliveryChallanNumberConfig: DeliveryChallanNumberConfig;
    employees: Employee[];
    onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
}

const BLANK_CHALLAN: Omit<DeliveryChallan, 'id' | 'challanNumber'> = {
    date: new Date().toISOString().split('T')[0],
    partyName: '',
    partyDCNo: '',
    process: [],
    designNo: '',
    pcs: 1,
    mtr: 1,
    width: 0,
    shrinkage: '',
    pin: '',
    pick: '',
    extraWork: '',
    status: 'Ready to Invoice',
    workerName: '',
    dcImage: [],
    sampleImage: [],
};

const formatDateForInput = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler();
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
};

const DeliveryChallanForm: React.FC<DeliveryChallanFormProps> = ({ onClose, onSave, clients, onAddClient, processTypes, onAddProcessType, challanToEdit, deliveryChallanNumberConfig, employees, onAddEmployee }) => {
    const isEditing = !!challanToEdit;
    const [challan, setChallan] = useState<Omit<DeliveryChallan, 'id' | 'challanNumber'>>(BLANK_CHALLAN);
    const [challanNumber, setChallanNumber] = useState('');
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isProcessDropdownOpen, setProcessDropdownOpen] = useState(false);
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [showAddProcessModal, setShowAddProcessModal] = useState(false);
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
    const dcImageInputRef = useRef<HTMLInputElement>(null);
    const sampleImageInputRef = useRef<HTMLInputElement>(null);
    const processDropdownRef = useRef<HTMLDivElement>(null);
    useClickOutside(processDropdownRef, () => setProcessDropdownOpen(false));

    const clientNames = useMemo(() => clients.map(s => s.name), [clients]);
    const processNames = useMemo(() => processTypes.map(p => p.name), [processTypes]);

    useEffect(() => {
        if (challanToEdit) {
            const { id, ...rest } = challanToEdit;
            setChallan(rest);
            setChallanNumber(rest.challanNumber);
        } else {
            setChallan({
                ...BLANK_CHALLAN,
                partyName: '',
            });
            const paddedNumber = String(deliveryChallanNumberConfig.nextNumber).padStart(4, '0');
            const newChallanNumber = `${deliveryChallanNumberConfig.prefix}-${paddedNumber}`;
            setChallanNumber(newChallanNumber);
        }
    }, [challanToEdit, deliveryChallanNumberConfig]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setChallan(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };
    
    const handleWorkerNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '_add_new_') {
            setShowAddEmployeeModal(true);
        } else {
            setChallan(prev => ({ ...prev, workerName: value }));
        }
    };
    
    const handleSaveEmployee = (employeeData: Omit<Employee, 'id'>) => {
        onAddEmployee(employeeData);
        setChallan(prev => ({ ...prev, workerName: employeeData.name }));
        setShowAddEmployeeModal(false);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'dcImage' | 'sampleImage') => {
        if (e.target.files && e.target.files.length > 0) {
            // FIX: Iterate directly over the FileList to ensure correct type inference for File objects.
            for (const file of e.target.files) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setChallan(prev => ({
                        ...prev,
                        [field]: [...(prev[field] || []), reader.result as string]
                    }));
                };
                reader.readAsDataURL(file);
            }
            if (e.target) {
                e.target.value = '';
            }
        }
    };

    const handleRemoveImage = (field: 'dcImage' | 'sampleImage', index: number) => {
        setChallan(prev => {
            const currentImages = prev[field] || [];
            const newImages = currentImages.filter((_, i) => i !== index);
            return { ...prev, [field]: newImages };
        });
    };

    const handlePartyNameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '_add_new_') {
            setShowAddClientModal(true);
        } else {
            setChallan(prev => ({ ...prev, partyName: value }));
        }
        if (errors.partyName) setErrors(prev => ({ ...prev, partyName: '' }));
    };

    const handleProcessToggle = (processName: string) => {
        setChallan(prev => {
            const newProcesses = prev.process.includes(processName)
                ? prev.process.filter(p => p !== processName)
                : [...prev.process, processName];
            return { ...prev, process: newProcesses };
        });
        if (errors.process) setErrors(prev => ({...prev, process: ''}));
    };

    const handleSaveClient = (newClientName: string) => {
        const newClient: Omit<Client, 'id'> = { name: newClientName, phone: '', email: '', address: '', city: '', state: '', pincode: '', gstNo: '', panNo: '', paymentTerms: 'Due on receipt', processes: [] };
        onAddClient(newClient);
        setChallan(prev => ({ ...prev, partyName: newClientName }));
        setShowAddClientModal(false);
    };
    
    const handleSaveProcess = (processData: { name: string, rate: number }) => {
        onAddProcessType(processData);
        // Automatically select the new process
        setChallan(prev => ({
            ...prev,
            process: [...prev.process, processData.name],
        }));
        setShowAddProcessModal(false);
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!challan.partyName) newErrors.partyName = "Party name is required.";
        if (!challan.date) newErrors.date = "Date is required.";
        if (challan.process.length === 0) newErrors.process = "At least one process is required.";
        if (challan.pcs <= 0) newErrors.pcs = "No of pcs must be positive.";
        if (challan.mtr <= 0) newErrors.mtr = "Mtr must be positive.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (validate()) {
            setSaveState('saving');
            try {
                await onSave({ ...challan, challanNumber });
                setSaveState('saved');
                setTimeout(() => {
                    onClose();
                }, 1500);
            } catch (error) {
                console.error("Save failed, resetting button state", error);
                setSaveState('idle');
            }
        }
    };
    
    const modalTitle = isEditing ? `Edit Delivery Challan (${challanNumber})` : 'Create New Delivery Challan';
    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
    const statusOptions = ['Ready to Invoice', 'Not Delivered'];

    return (
        <>
            {showAddClientModal && <AddShopModal onClose={() => setShowAddClientModal(false)} onSave={handleSaveClient} existingClientNames={clientNames} />}
            {showAddEmployeeModal && <EmployeeModal onClose={() => setShowAddEmployeeModal(false)} onSave={handleSaveEmployee} existingEmployees={employees} />}
            {showAddProcessModal && (
                <ProcessTypeModal
                    onClose={() => setShowAddProcessModal(false)}
                    onSave={handleSaveProcess}
                    existingProcessNames={processNames}
                />
            )}
            <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-start p-4 pt-10" role="dialog" aria-modal="true">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl animate-fade-in-down overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b">
                        <h2 className="text-xl font-bold text-gray-800">{modalTitle}</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Challan Number</label>
                                <input
                                    type="text"
                                    value={challanNumber}
                                    readOnly
                                    className={`${commonInputClasses} bg-gray-100`}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                <div className="relative">
                                    <button type="button" onClick={() => setDatePickerOpen(p => !p)} className={`block w-full text-sm rounded-md border shadow-sm bg-white px-3 py-2.5 flex items-center justify-between text-left font-normal ${errors.date ? 'border-red-500' : 'border-gray-300'}`}>
                                        <span className={challan.date ? 'text-gray-900' : 'text-gray-500'}>{formatDateForInput(challan.date) || 'Select a date'}</span>
                                        <CalendarIcon className="w-5 h-5 text-gray-400" />
                                    </button>
                                    {isDatePickerOpen && (
                                        <DatePicker
                                            value={challan.date}
                                            onChange={date => { setChallan(p => ({...p, date})); setDatePickerOpen(false); }}
                                            onClose={() => setDatePickerOpen(false)}
                                        />
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Party Name <span className="text-red-500">*</span></label>
                                <select name="partyName" value={challan.partyName} onChange={handlePartyNameChange} className={`${commonInputClasses} ${errors.partyName ? 'border-red-500' : ''}`}>
                                    <option value="">Select a party</option>
                                    {clientNames.map(name => <option key={name} value={name}>{name}</option>)}
                                    <option value="_add_new_">++ Add New Party ++</option>
                                </select>
                                {errors.partyName && <p className="mt-1 text-sm text-red-500">{errors.partyName}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <div className="flex rounded-md border border-gray-300 overflow-hidden shadow-sm">
                                    {statusOptions.map((status, index) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => {
                                                setChallan(prev => ({ ...prev, status: status }));
                                            }}
                                            className={`flex-1 px-3 py-2.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-blue-500 focus:z-10 ${
                                                challan.status === status
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                            } ${index < statusOptions.length - 1 ? 'border-r border-gray-300' : ''}`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Party DC No</label>
                                <input name="partyDCNo" type="text" value={challan.partyDCNo} onChange={handleChange} className={commonInputClasses} />
                            </div>
                            <div ref={processDropdownRef} className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Process <span className="text-red-500">*</span></label>
                                <button type="button" onClick={() => setProcessDropdownOpen(p => !p)} className={`flex items-center justify-between w-full text-left ${commonInputClasses} ${errors.process ? 'border-red-500' : ''}`}>
                                    <span className="truncate pr-8">{challan.process.length > 0 ? challan.process.join(', ') : 'Select processes'}</span>
                                    <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                </button>
                                {isProcessDropdownOpen && (
                                    <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                                        {processNames.map(p => (
                                            <label key={p} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                                <input type="checkbox" checked={challan.process.includes(p)} onChange={() => handleProcessToggle(p)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                <span className="ml-3">{p}</span>
                                            </label>
                                        ))}
                                        <div className="border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setProcessDropdownOpen(false);
                                                    setShowAddProcessModal(true);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-blue-600 font-semibold hover:bg-gray-100"
                                            >
                                                ++ Add New Process ++
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {errors.process && <p className="mt-1 text-sm text-red-500">{errors.process}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Design No</label>
                                <input name="designNo" type="text" value={challan.designNo} onChange={handleChange} className={commonInputClasses} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">No of pcs</label>
                                <input name="pcs" type="number" value={challan.pcs || ''} onChange={handleChange} className={`${commonInputClasses} ${errors.pcs ? 'border-red-500' : ''}`} />
                                {errors.pcs && <p className="mt-1 text-sm text-red-500">{errors.pcs}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mtr</label>
                                <input name="mtr" type="number" value={challan.mtr || ''} onChange={handleChange} className={`${commonInputClasses} ${errors.mtr ? 'border-red-500' : ''}`} />
                                {errors.mtr && <p className="mt-1 text-sm text-red-500">{errors.mtr}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                                <input name="width" type="number" value={challan.width || ''} onChange={handleChange} className={commonInputClasses} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shrinkage</label>
                                <input name="shrinkage" type="text" value={challan.shrinkage || ''} onChange={handleChange} className={commonInputClasses} />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pin</label>
                                <input name="pin" type="text" value={challan.pin || ''} onChange={handleChange} className={commonInputClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pick</label>
                                <input name="pick" type="text" value={challan.pick || ''} onChange={handleChange} className={commonInputClasses} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
                            <select name="workerName" value={challan.workerName} onChange={handleWorkerNameChange} className={commonInputClasses}>
                                <option value="">Select a worker</option>
                                {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                                <option value="_add_new_">++ Add New Worker ++</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Extra work</label>
                            <textarea name="extraWork" rows={2} value={challan.extraWork} onChange={handleChange} className={commonInputClasses} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">DC Images</label>
                                 <input type="file" ref={dcImageInputRef} onChange={e => handleImageChange(e, 'dcImage')} className="hidden" accept="image/*" multiple />
                                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                                     {(challan.dcImage || []).map((imgSrc, index) => (
                                         <div key={index} className="relative group aspect-square border rounded-md overflow-hidden">
                                             <img src={imgSrc} alt={`DC Image ${index + 1}`} className="w-full h-full object-cover" />
                                             <button
                                                 type="button"
                                                 onClick={() => handleRemoveImage('dcImage', index)}
                                                 className="absolute top-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                                 aria-label="Remove image"
                                             >
                                                 <CloseIcon className="w-3 h-3" />
                                             </button>
                                         </div>
                                     ))}
                                     <button
                                         type="button"
                                         onClick={() => dcImageInputRef.current?.click()}
                                         className="flex items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 transition-colors"
                                         aria-label="Add DC images"
                                     >
                                         <ImageIcon className="w-8 h-8 text-gray-400" />
                                     </button>
                                 </div>
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Sample Images</label>
                                 <input type="file" ref={sampleImageInputRef} onChange={e => handleImageChange(e, 'sampleImage')} className="hidden" accept="image/*" multiple />
                                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                                     {(challan.sampleImage || []).map((imgSrc, index) => (
                                         <div key={index} className="relative group aspect-square border rounded-md overflow-hidden">
                                             <img src={imgSrc} alt={`Sample Image ${index + 1}`} className="w-full h-full object-cover" />
                                             <button
                                                 type="button"
                                                 onClick={() => handleRemoveImage('sampleImage', index)}
                                                 className="absolute top-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                                 aria-label="Remove image"
                                             >
                                                 <CloseIcon className="w-3 h-3" />
                                             </button>
                                         </div>
                                     ))}
                                     <button
                                         type="button"
                                         onClick={() => sampleImageInputRef.current?.click()}
                                         className="flex items-center justify-center w-full aspect-square border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 transition-colors"
                                         aria-label="Add sample images"
                                     >
                                         <ImageIcon className="w-8 h-8 text-gray-400" />
                                     </button>
                                 </div>
                             </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-end p-5 bg-gray-50 border-t space-x-3">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50">
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit} 
                            disabled={saveState !== 'idle'}
                            className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center w-36 transition-all"
                        >
                            {saveState === 'saving' && <><SpinnerIcon className="w-5 h-5 mr-2" /> Saving...</>}
                            {saveState === 'saved' && <><CheckIcon className="w-5 h-5 mr-2" /> Saved!</>}
                            {saveState === 'idle' && (isEditing ? 'Update Challan' : 'Save Challan')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DeliveryChallanForm;
