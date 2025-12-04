
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CloseIcon, CalendarIcon, ChevronDownIcon, ImageIcon, SpinnerIcon, CheckIcon } from './Icons';
import DatePicker from './DatePicker';
import AddShopModal from './AddShopModal';
import EmployeeModal from './EmployeeModal';
import PurchaseShopModal from './PurchaseShopModal';
import ProcessTypeModal from './PartyDCProcessModal';
import type { DeliveryChallan, Client, ProcessType, DeliveryChallanNumberConfig, Employee, PurchaseShop, CompanyDetails } from '../types';

interface DeliveryChallanFormProps {
    onClose: () => void;
    onSave: (entry: Omit<DeliveryChallan, 'id'>) => void | Promise<void>;
    clients: Client[];
    onAddClient: (newClient: Omit<Client, 'id'>) => void;
    purchaseShops: PurchaseShop[];
    onAddPurchaseShop: (newShop: Omit<PurchaseShop, 'id'>) => void;
    processTypes: ProcessType[];
    onAddProcessType: (process: { name: string, rate: number }) => void;
    challanToEdit?: DeliveryChallan | null;
    existingChallans: DeliveryChallan[];
    deliveryChallanNumberConfig: DeliveryChallanNumberConfig;
    employees: Employee[];
    onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
    companyDetails: CompanyDetails;
    isOutsourcingScreen?: boolean;
}

const BLANK_CHALLAN: Omit<DeliveryChallan, 'id' | 'challanNumber'> = {
    date: new Date().toISOString().split('T')[0],
    partyName: '',
    partyDCNo: '',
    process: [],
    splitProcess: [],
    designNo: '',
    pcs: 1,
    mtr: 1,
    width: 0,
    shrinkage: '',
    pin: '',
    pick: '',
    extraWork: '',
    status: '',
    workerName: '',
    workingUnit: 'Unit I',
    isOutsourcing: false,
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

const DeliveryChallanForm: React.FC<DeliveryChallanFormProps> = ({ 
    onClose, 
    onSave, 
    clients, 
    onAddClient, 
    purchaseShops, 
    onAddPurchaseShop, 
    processTypes, 
    onAddProcessType, 
    challanToEdit,
    existingChallans,
    deliveryChallanNumberConfig, 
    employees, 
    onAddEmployee, 
    companyDetails,
    isOutsourcingScreen = false 
}) => {
    const isEditing = !!challanToEdit;
    const [challan, setChallan] = useState<Omit<DeliveryChallan, 'id' | 'challanNumber'>>(BLANK_CHALLAN);
    const [challanNumber, setChallanNumber] = useState('');
    const [fromParty, setFromParty] = useState('');
    const [toParty, setToParty] = useState('');
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [showAddShopModal, setShowAddShopModal] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    
    const [isProcessDropdownOpen, setProcessDropdownOpen] = useState(false);
    const [isSplitProcessDropdownOpen, setSplitProcessDropdownOpen] = useState(false);
    
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [showAddProcessModal, setShowAddProcessModal] = useState(false);
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
    const dcImageInputRef = useRef<HTMLInputElement>(null);
    const sampleImageInputRef = useRef<HTMLInputElement>(null);
    const processDropdownRef = useRef<HTMLDivElement>(null);
    const splitProcessDropdownRef = useRef<HTMLDivElement>(null);
    
    useClickOutside(processDropdownRef, () => setProcessDropdownOpen(false));
    useClickOutside(splitProcessDropdownRef, () => setSplitProcessDropdownOpen(false));

    const partyList = useMemo(() => clients.map(c => c.name), [clients]);
    const processNames = useMemo(() => processTypes.map(p => p.name), [processTypes]);

    const [processSearch, setProcessSearch] = useState('');
    const filteredProcessNames = useMemo(() => {
        const sorted = [...processNames].sort((a, b) => a.localeCompare(b));
        if (!processSearch) {
            return sorted;
        }
        return sorted.filter(p => 
            p.toLowerCase().includes(processSearch.toLowerCase())
        );
    }, [processNames, processSearch]);

    const [splitProcessSearch, setSplitProcessSearch] = useState('');
    const filteredSplitProcessNames = useMemo(() => {
        const sorted = [...processNames].sort((a, b) => a.localeCompare(b));
        if (!splitProcessSearch) {
            return sorted;
        }
        return sorted.filter(p => 
            p.toLowerCase().includes(splitProcessSearch.toLowerCase())
        );
    }, [processNames, splitProcessSearch]);

    useEffect(() => {
        if (challanToEdit) {
            const { id, ...rest } = challanToEdit;
            setChallan({
                ...rest,
                splitProcess: rest.splitProcess || [] // Ensure splitProcess is array
            });
            setChallanNumber(rest.challanNumber);
             if (rest.isOutsourcing && rest.partyName.includes('|')) {
                const fromMatch = rest.partyName.match(/FROM: (.*?)\|/);
                const toMatch = rest.partyName.match(/\| TO: (.*)/);
                setFromParty(fromMatch ? fromMatch[1].trim() : '');
                setToParty(toMatch ? toMatch[1].trim() : '');
            } else {
                setFromParty('');
                setToParty('');
            }
        } else {
            setChallan({
                ...BLANK_CHALLAN,
                partyName: '',
                isOutsourcing: isOutsourcingScreen,
                workingUnit: isOutsourcingScreen ? 'Outsourcing' : 'Unit I',
                status: isOutsourcingScreen ? 'Not Delivered' : '',
                splitProcess: []
            });
            // Ensure proper zero padding for display
            const paddedNumber = String(deliveryChallanNumberConfig.nextNumber).padStart(4, '0');
            const newChallanNumber = `${deliveryChallanNumberConfig.prefix || 'DC'}-${paddedNumber}`;
            setChallanNumber(newChallanNumber);
            setFromParty('');
            setToParty('');
        }
    }, [challanToEdit, deliveryChallanNumberConfig, isOutsourcingScreen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setChallan(prev => ({ ...prev, [name]: isNumber ? Number(value) : value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };
    
    const handleWorkingUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        const isOutsourcingNow = value === 'Outsourcing';
        setChallan(prev => ({
            ...prev,
            workingUnit: value,
            isOutsourcing: isOutsourcingNow,
            partyName: isOutsourcingNow ? '' : prev.partyName 
        }));
        if (!isOutsourcingNow) {
            setFromParty('');
            setToParty('');
        }
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

    const handleSplitProcessToggle = (processName: string) => {
        setChallan(prev => {
            const currentSplit = prev.splitProcess || [];
            const newSplitProcesses = currentSplit.includes(processName)
                ? currentSplit.filter(p => p !== processName)
                : [...currentSplit, processName];
            return { ...prev, splitProcess: newSplitProcesses };
        });
    };

    const handleSaveClient = (newClientName: string) => {
        const newClient: Omit<Client, 'id'> = { name: newClientName, phone: '', email: '', address: '', city: '', state: '', pincode: '', gstNo: '', panNo: '', paymentTerms: 'Due on receipt', processes: [] };
        onAddClient(newClient);
        setChallan(prev => ({ ...prev, partyName: newClientName }));
        setShowAddClientModal(false);
    };

    const handleSaveShop = (shopData: PurchaseShop) => {
        const { id, ...newShopData } = shopData;
        onAddPurchaseShop(newShopData);
        setChallan(prev => ({ ...prev, partyName: newShopData.name }));
        setShowAddShopModal(false);
    };
    
    const handleSaveProcess = (processData: { name: string, rate: number }) => {
        onAddProcessType(processData);
        setShowAddProcessModal(false);
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (challan.isOutsourcing) {
            if (!fromParty) newErrors.fromParty = "From Party is required.";
            if (!toParty) newErrors.toParty = "To Party is required.";
            if (fromParty && toParty && fromParty === toParty) {
                newErrors.toParty = "To Party cannot be the same as From Party.";
            }
        } else {
            if (!challan.partyName) newErrors.partyName = "Party name is required.";
        }
        if (!challan.date) newErrors.date = "Date is required.";
        if (challan.process.length === 0) newErrors.process = "At least one process is required.";
        if (challan.pcs <= 0) newErrors.pcs = "No of pcs must be positive.";
        if (challan.mtr <= 0) newErrors.mtr = "Mtr must be positive.";
        if (!challan.status) newErrors.status = "Status is required.";

        // Duplicate Check
        if (challan.partyDCNo && challan.partyDCNo.trim() !== '') {
            const currentPartyName = challan.isOutsourcing ? `FROM: ${fromParty} | TO: ${toParty}` : challan.partyName;
            
            // Only check if we have a party name to check against
            if (currentPartyName) {
                const duplicate = existingChallans.find(c => {
                    const isSelf = challanToEdit && c.id === challanToEdit.id;
                    if (isSelf) return false;

                    const sameDC = c.partyDCNo?.trim().toLowerCase() === challan.partyDCNo?.trim().toLowerCase();
                    const sameDate = c.date === challan.date;
                    const sameParty = c.partyName === currentPartyName;
                    
                    if (sameDC && sameDate && sameParty) {
                        // Check if content (process and mtr) is also the same
                        const sameMtr = Math.abs(c.mtr - challan.mtr) < 0.01; // float comparison safe
                        
                        const p1 = [...(c.process || [])].sort().join(',');
                        const p2 = [...(challan.process || [])].sort().join(',');
                        const sameProcess = p1 === p2;

                        return sameMtr && sameProcess;
                    }
                    return false;
                });

                if (duplicate) {
                    newErrors.partyDCNo = "Duplicate Entry: A record with this Party DC No, Date, Process, and Meters already exists.";
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (validate()) {
            setSaveState('saving');
            let finalChallanData = { ...challan, challanNumber };
            if (finalChallanData.isOutsourcing) {
                finalChallanData.partyName = `FROM: ${fromParty} | TO: ${toParty}`;
            }

            try {
                await onSave(finalChallanData);
                setSaveState('saved');
                setTimeout(() => {
                    onClose();
                }, 1500);
            } catch (error: any) {
                console.error("Save failed, resetting button state", error);
                setSaveState('idle');
                const errorMessage = error?.message || 'An unknown error occurred. Please check the console for details.';
                alert(`Failed to save challan:\n${errorMessage}`);
            }
        }
    };
    
    const modalTitle = isEditing 
        ? `Edit ${isOutsourcingScreen ? 'Outsourcing' : 'Delivery'} Challan (${challanNumber})` 
        : `Create New ${isOutsourcingScreen ? 'Outsourcing' : 'Delivery'} Challan`;
    
    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
    const statusOptions = ['Ready to Invoice', 'Not Delivered', 'Rework'];

    return (
        <>
            {showAddClientModal && <AddShopModal onClose={() => setShowAddClientModal(false)} onSave={handleSaveClient} existingClientNames={clients.map(c => c.name)} />}
            {showAddShopModal && <PurchaseShopModal onClose={() => setShowAddShopModal(false)} onSave={handleSaveShop} existingShopNames={purchaseShops.map(s => s.name)} />}
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

                    <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                        <fieldset className="border border-gray-200 rounded-lg p-4">
                            <legend className="text-base font-semibold text-gray-900 px-2">Challan Information</legend>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
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
                                
                                {!challan.isOutsourcing && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Party Name <span className="text-red-500">*</span></label>
                                        <select name="partyName" value={challan.partyName} onChange={handlePartyNameChange} className={`${commonInputClasses} ${errors.partyName ? 'border-red-500' : ''}`}>
                                            <option value="">Select a party</option>
                                            {partyList.map(name => <option key={name} value={name}>{name}</option>)}
                                            <option value="_add_new_">++ Add New Party ++</option>
                                        </select>
                                        {errors.partyName && <p className="mt-1 text-sm text-red-500">{errors.partyName}</p>}
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                                    <select
                                        name="status"
                                        value={challan.status}
                                        onChange={handleChange}
                                        className={`${commonInputClasses} ${errors.status ? 'border-red-500' : ''}`}
                                    >
                                        <option value="" disabled>Select a status</option>
                                        {statusOptions.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                    {errors.status && <p className="mt-1 text-sm text-red-500">{errors.status}</p>}
                                </div>
                            </div>
                            {challan.isOutsourcing && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">From Party <span className="text-red-500">*</span></label>
                                        <select name="fromParty" value={fromParty} onChange={(e) => { setFromParty(e.target.value); if (errors.fromParty) setErrors(p => ({...p, fromParty: ''})); }} className={`${commonInputClasses} ${errors.fromParty ? 'border-red-500' : ''}`}>
                                            <option value="">Select a client</option>
                                            {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                        {errors.fromParty && <p className="mt-1 text-sm text-red-500">{errors.fromParty}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">To Party <span className="text-red-500">*</span></label>
                                        <select name="toParty" value={toParty} onChange={(e) => { setToParty(e.target.value); if (errors.toParty) setErrors(p => ({...p, toParty: ''})); }} className={`${commonInputClasses} ${errors.toParty ? 'border-red-500' : ''}`}>
                                            <option value="">Select a client</option>
                                            {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                        {errors.toParty && <p className="mt-1 text-sm text-red-500">{errors.toParty}</p>}
                                    </div>
                                </div>
                            )}
                        </fieldset>

                        <fieldset className="border border-gray-200 rounded-lg p-4">
                            <legend className="text-base font-semibold text-gray-900 px-2">Production Details</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Working Unit</label>
                                    {isOutsourcingScreen ? (
                                        <input type="text" value="Outsourcing" readOnly className={`${commonInputClasses} bg-gray-100`} />
                                    ) : (
                                        <select name="workingUnit" value={challan.workingUnit || 'Unit I'} onChange={handleWorkingUnitChange} className={commonInputClasses}>
                                            <option value="Unit I">Unit I</option>
                                            <option value="Unit II">Unit II</option>
                                        </select>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
                                    <select name="workerName" value={challan.workerName} onChange={handleWorkerNameChange} className={commonInputClasses}>
                                        <option value="">Select a worker</option>
                                        {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                                        <option value="_add_new_">++ Add New Worker ++</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Extra work</label>
                                    <textarea name="extraWork" rows={2} value={challan.extraWork} onChange={handleChange} className={commonInputClasses} />
                                </div>
                            </div>
                        </fieldset>

                        <fieldset className="border border-gray-200 rounded-lg p-4">
                            <legend className="text-base font-semibold text-gray-900 px-2">Fabric &amp; Process Details</legend>
                            <div className="space-y-4 pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Party DC No</label>
                                        <input name="partyDCNo" type="text" value={challan.partyDCNo} onChange={handleChange} className={`${commonInputClasses} ${errors.partyDCNo ? 'border-red-500' : ''}`} />
                                        {errors.partyDCNo && <p className="mt-1 text-sm text-red-500">{errors.partyDCNo}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Program / Design No</label>
                                        <input name="designNo" type="text" value={challan.designNo} onChange={handleChange} className={commonInputClasses} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Process Dropdown */}
                                    <div ref={processDropdownRef} className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Process <span className="text-red-500">*</span></label>
                                        <button type="button" onClick={() => setProcessDropdownOpen(p => !p)} className={`flex items-center justify-between w-full text-left ${commonInputClasses} ${errors.process ? 'border-red-500' : ''}`}>
                                            <span className="truncate pr-8">{challan.process.length > 0 ? challan.process.join(', ') : 'Select processes'}</span>
                                            <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                        </button>
                                        {isProcessDropdownOpen && (
                                            <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 flex flex-col">
                                                <div className="p-2 border-b border-gray-200">
                                                    <input
                                                        type="text"
                                                        placeholder="Search processes..."
                                                        value={processSearch}
                                                        onChange={(e) => setProcessSearch(e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                    {filteredProcessNames.map(p => (
                                                        <label key={p} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                                            <input type="checkbox" checked={challan.process.includes(p)} onChange={() => handleProcessToggle(p)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                            <span className="ml-3">{p}</span>
                                                        </label>
                                                    ))}
                                                    {filteredProcessNames.length === 0 && (
                                                        <div className="px-4 py-2 text-sm text-gray-500">No process found.</div>
                                                    )}
                                                </div>
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

                                    {/* Split Process Dropdown */}
                                    <div ref={splitProcessDropdownRef} className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Split Process</label>
                                        <button type="button" onClick={() => setSplitProcessDropdownOpen(p => !p)} className={`flex items-center justify-between w-full text-left ${commonInputClasses}`}>
                                            <span className="truncate pr-8">{challan.splitProcess && challan.splitProcess.length > 0 ? challan.splitProcess.join(', ') : 'Select split processes'}</span>
                                            <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                        </button>
                                        {isSplitProcessDropdownOpen && (
                                            <div className="absolute top-full mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 flex flex-col">
                                                <div className="p-2 border-b border-gray-200">
                                                    <input
                                                        type="text"
                                                        placeholder="Search processes..."
                                                        value={splitProcessSearch}
                                                        onChange={(e) => setSplitProcessSearch(e.target.value)}
                                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                    {filteredSplitProcessNames.map(p => (
                                                        <label key={p} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                                            <input type="checkbox" checked={(challan.splitProcess || []).includes(p)} onChange={() => handleSplitProcessToggle(p)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                            <span className="ml-3">{p}</span>
                                                        </label>
                                                    ))}
                                                    {filteredSplitProcessNames.length === 0 && (
                                                        <div className="px-4 py-2 text-sm text-gray-500">No process found.</div>
                                                    )}
                                                </div>
                                                <div className="border-t border-gray-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSplitProcessDropdownOpen(false);
                                                            setShowAddProcessModal(true);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-blue-600 font-semibold hover:bg-gray-100"
                                                    >
                                                        ++ Add New Process ++
                                                    </button>
                                                </div>
                                            </div>
                                        )}
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
                            </div>
                        </fieldset>
                        
                        <fieldset className="border border-gray-200 rounded-lg p-4">
                            <legend className="text-base font-semibold text-gray-900 px-2">Attachments</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
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
                        </fieldset>
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
