
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CloseIcon, CalendarIcon, CameraIcon, PlusIcon, TrashIcon, SearchIcon, ChevronDownIcon } from './Icons';
import DatePicker from './DatePicker';
import AddShopModal from './AddShopModal';
import AddPurchaseShopModal from './AddPurchaseShopModal';
import EmployeeModal from './EmployeeModal';
import ProcessTypeModal from './PartyDCProcessModal';
import type { DeliveryChallan, Client, PurchaseShop, ProcessType, DeliveryChallanNumberConfig, Employee, CompanyDetails } from '../types';

// Helper hook for click outside
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

interface DeliveryChallanFormProps {
    onClose: () => void;
    onSave: (challan: Omit<DeliveryChallan, 'id'>) => void;
    clients: Client[];
    onAddClient: (newClient: Omit<Client, 'id'>) => void;
    purchaseShops: PurchaseShop[];
    onAddPurchaseShop: (newShop: Omit<PurchaseShop, 'id'>) => void;
    processTypes: ProcessType[];
    onAddProcessType: (process: { name: string, rate: number }) => void;
    deliveryChallanNumberConfig: DeliveryChallanNumberConfig;
    challanToEdit: DeliveryChallan | null;
    existingChallans: DeliveryChallan[];
    employees: Employee[];
    onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
    companyDetails: CompanyDetails;
    isOutsourcingScreen: boolean;
}

const BLANK_CHALLAN: Omit<DeliveryChallan, 'id'> = {
    challanNumber: '',
    date: new Date().toISOString().split('T')[0],
    partyName: '',
    partyDCNo: '',
    process: [],
    splitProcess: [],
    designNo: '',
    pcs: 0,
    mtr: 0,
    finalMeter: 0,
    width: 0,
    shrinkage: '',
    pin: '',
    pick: '',
    percentage: '',
    extraWork: '',
    status: '',
    workerName: '',
    workingUnit: '',
    isOutsourcing: false,
    dcImage: [],
    sampleImage: []
};

const formatDateForInput = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const DeliveryChallanForm: React.FC<DeliveryChallanFormProps> = ({
    onClose, onSave, clients, onAddClient, purchaseShops, onAddPurchaseShop,
    processTypes, onAddProcessType, deliveryChallanNumberConfig, challanToEdit,
    employees, onAddEmployee, isOutsourcingScreen
}) => {
    const [challan, setChallan] = useState<Omit<DeliveryChallan, 'id'>>(BLANK_CHALLAN);
    const [fromParty, setFromParty] = useState(''); // Local state for "From Party" (UI only for now)
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [showAddPartyModal, setShowAddPartyModal] = useState(false);
    const [showAddProcessModal, setShowAddProcessModal] = useState(false);
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    
    // Searchable dropdown states
    const [isPartyDropdownOpen, setIsPartyDropdownOpen] = useState(false);
    const [partySearchTerm, setPartySearchTerm] = useState('');
    const partyDropdownRef = useRef<HTMLDivElement>(null);
    useClickOutside(partyDropdownRef, () => {
        setIsPartyDropdownOpen(false);
        setPartySearchTerm('');
    });

    const [isFromPartyDropdownOpen, setIsFromPartyDropdownOpen] = useState(false);
    const [fromPartySearchTerm, setFromPartySearchTerm] = useState('');
    const fromPartyDropdownRef = useRef<HTMLDivElement>(null);
    useClickOutside(fromPartyDropdownRef, () => {
        setIsFromPartyDropdownOpen(false);
        setFromPartySearchTerm('');
    });

    // Process input state
    const [currentProcess, setCurrentProcess] = useState('');
    const [currentSplitProcess, setCurrentSplitProcess] = useState('');

    useEffect(() => {
        if (challanToEdit) {
            const { id, ...rest } = challanToEdit;
            setChallan(rest);
        } else {
            setChallan({
                ...BLANK_CHALLAN,
                challanNumber: `${deliveryChallanNumberConfig.prefix}${deliveryChallanNumberConfig.nextNumber}`,
                date: new Date().toISOString().split('T')[0],
                isOutsourcing: isOutsourcingScreen,
                status: '',
                workingUnit: ''
            });
        }
    }, [challanToEdit, deliveryChallanNumberConfig, isOutsourcingScreen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumberField = type === 'number';
        const newValue = isNumberField ? (value === '' ? 0 : Number(value)) : value;

        setChallan(prev => {
            const updated = { ...prev, [name]: newValue };
            
            // Logic: Auto-calculate Final Meter based on Meter + Gain %
            if (name === 'mtr' || name === 'percentage') {
                const currentMtr = name === 'mtr' ? Number(newValue) : prev.mtr;
                const percInput = name === 'percentage' ? String(newValue) : prev.percentage;
                
                // Strip everything except numbers, decimal point, and sign
                const percValue = parseFloat(percInput.replace(/[^\d.-]/g, '')) || 0;
                
                if (currentMtr > 0) {
                    // Correct Calculation: Meter + Gain Percentage (e.g. 1000 + 5% = 1050)
                    const gainAmount = (currentMtr * percValue) / 100;
                    const calculatedFinal = currentMtr + gainAmount;
                    updated.finalMeter = Number(calculatedFinal.toFixed(2));
                } else {
                    updated.finalMeter = 0;
                }
            }
            
            return updated;
        });

        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSelectParty = (value: string) => {
        if (value === '_add_new_') {
            setShowAddPartyModal(true);
        } else {
            setChallan(prev => ({ ...prev, partyName: value }));
            if (errors.partyName) setErrors(prev => ({ ...prev, partyName: '' }));
        }
        setIsPartyDropdownOpen(false);
        setPartySearchTerm('');
    };

    const handleSelectFromParty = (value: string) => {
        setFromParty(value);
        if (errors.fromParty) setErrors(prev => ({ ...prev, fromParty: '' }));
        if (errors.partyName) setErrors(prev => ({ ...prev, partyName: '' }));
        setIsFromPartyDropdownOpen(false);
        setFromPartySearchTerm('');
    };

    const handleProcessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '_add_new_') {
            setShowAddProcessModal(true);
        } else if (value) {
            if (!challan.process.includes(value)) {
                setChallan(prev => ({ ...prev, process: [...prev.process, value] }));
            }
            setCurrentProcess(''); // Reset selection
        }
    };

    const handleSplitProcessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '_add_new_') {
            setShowAddProcessModal(true);
        } else if (value) {
            if (!challan.splitProcess.includes(value)) {
                setChallan(prev => ({ ...prev, splitProcess: [...prev.splitProcess, value] }));
            }
            setCurrentSplitProcess(''); // Reset selection
        }
    };

    const removeProcess = (proc: string) => {
        setChallan(prev => ({ ...prev, process: prev.process.filter(p => p !== proc) }));
    };

    const removeSplitProcess = (proc: string) => {
        setChallan(prev => ({ ...prev, splitProcess: prev.splitProcess.filter(p => p !== proc) }));
    };

    const handleWorkerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '_add_new_') {
            setShowAddEmployeeModal(true);
        } else {
            setChallan(prev => ({ ...prev, workerName: value }));
        }
    };

    // Image handling
    const dcImageInputRef = useRef<HTMLInputElement>(null);
    const sampleImageInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'dcImage' | 'sampleImage') => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files) as File[];
            const readers = files.map((file: File) => {
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(readers).then(base64Images => {
                setChallan(prev => ({ ...prev, [field]: [...(prev[field] || []), ...base64Images] }));
            });
        }
    };

    const removeImage = (field: 'dcImage' | 'sampleImage', index: number) => {
        setChallan(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    // Modal Saves
    const handleSaveParty = (partyData: any) => {
        onAddClient(partyData);
        setChallan(prev => ({ ...prev, partyName: partyData.name }));
        setShowAddPartyModal(false);
    };

    const handleSaveProcess = (processData: { name: string, rate: number }) => {
        onAddProcessType(processData);
        setChallan(prev => ({ ...prev, process: [...prev.process, processData.name] }));
        setShowAddProcessModal(false);
    };

    const handleSaveEmployee = (employeeData: Omit<Employee, 'id'>) => {
        onAddEmployee(employeeData);
        setChallan(prev => ({ ...prev, workerName: employeeData.name }));
        setShowAddEmployeeModal(false);
    };

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!challan.challanNumber) newErrors.challanNumber = "Challan Number is required.";
        if (!challan.date) newErrors.date = "Date is required.";
        if (!challan.partyName) newErrors.partyName = isOutsourcingScreen ? "To Party is required." : "Party Name is required.";
        if (!challan.status) newErrors.status = "Status is required.";
        if (challan.process.length === 0) newErrors.process = "At least one process is required.";
        if (challan.pcs <= 0) newErrors.pcs = "Pcs must be greater than 0.";
        
        if (isOutsourcingScreen) {
             if (!fromParty && !challanToEdit) {
                 newErrors.fromParty = "From Party is required.";
             }
             if (fromParty && challan.partyName && fromParty === challan.partyName) {
                 newErrors.partyName = "From Party and To Party cannot be the same.";
             }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSave(challan);
        }
    };

    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
    const statusOptions = ['Not Delivered', 'Ready to Invoice', 'Delivered', 'Rework', 'Processing', 'Pending'];
    const workingUnitOptions = ['Unit I', 'Unit II'];

    const filteredClients = useMemo(() => {
        const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name));
        if (!partySearchTerm) return sorted;
        return sorted.filter(c => c.name.toLowerCase().includes(partySearchTerm.toLowerCase()));
    }, [clients, partySearchTerm]);

    const filteredFromClients = useMemo(() => {
        const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name));
        if (!fromPartySearchTerm) return sorted;
        return sorted.filter(c => c.name.toLowerCase().includes(fromPartySearchTerm.toLowerCase()));
    }, [clients, fromPartySearchTerm]);

    return (
        <>
            {showAddPartyModal && (
                <AddShopModal onClose={() => setShowAddPartyModal(false)} onSave={(name) => handleSaveParty({ name, phone:'', email:'', address:'', city:'', state:'', pincode:'', gstNo:'', panNo:'', paymentTerms:'Due on receipt', processes: [] })} existingClientNames={clients.map(c => c.name)} />
            )}
            {showAddProcessModal && <ProcessTypeModal onClose={() => setShowAddProcessModal(false)} onSave={handleSaveProcess} existingProcessNames={processTypes.map(p => p.name)} />}
            {showAddEmployeeModal && <EmployeeModal onClose={() => setShowAddEmployeeModal(false)} onSave={handleSaveEmployee} existingEmployees={employees} />}

            <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-start p-4 pt-10" role="dialog">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl animate-fade-in-down overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between p-5 border-b shrink-0">
                        <h2 className="text-xl font-bold text-gray-800">{challanToEdit ? 'Edit Challan' : (isOutsourcingScreen ? 'Create New Outsourcing Challan' : 'New Delivery Challan')}</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-grow space-y-8">
                        
                        <div className="border border-gray-200 rounded-lg p-4 relative">
                            <h3 className="text-sm font-bold text-gray-900 bg-white px-2 absolute -top-2.5 left-4">Challan Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Challan Number</label>
                                    <input type="text" name="challanNumber" value={challan.challanNumber} onChange={handleChange} className={`${commonInputClasses} bg-gray-50`} readOnly={!isOutsourcingScreen} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <div className="relative">
                                        <button type="button" onClick={() => setDatePickerOpen(p => !p)} className={`block w-full text-left ${commonInputClasses}`}>
                                            {formatDateForInput(challan.date) || 'Select date'}
                                            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        </button>
                                        {/* Fix: Replaced undefined variable 'p' with 'prev' in setChallan update */}
                                        {isDatePickerOpen && <DatePicker value={challan.date} onChange={d => { setChallan(prev => ({...prev, date: d})); setDatePickerOpen(false); }} onClose={() => setDatePickerOpen(false)} />}
                                    </div>
                                    {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                                    <select name="status" value={challan.status} onChange={handleChange} className={`${commonInputClasses} ${errors.status ? 'border-red-500' : ''}`}>
                                        <option value="" disabled>Select Status</option>
                                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {errors.status && <p className="mt-1 text-sm text-red-500">{errors.status}</p>}
                                </div>
                            </div>
                            
                            {isOutsourcingScreen ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    <div ref={fromPartyDropdownRef}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">From Party <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                className={`${commonInputClasses} flex items-center justify-between bg-white ${errors.fromParty ? 'border-red-500' : ''}`}
                                                onClick={() => setIsFromPartyDropdownOpen(!isFromPartyDropdownOpen)}
                                            >
                                                <span className={`block truncate ${fromParty ? 'text-gray-900' : 'text-gray-500'}`}>
                                                    {fromParty || 'Select a client'}
                                                </span>
                                                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                            </button>
                                            {isFromPartyDropdownOpen && (
                                                <div className="absolute z-30 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                                    <div className="sticky top-0 z-10 bg-white px-2 py-1.5 border-b border-gray-200">
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                                <SearchIcon className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                className="block w-full pl-8 pr-3 py-1 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                placeholder="Search party..."
                                                                value={fromPartySearchTerm}
                                                                onChange={(e) => setFromPartySearchTerm(e.target.value)}
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </div>
                                                    {filteredFromClients.map((client) => (
                                                        <div
                                                            key={client.id}
                                                            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${fromParty === client.name ? 'text-blue-900 bg-blue-100 font-medium' : 'text-gray-900'}`}
                                                            onClick={() => handleSelectFromParty(client.name)}
                                                        >
                                                            <span className="block truncate">{client.name}</span>
                                                        </div>
                                                    ))}
                                                    {filteredFromClients.length === 0 && (
                                                        <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500 text-center">
                                                            No matches found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {errors.fromParty && <p className="mt-1 text-sm text-red-500">{errors.fromParty}</p>}
                                    </div>
                                    <div ref={partyDropdownRef}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">To Party <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                className={`${commonInputClasses} flex items-center justify-between bg-white ${errors.partyName ? 'border-red-500' : ''}`}
                                                onClick={() => setIsPartyDropdownOpen(!isPartyDropdownOpen)}
                                            >
                                                <span className={`block truncate ${challan.partyName ? 'text-gray-900' : 'text-gray-500'}`}>
                                                    {challan.partyName || 'Select a client'}
                                                </span>
                                                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                            </button>
                                            {isPartyDropdownOpen && (
                                                <div className="absolute z-30 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                                    <div className="sticky top-0 z-10 bg-white px-2 py-1.5 border-b border-gray-200">
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                                <SearchIcon className="h-4 w-4 text-gray-400" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                className="block w-full pl-8 pr-3 py-1 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                                placeholder="Search party..."
                                                                value={partySearchTerm}
                                                                onChange={(e) => setPartySearchTerm(e.target.value)}
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </div>
                                                    <div
                                                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-blue-600 font-semibold hover:bg-blue-50 border-b border-gray-100"
                                                        onClick={() => handleSelectParty('_add_new_')}
                                                    >
                                                        <span className="flex items-center"><PlusIcon className="w-4 h-4 mr-1" /> Add New Party</span>
                                                    </div>
                                                    {filteredClients.map((client) => (
                                                        <div
                                                            key={client.id}
                                                            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${challan.partyName === client.name ? 'text-blue-900 bg-blue-100 font-medium' : 'text-gray-900'}`}
                                                            onClick={() => handleSelectParty(client.name)}
                                                        >
                                                            <span className="block truncate">{client.name}</span>
                                                        </div>
                                                    ))}
                                                    {filteredClients.length === 0 && (
                                                        <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500 text-center">
                                                            No matches found
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {errors.partyName && <p className="mt-1 text-sm text-red-500">{errors.partyName}</p>}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4" ref={partyDropdownRef}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Party Name <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            className={`${commonInputClasses} flex items-center justify-between bg-white ${errors.partyName ? 'border-red-500' : ''}`}
                                            onClick={() => setIsPartyDropdownOpen(!isPartyDropdownOpen)}
                                        >
                                            <span className={`block truncate ${challan.partyName ? 'text-gray-900' : 'text-gray-500'}`}>
                                                {challan.partyName || 'Select Party'}
                                            </span>
                                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                        </button>
                                        {isPartyDropdownOpen && (
                                            <div className="absolute z-30 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                                <div className="sticky top-0 z-10 bg-white px-2 py-1.5 border-b border-gray-200">
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                            <SearchIcon className="h-4 w-4 text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            className="block w-full pl-8 pr-3 py-1 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                                            placeholder="Search party..."
                                                            value={partySearchTerm}
                                                            onChange={(e) => setPartySearchTerm(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div
                                                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-blue-600 font-semibold hover:bg-blue-50 border-b border-gray-100"
                                                    onClick={() => handleSelectParty('_add_new_')}
                                                >
                                                    <span className="flex items-center"><PlusIcon className="w-4 h-4 mr-1" /> Add New Party</span>
                                                </div>
                                                {filteredClients.map((client) => (
                                                    <div
                                                        key={client.id}
                                                        className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 ${challan.partyName === client.name ? 'text-blue-900 bg-blue-100 font-medium' : 'text-gray-900'}`}
                                                        onClick={() => handleSelectParty(client.name)}
                                                    >
                                                        <span className="block truncate">{client.name}</span>
                                                    </div>
                                                ))}
                                                {filteredClients.length === 0 && (
                                                    <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500 text-center">
                                                        No matches found
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {errors.partyName && <p className="mt-1 text-sm text-red-500">{errors.partyName}</p>}
                                </div>
                            )}
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4 relative">
                            <h3 className="text-sm font-bold text-gray-900 bg-white px-2 absolute -top-2.5 left-4">Production Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Working Unit</label>
                                    <select name="workingUnit" value={challan.workingUnit} onChange={handleChange} className={commonInputClasses}>
                                        <option value="" disabled>Select Working Unit</option>
                                        {workingUnitOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
                                    <select name="workerName" value={challan.workerName} onChange={handleWorkerChange} className={commonInputClasses}>
                                        <option value="">Select a worker</option>
                                        {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                                        <option value="_add_new_" className="font-semibold text-blue-600">++ Add New Worker ++</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Extra work</label>
                                <textarea name="extraWork" value={challan.extraWork} onChange={handleChange} rows={2} className={commonInputClasses}></textarea>
                            </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4 relative">
                            <h3 className="text-sm font-bold text-gray-900 bg-white px-2 absolute -top-2.5 left-4">Fabric &amp; Process Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Party DC No</label>
                                    <input type="text" name="partyDCNo" value={challan.partyDCNo} onChange={handleChange} className={commonInputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Program / Design No</label>
                                    <input type="text" name="designNo" value={challan.designNo} onChange={handleChange} className={commonInputClasses} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Process <span className="text-red-500">*</span></label>
                                    <select value={currentProcess} onChange={handleProcessChange} className={commonInputClasses}>
                                        <option value="">Select processes</option>
                                        {processTypes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                        <option value="_add_new_" className="font-semibold text-blue-600">++ Add New Process ++</option>
                                    </select>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {challan.process.map(p => (
                                            <span key={p} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {p}
                                                <button type="button" onClick={() => removeProcess(p)} className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none">
                                                    <CloseIcon className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    {errors.process && <p className="mt-1 text-sm text-red-500">{errors.process}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Split Process</label>
                                    <select value={currentSplitProcess} onChange={handleSplitProcessChange} className={commonInputClasses}>
                                        <option value="">Select split processes</option>
                                        {processTypes.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                        <option value="_add_new_" className="font-semibold text-blue-600">++ Add New Process ++</option>
                                    </select>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {challan.splitProcess && challan.splitProcess.map(p => (
                                            <span key={p} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {p}
                                                <button type="button" onClick={() => removeSplitProcess(p)} className="ml-1.5 inline-flex text-green-400 hover:text-green-600 focus:outline-none">
                                                    <CloseIcon className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mt-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">No of pcs</label>
                                    <input type="number" name="pcs" value={challan.pcs || ''} onChange={handleChange} className={`${commonInputClasses} ${errors.pcs ? 'border-red-500' : ''}`} />
                                    {errors.pcs && <p className="text-xs text-red-500 mt-1">{errors.pcs}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mtr</label>
                                    <input type="number" name="mtr" value={challan.mtr || ''} onChange={handleChange} className={commonInputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Final Meter</label>
                                    <input type="number" name="finalMeter" value={challan.finalMeter || ''} readOnly className={`${commonInputClasses} bg-gray-100 font-medium cursor-not-allowed`} tabIndex={-1} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                                    <input type="number" name="width" value={challan.width || ''} onChange={handleChange} className={commonInputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Shrinkage</label>
                                    <input type="text" name="shrinkage" value={challan.shrinkage} onChange={handleChange} className={commonInputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pin</label>
                                    <input type="text" name="pin" value={challan.pin} onChange={handleChange} className={commonInputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pick</label>
                                    <input type="text" name="pick" value={challan.pick} onChange={handleChange} className={commonInputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Percentage</label>
                                    <input type="text" name="percentage" value={challan.percentage} onChange={handleChange} className={commonInputClasses} placeholder="e.g. 5%" />
                                </div>
                            </div>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4 relative">
                            <h3 className="text-sm font-bold text-gray-900 bg-white px-2 absolute -top-2.5 left-4">Attachments</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">DC Images</label>
                                    <div 
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 min-h-[100px]"
                                        onClick={() => dcImageInputRef.current?.click()}
                                    >
                                        <input type="file" min="1" max="10" ref={dcImageInputRef} onChange={e => handleImageUpload(e, 'dcImage')} className="hidden" multiple accept="image/*" />
                                        {challan.dcImage.length > 0 ? (
                                            <div className="flex flex-wrap gap-2 w-full justify-center">
                                                {challan.dcImage.map((img, idx) => (
                                                    <div key={idx} className="relative w-20 h-20 border rounded overflow-hidden" onClick={e => e.stopPropagation()}>
                                                        <img src={img} alt={`DC ${idx}`} className="w-full h-full object-cover" />
                                                        <button onClick={() => removeImage('dcImage', idx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl shadow"><CloseIcon className="w-3 h-3"/></button>
                                                    </div>
                                                ))}
                                                <div className="flex items-center justify-center w-20 h-20 border rounded bg-gray-100">
                                                    <PlusIcon className="w-6 h-6 text-gray-400" />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <CameraIcon className="w-8 h-8 text-gray-400 mb-2" />
                                                <span className="text-sm text-gray-500">Click to upload DC images</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sample Images</label>
                                    <div 
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 min-h-[100px]"
                                        onClick={() => sampleImageInputRef.current?.click()}
                                    >
                                        <input type="file" min="1" max="10" ref={sampleImageInputRef} onChange={e => handleImageUpload(e, 'sampleImage')} className="hidden" multiple accept="image/*" />
                                        {challan.sampleImage.length > 0 ? (
                                            <div className="flex flex-wrap gap-2 w-full justify-center">
                                                {challan.sampleImage.map((img, idx) => (
                                                    <div key={idx} className="relative w-20 h-20 border rounded overflow-hidden" onClick={e => e.stopPropagation()}>
                                                        <img src={img} alt={`Sample ${idx}`} className="w-full h-full object-cover" />
                                                        <button onClick={() => removeImage('sampleImage', idx)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl shadow"><CloseIcon className="w-3 h-3"/></button>
                                                    </div>
                                                ))}
                                                <div className="flex items-center justify-center w-20 h-20 border rounded bg-gray-100">
                                                    <PlusIcon className="w-6 h-6 text-gray-400" />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <CameraIcon className="w-8 h-8 text-gray-400 mb-2" />
                                                <span className="text-sm text-gray-500">Click to upload Sample images</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="flex items-center justify-end p-5 bg-gray-50 border-t shrink-0 space-x-3">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-secondary-700 rounded-md text-sm font-semibold hover:bg-secondary-50">Cancel</button>
                        <button onClick={handleSubmit} className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700">
                            {challanToEdit ? 'Update Challan' : 'Save Challan'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DeliveryChallanForm;
