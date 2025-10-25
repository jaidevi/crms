import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { Employee, AttendanceRecord, AttendanceStatus } from '../App';
import { ChevronLeftIcon, ChevronRightIcon, SpinnerIcon, CheckIcon, EditIcon } from './Icons';

interface AttendanceScreenProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onSave: (records: Omit<AttendanceRecord, 'id'>[]) => Promise<void>;
}

type LocalAttendance = {
    morningStatus: AttendanceStatus;
    eveningStatus: AttendanceStatus;
    overtimeHours: number;
    metersProduced: number;
    createdAt?: string;
    updatedAt?: string;
};

// Helper to get a date in YYYY-MM-DD format, respecting local timezone.
const toYMDString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

interface MonthYearPickerProps {
    currentDate: Date;
    onSelect: (date: Date) => void;
    onClose: () => void;
    isMonthInFuture: (year: number, month: number) => boolean;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ currentDate, onSelect, onClose, isMonthInFuture }) => {
    const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());
    const pickerRef = useRef<HTMLDivElement>(null);
    useClickOutside(pickerRef, onClose);

    const months = useMemo(() => Array.from({ length: 12 }, (_, i) => 
        new Date(0, i).toLocaleString('default', { month: 'short' })
    ), []);

    const handleMonthSelect = (monthIndex: number) => {
        onSelect(new Date(pickerYear, monthIndex, 1));
    };
    
    const isNextYearDisabled = useMemo(() => {
        const todayDate = new Date();
        return pickerYear >= todayDate.getFullYear();
    }, [pickerYear]);

    return (
        <div ref={pickerRef} className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-30 p-3 animate-fade-in-down origin-top">
            <div className="flex items-center justify-between mb-3 px-1">
                <button onClick={() => setPickerYear(y => y - 1)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500" aria-label="Previous year">
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <div className="font-semibold text-gray-800 text-sm">
                    {pickerYear}
                </div>
                <button onClick={() => setPickerYear(y => y + 1)} disabled={isNextYearDisabled} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 disabled:text-gray-300 disabled:cursor-not-allowed" aria-label="Next year">
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="grid grid-cols-4 gap-1">
                {months.map((month, index) => {
                    const isSelected = pickerYear === currentDate.getFullYear() && index === currentDate.getMonth();
                    const isDisabled = isMonthInFuture(pickerYear, index);

                    return (
                        <button
                            key={month}
                            onClick={() => handleMonthSelect(index)}
                            disabled={isDisabled}
                            className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                isSelected ? 'bg-blue-600 text-white font-semibold' :
                                isDisabled ? 'text-gray-300 cursor-not-allowed' :
                                'hover:bg-gray-100 text-gray-700'
                            }`}
                        >
                            {month}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};

const getStatusSelectClasses = (status: AttendanceStatus | 'N/A') => {
    const baseClasses = "w-full p-1 text-xs border-transparent rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed font-medium";
    switch (status) {
        case 'Present':
            return `${baseClasses} bg-green-100 text-green-800`;
        case 'Absent':
            return `${baseClasses} bg-red-100 text-red-800`;
        case 'Holiday':
            return `${baseClasses} bg-purple-100 text-purple-800`;
        case 'Leave':
            return `${baseClasses} bg-pink-100 text-pink-800`;
        default:
            return `${baseClasses} bg-gray-100 text-gray-800`;
    }
};

const formatTime = (isoString?: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatDateForTimestamp = (isoString?: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const wasEdited = (createdAt?: string, updatedAt?: string): boolean => {
    if (!createdAt || !updatedAt) return false;
    const createdDate = new Date(createdAt).getTime();
    const updatedDate = new Date(updatedAt).getTime();
    return (updatedDate - createdDate) > 5000; // More than 5 seconds difference
};

const AttendanceScreen: React.FC<AttendanceScreenProps> = ({ employees, attendanceRecords, onSave }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [localAttendance, setLocalAttendance] = useState<Map<string, LocalAttendance>>(new Map());
    const [hasChanges, setHasChanges] = useState(false);
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
    const [editingDate, setEditingDate] = useState<string | null>(null);

    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const todayForEffect = new Date();
        todayForEffect.setHours(0, 0, 0, 0);

        const populatedMap = new Map<string, LocalAttendance>();
        
        attendanceRecords.forEach(rec => {
            const [recYear, recMonth] = rec.date.split('-').map(Number);
            if (recYear === year && (recMonth - 1) === month) {
                const key = `${rec.employee_id}|${rec.date}`;
                populatedMap.set(key, { 
                    morningStatus: rec.morningStatus, 
                    eveningStatus: rec.eveningStatus,
                    overtimeHours: (rec.morningOvertimeHours || 0) + (rec.eveningOvertimeHours || 0),
                    metersProduced: rec.metersProduced || 0,
                    createdAt: rec.createdAt,
                    updatedAt: rec.updatedAt,
                });
            }
        });

        employees.forEach(emp => {
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                if (date <= todayForEffect) {
                    const dateString = toYMDString(date);
                    const key = `${emp.id}|${dateString}`;
                    if (!populatedMap.has(key)) {
                        const isSunday = date.getDay() === 0;
                        populatedMap.set(key, { 
                            morningStatus: isSunday ? 'Holiday' : 'Present', 
                            eveningStatus: isSunday ? 'Holiday' : 'Present',
                            overtimeHours: 0,
                            metersProduced: 0,
                        });
                    }
                }
            }
        });

        setLocalAttendance(populatedMap);
        setHasChanges(false); 
        if (saveState !== 'idle') {
            setSaveState('idle');
        }
    }, [currentDate, employees, attendanceRecords, saveState]);

    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const { daysInMonth, month, year, monthName, isCurrentOrFutureMonth } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthName = currentDate.toLocaleString('default', { month: 'long' });
        
        const todayDate = new Date();
        const todayYear = todayDate.getFullYear();
        const todayMonth = todayDate.getMonth();
        const isCurrentOrFutureMonth = year > todayYear || (year === todayYear && month >= todayMonth);

        return { daysInMonth, month, year, monthName, isCurrentOrFutureMonth };
    }, [currentDate]);

    const dayHeaders = useMemo(() => {
        return Array.from({ length: daysInMonth }, (_, i) => {
            const date = new Date(year, month, i + 1);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
            return { day: i + 1, name: dayName };
        });
    }, [daysInMonth, year, month]);

    const navigateToDate = (newDate: Date) => {
        if (hasChanges && !window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
            return;
        }
        setCurrentDate(newDate);
        setHasChanges(false);
        setSaveState('idle');
        setEditingDate(null);
    };

    const handleMonthChange = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(1);
        newDate.setMonth(newDate.getMonth() + offset);
        navigateToDate(newDate);
    };

    const isMonthInFuture = useCallback((yearParam: number, monthParam: number): boolean => {
        const todayDate = new Date();
        const todayYear = todayDate.getFullYear();
        const todayMonth = todayDate.getMonth();
        return yearParam > todayYear || (yearParam === todayYear && monthParam > todayMonth);
    }, []);

    const handleAttendanceChange = useCallback((employeeId: string, day: number, newValues: Partial<LocalAttendance>) => {
        const date = new Date(year, month, day);
        const isSunday = date.getDay() === 0;
        const dateString = toYMDString(date);
        const key = `${employeeId}|${dateString}`;
        
        const defaultStatus = isSunday ? 'Holiday' : 'Present';
        const currentRecord = localAttendance.get(key) || { morningStatus: defaultStatus, eveningStatus: defaultStatus, overtimeHours: 0, metersProduced: 0 };
        const updatedRecord = { ...currentRecord, ...newValues };

        setLocalAttendance(prevMap => {
            const newMap = new Map(prevMap);
            newMap.set(key, updatedRecord);
            return newMap;
        });
        setHasChanges(true);
    }, [year, month, localAttendance]);
    
    const handleSave = async () => {
        setSaveState('saving');
        // FIX: The `onSave` function expects a parameter of type `Omit<AttendanceRecord, "id">[]`,
        // which includes `createdAt` and `updatedAt` properties. The original implementation was creating
        // objects that were missing these properties, causing a type mismatch.
        const recordsToSave: Omit<AttendanceRecord, 'id'>[] = [];
        localAttendance.forEach((value, key) => {
            const [employee_id, date] = key.split('|');
            recordsToSave.push({
                employee_id,
                date,
                morningStatus: value.morningStatus,
                eveningStatus: value.eveningStatus,
                morningOvertimeHours: 0,
                eveningOvertimeHours: value.overtimeHours,
                metersProduced: value.metersProduced,
                createdAt: value.createdAt || '', // Add dummy/existing values to satisfy the type
                updatedAt: value.updatedAt || '',
            });
        });
        try {
            await onSave(recordsToSave);
            setSaveState('saved');
            setHasChanges(false); 
            setEditingDate(null);
            setTimeout(() => setSaveState('idle'), 2000);
        } catch (error) {
            console.error("Failed to save attendance:", error);
            setSaveState('idle');
            const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred. Check the console for details.";
            alert(`Failed to save attendance records. ${errorMessage}`);
        }
    };

    const sortedEmployees = useMemo(() => [...employees].sort((a,b) => a.name.localeCompare(b.name)), [employees]);
    const attendanceStatuses: AttendanceStatus[] = ['Present', 'Absent', 'Leave', 'Holiday'];

    return (
        <div className="bg-white rounded-lg shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between p-5 border-b border-gray-200 gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-gray-100" aria-label="Previous month"><ChevronLeftIcon/></button>
                    <div className="relative">
                        <button
                            onClick={() => setIsMonthPickerOpen(p => !p)}
                            className="text-xl font-semibold text-gray-800 text-center w-48 hover:bg-gray-100 rounded-md py-1 px-2 transition-colors"
                            aria-haspopup="true"
                            aria-expanded={isMonthPickerOpen}
                        >
                            {monthName} {year}
                        </button>
                        {isMonthPickerOpen && (
                            <MonthYearPicker
                                currentDate={currentDate}
                                onSelect={newDate => {
                                    navigateToDate(newDate);
                                    setIsMonthPickerOpen(false);
                                }}
                                onClose={() => setIsMonthPickerOpen(false)}
                                isMonthInFuture={isMonthInFuture}
                            />
                        )}
                    </div>
                    <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed" disabled={isCurrentOrFutureMonth} aria-label="Next month"><ChevronRightIcon/></button>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={!hasChanges || saveState !== 'idle'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center w-36 transition-colors"
                >
                    {saveState === 'saving' && <><SpinnerIcon className="w-5 h-5 mr-2" /> Saving...</>}
                    {saveState === 'saved' && <><CheckIcon className="w-5 h-5 mr-2" /> Saved!</>}
                    {saveState === 'idle' && 'Save Changes'}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 border-collapse">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-2 py-3 border whitespace-nowrap sticky left-0 bg-gray-50 z-20">Sl#</th>
                            <th className="px-2 py-3 border whitespace-nowrap min-w-[150px] sticky left-[53px] bg-gray-50 z-20">Employee Name</th>
                            {dayHeaders.map(({ day, name }) => {
                                const dateForHeader = new Date(year, month, day);
                                dateForHeader.setHours(0,0,0,0);
                                const dateStringForHeader = toYMDString(dateForHeader);
                                const isEditingThisDate = editingDate === dateStringForHeader;
                                const isFutureDateHeader = dateForHeader > today;
                                const isSundayHeader = dateForHeader.getDay() === 0;

                                const headerContainerClass = isSundayHeader ? 'bg-red-50' : isEditingThisDate ? 'bg-blue-50' : '';
                                const headerDayNameClass = isSundayHeader ? 'text-red-500' : 'text-gray-400';
                                
                                return (
                                    <th key={day} className={`p-1 border text-center min-w-[320px] ${headerContainerClass}`}>
                                        <div className="flex items-center justify-center">
                                            <div className="flex flex-col items-center">
                                                <div className={`${headerDayNameClass} text-[10px]`}>{name}</div>
                                                <div className="font-semibold text-sm">{day}</div>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (isFutureDateHeader) return;
                                                    setEditingDate(isEditingThisDate ? null : dateStringForHeader);
                                                }}
                                                className={`ml-2 p-1 rounded-full ${isFutureDateHeader ? 'text-gray-300 cursor-not-allowed' : isEditingThisDate ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}
                                                title={isFutureDateHeader ? 'Cannot edit future dates' : isEditingThisDate ? 'Lock this date' : 'Edit this date'}
                                                disabled={isFutureDateHeader}
                                            >
                                                <EditIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </th>
                                );
                            })}
                            <th className="px-2 py-3 border bg-blue-50 text-blue-800 text-center">P</th>
                            <th className="px-2 py-3 border bg-blue-50 text-blue-800 text-center">A</th>
                            <th className="px-2 py-3 border bg-blue-50 text-blue-800 text-center">L</th>
                            <th className="px-2 py-3 border bg-blue-50 text-blue-800 text-center">OT</th>
                            <th className="px-2 py-3 border bg-blue-50 text-blue-800 text-center">Meters</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedEmployees.map((emp, index) => {
                            const summary = { P: 0, A: 0, L: 0, OT: 0 };
                            let totalMeters = 0;
                            
                            Array.from({ length: daysInMonth }).forEach((_, i) => {
                                const day = i + 1;
                                const date = new Date(year, month, day);
                                date.setHours(0,0,0,0);
                                const dateString = toYMDString(date);
                                const key = `${emp.id}|${dateString}`;
                                const record = localAttendance.get(key);
                                
                                if (date <= today && record) {
                                    const { morningStatus, eveningStatus } = record;
                                    const processStatus = (status: AttendanceStatus) => {
                                        switch (status) { case 'Present': case 'Holiday': summary.P += 0.5; break; case 'Absent': summary.A += 0.5; break; case 'Leave': summary.L += 0.5; break; }
                                    };
                                    processStatus(morningStatus);
                                    processStatus(eveningStatus);
                                    summary.OT += record.overtimeHours || 0;
                                    totalMeters += record.metersProduced || 0;
                                }
                            });

                            return (
                                <tr key={emp.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-2 py-2 border text-center sticky left-0 bg-white">{index + 1}</td>
                                    <td className="px-2 py-2 border font-medium text-gray-900 whitespace-nowrap min-w-[150px] sticky left-[53px] bg-white">{emp.name}</td>
                                    {Array.from({ length: daysInMonth }).map((_, i) => {
                                        const day = i + 1;
                                        const date = new Date(year, month, day);
                                        date.setHours(0,0,0,0);
                                        const dateString = toYMDString(date);
                                        const key = `${emp.id}|${dateString}`;
                                        const record = localAttendance.get(key);
                                        const isFutureDate = date > today;
                                        const isLocked = isFutureDate || editingDate !== dateString;
                                        const isEditingThisDate = editingDate === dateString;
                                        const isSunday = date.getDay() === 0;
                                        const defaultStatus = isSunday ? 'Holiday' : 'Present';

                                        const cellClasses = ['p-1', 'border', 'text-center'];
                                        if (isFutureDate) cellClasses.push('bg-gray-100');
                                        if (isEditingThisDate) cellClasses.push('bg-blue-50');

                                        return (
                                            <td key={day} className={cellClasses.join(' ')}>
                                                <div className="flex gap-1 items-center justify-center">
                                                    <select
                                                        title="Morning Shift"
                                                        value={record?.morningStatus || defaultStatus}
                                                        onChange={(e) => handleAttendanceChange(emp.id, day, { morningStatus: e.target.value as AttendanceStatus })}
                                                        className={getStatusSelectClasses(record?.morningStatus || defaultStatus)}
                                                        disabled={isLocked}
                                                    >
                                                        {attendanceStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                    <select
                                                        title="Evening Shift"
                                                        value={record?.eveningStatus || defaultStatus}
                                                        onChange={(e) => handleAttendanceChange(emp.id, day, { eveningStatus: e.target.value as AttendanceStatus })}
                                                        className={getStatusSelectClasses(record?.eveningStatus || defaultStatus)}
                                                        disabled={isLocked}
                                                    >
                                                        {attendanceStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        title="Overtime Hours"
                                                        value={record?.overtimeHours || ''}
                                                        onChange={(e) => handleAttendanceChange(emp.id, day, { overtimeHours: Number(e.target.value) || 0 })}
                                                        className="w-12 p-1 text-xs border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                                        placeholder="OT"
                                                        disabled={isLocked}
                                                    />
                                                    <input
                                                        type="number"
                                                        title="Meters Produced"
                                                        value={record?.metersProduced || ''}
                                                        onChange={(e) => handleAttendanceChange(emp.id, day, { metersProduced: Number(e.target.value) || 0 })}
                                                        className="w-16 p-1 text-xs border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                                        placeholder="Meters"
                                                        disabled={isLocked}
                                                    />
                                                </div>
                                                {record && wasEdited(record.createdAt, record.updatedAt) && (
                                                    <div className="text-[10px] text-gray-400 mt-1 text-center" title={`Edited at ${formatTime(record.updatedAt)}`}>
                                                        Last edit on {formatDateForTimestamp(record.updatedAt)}
                                                    </div>
                                                )}
                                            </td>
                                        )
                                    })}
                                    <td className="px-2 py-2 border text-center font-semibold bg-gray-50">{summary.P}</td>
                                    <td className="px-2 py-2 border text-center font-semibold bg-gray-50">{summary.A}</td>
                                    <td className="px-2 py-2 border text-center font-semibold bg-gray-50">{summary.L}</td>
                                    <td className="px-2 py-2 border text-center font-semibold bg-gray-50">{summary.OT}</td>
                                    <td className="px-2 py-2 border text-center font-semibold bg-gray-50">{totalMeters}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {employees.length === 0 && (
                    <div className="text-center p-8 text-gray-500">
                        No employees found. Please add employees in the Employee Master screen first.
                    </div>
                 )}
            </div>
        </div>
    );
};

export default AttendanceScreen;
