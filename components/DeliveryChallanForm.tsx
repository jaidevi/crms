import React, { useState, useEffect, useRef } from 'react';
import { CloseIcon, CalendarIcon, CameraIcon, PlusIcon, TrashIcon } from './Icons';
import DatePicker from './DatePicker';
import AddShopModal from './AddShopModal';
import AddPurchaseShopModal from './AddPurchaseShopModal';
import EmployeeModal from './EmployeeModal';
import ProcessTypeModal from './PartyDCProcessModal';
import type { DeliveryChallan, Client, PurchaseShop, ProcessType, DeliveryChallanNumberConfig, Employee, CompanyDetails } from '../types';

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
    width: 0,
    percentage: '',
    shrinkage: '',
    pin: '',
    pick: '',
    extraWork: '',
    status: 'Not Delivered',
    workerName: '',
    workingUnit: 'Meters',
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
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);
    const [showAddPartyModal, setShowAddPartyModal] = useState(false);
    const [showAddProcessModal, setShowAddProcessModal] = useState(false);
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    
    // Process input state
    const [currentProcess, setCurrentProcess] = useState('');

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
                status: isOutsourcingScreen ? 'Pending' : 'Not Delivered'
            });
        }
    }, [challanToEdit, deliveryChallanNumberConfig, isOutsourcingScreen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setChallan(prev => ({ ...prev, [name]: isNumber ? (value === '' ? 0 : Number(value)) : value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handlePartyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '_add_new_') {
            setShowAddPartyModal(true);
        } else {
            setChallan(prev => ({ ...prev, partyName: value }));
            if (errors.partyName) setErrors(prev => ({ ...prev, partyName: '' }));
        }
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

    const removeProcess = (proc: string) => {
        setChallan(prev => ({ ...prev, process: prev.process.filter(p => p !== proc) }));
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
            const files = Array.from(e.target.files);
            const readers = files.map(file => {
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
        if (isOutsourcingScreen) {
            onAddPurchaseShop(partyData);
        } else {
            onAddClient(partyData);
        }
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
        if (!challan.partyName) newErrors.partyName = "Party Name is required.";
        if (challan.process.length === 0) newErrors.process = "At least one process is required.";
        if (challan.pcs <= 0) newErrors.pcs = "Pcs must be greater than 0.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSave(challan);
        }
    };

    const commonInputClasses = "block w-full px-3 py-2.5 text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500";
    const statusOptions = isOutsourcingScreen 
        ? ['Pending', 'Processing', 'Ready to Invoice', 'Delivered', 'Rework'] 
        : ['Not Delivered', 'Ready to Invoice', 'Delivered', 'Rework'];

    return (
        <>
            {showAddPartyModal && (
                isOutsourcingScreen ? (
                    <AddPurchaseShopModal onClose={() => setShowAddPartyModal(false)} onSave={(name) => handleSaveParty({ name, phone:'', email:'', address:'', city:'', state:'', pincode:'', gstNo:'', panNo:'', paymentTerms:'Due on receipt' })} existingShopNames={purchaseShops.map(s => s.name)} />
                ) : (
                    <AddShopModal onClose={() => setShowAddPartyModal(false)} onSave={(name) => handleSaveParty({ name, phone:'', email:'', address:'', city:'', state:'', pincode:'', gstNo:'', panNo:'', paymentTerms:'Due on receipt', processes: [] })} existingClientNames={clients.map(c => c.name)} />
                )
            )}
            {showAddProcessModal && <ProcessTypeModal onClose={() => setShowAddProcessModal(false)} onSave={handleSaveProcess} existingProcessNames={processTypes.map(p => p.name)} />}
            {showAddEmployeeModal && <EmployeeModal onClose={() => setShowAddEmployeeModal(false)} onSave={handleSaveEmployee} existingEmployees={employees} />}

            <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-start p-4 pt-10" role="dialog">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl animate-fade-in-down overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between p-5 border-b shrink-0">
                        <h2 className="text-xl font-bold text-gray-800">{challanToEdit ? 'Edit Challan' : (isOutsourcingScreen ? 'New Outsourcing Job' : 'New Delivery Challan')}</h2>
                        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto flex-grow space-y-6">
                        {/* Top Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Challan No <span className="text-red-500">*</span></label>
                                <input type="text" name="challanNumber" value={challan.challanNumber} onChange={handleChange} className={`${commonInputClasses} ${errors.challanNumber ? 'border-red-500' : ''}`} />
                                {errors.challanNumber && <p className="mt-1 text-sm text-red-500">{errors.challanNumber}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <button type="button" onClick={() => setDatePickerOpen(p => !p)} className={`block w-full text-left ${commonInputClasses}`}>
                                        {formatDateForInput(challan.date) || 'Select date'}
                                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    </button>
                                    {isDatePickerOpen && <DatePicker value={challan.date} onChange={d => { setChallan(prev => ({...prev, date: d})); setDatePickerOpen(false); }} onClose={() => setDatePickerOpen(false)} />}
                                </div>
                                {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Party Name <span className="text-red-500">*</span></label>
                                <select name="partyName" value={challan.partyName} onChange={handlePartyChange} className={`${commonInputClasses} ${errors.partyName ? 'border-red-500' : ''}`}>
                                    <option value="">Select Party</option>
                                    {isOutsourcingScreen 
                                        ? purchaseShops.map(s => <option key={s.id} value={s.name}>{s.name}</option>) 
                                        : clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
                                    }
                                    <option value="_add_new_" className="font-semibold text-blue-600">++ Add New Party ++</option>
                                </select>
                                {errors.partyName && <p className="mt-1 text-sm text-red-500">{errors.partyName}</p>}
                            </div>
                        </div>

                        {/* Process & Description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Process <span className="text-red-500">*</span></label>
                                <select value={currentProcess} onChange={handleProcessChange} className={commonInputClasses}>
                                    <option value="">Add Process</option>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Design No</label>
                                <input type="text" name="designNo" value={challan.designNo} onChange={handleChange} className={commonInputClasses} />
                            </div>
                        </div>

                        {/* Measurements */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pcs <span className="text-red-500">*</span></label>
                                <input type="number" name="pcs" value={challan.pcs || ''} onChange={handleChange} className={`${commonInputClasses} ${errors.pcs ? 'border-red-500' : ''}`} />
                                {errors.pcs && <p className="mt-1 text-sm text-red-500">{errors.pcs}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meters</label>
                                <input type="number" name="mtr" value={challan.mtr || ''} onChange={handleChange} className={commonInputClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                                <input type="number" name="width" value={challan.width || ''} onChange={handleChange} className={commonInputClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Shrinkage</label>
                                <input type="text" name="shrinkage" value={challan.shrinkage} onChange={handleChange} className={commonInputClasses} />
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pin</label>
                                <input type="text" name="pin" value={challan.pin} onChange={handleChange} className={commonInputClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pick</label>
                                <input type="text" name="pick" value={challan.pick} onChange={handleChange} className={commonInputClasses} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Party DC No</label>
                                <input type="text" name="partyDCNo" value={challan.partyDCNo} onChange={handleChange} className={commonInputClasses} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select name="status" value={challan.status} onChange={handleChange} className={commonInputClasses}>
                                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
                                <select name="workerName" value={challan.workerName} onChange={handleWorkerChange} className={commonInputClasses}>
                                    <option value="">Select Worker</option>
                                    {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                                    <option value="_add_new_" className="font-semibold text-blue-600">++ Add New Worker ++</option>
                                </select>
                            </div>
                        </div>

                        {/* Images */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">DC Images</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {challan.dcImage.map((img, idx) => (
                                        <div key={idx} className="relative w-20 h-20 border rounded">
                                            <img src={img} alt={`DC ${idx}`} className="w-full h-full object-cover" />
                                            <button onClick={() => removeImage('dcImage', idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><CloseIcon className="w-3 h-3"/></button>
                                        </div>
                                    ))}
                                </div>
                                <input type="file" ref={dcImageInputRef} onChange={e => handleImageUpload(e, 'dcImage')} className="hidden" multiple accept="image/*" />
                                <button type="button" onClick={() => dcImageInputRef.current?.click()} className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                                    <CameraIcon className="w-4 h-4 mr-2" /> Upload DC Image
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sample Images</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {challan.sampleImage.map((img, idx) => (
                                        <div key={idx} className="relative w-20 h-20 border rounded">
                                            <img src={img} alt={`Sample ${idx}`} className="w-full h-full object-cover" />
                                            <button onClick={() => removeImage('sampleImage', idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><CloseIcon className="w-3 h-3"/></button>
                                        </div>
                                    ))}
                                </div>
                                <input type="file" ref={sampleImageInputRef} onChange={e => handleImageUpload(e, 'sampleImage')} className="hidden" multiple accept="image/*" />
                                <button type="button" onClick={() => sampleImageInputRef.current?.click()} className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                                    <CameraIcon className="w-4 h-4 mr-2" /> Upload Sample Image
                                </button>
                            </div>
                        </div>

                    </div>

                    <div className="flex items-center justify-end p-5 bg-gray-50 border-t shrink-0 space-x-3">
                        <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50">Cancel</button>
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