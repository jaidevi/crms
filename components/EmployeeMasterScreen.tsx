import React, { useState, useMemo } from 'react';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon } from './Icons';
import type { Employee } from '../App';
import EmployeeModal from './EmployeeModal';
import ConfirmationModal from './ConfirmationModal';

interface EmployeeMasterScreenProps {
  employees: Employee[];
  onAddEmployee: (employee: Omit<Employee, 'id'>) => void;
  onUpdateEmployee: (id: string, employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

const EmployeeMasterScreen: React.FC<EmployeeMasterScreenProps> = ({ employees, onAddEmployee, onUpdateEmployee, onDeleteEmployee }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = useMemo(() => {
    const sorted = [...employees].sort((a, b) => a.name.localeCompare(b.name));

    if (!searchTerm) {
        return sorted;
    }

    const lowercasedTerm = searchTerm.toLowerCase();
    return sorted.filter(emp =>
        emp.name.toLowerCase().includes(lowercasedTerm) ||
        emp.designation.toLowerCase().includes(lowercasedTerm) ||
        emp.phone.toLowerCase().includes(lowercasedTerm)
    );
  }, [employees, searchTerm]);


  const handleOpenModalForNew = () => {
    setEmployeeToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenModalForEdit = (employee: Employee) => {
    setEmployeeToEdit(employee);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEmployeeToEdit(null);
  };
  
  const handleSaveEmployee = (employeeData: Omit<Employee, 'id'>) => {
    if (employeeToEdit) {
      onUpdateEmployee(employeeToEdit.id, { ...employeeData, id: employeeToEdit.id });
    } else {
      onAddEmployee(employeeData);
    }
    handleCloseModal();
  };
  
  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
  };

  const handleConfirmDelete = () => {
    if (employeeToDelete) {
      onDeleteEmployee(employeeToDelete.id);
      setEmployeeToDelete(null);
    }
  };

  return (
    <>
      {isModalOpen && (
        <EmployeeModal
          onClose={handleCloseModal}
          onSave={handleSaveEmployee}
          existingEmployees={employees}
          employeeToEdit={employeeToEdit}
        />
      )}
       {employeeToDelete && (
        <ConfirmationModal
          isOpen={!!employeeToDelete}
          onClose={() => setEmployeeToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Employee"
          message={
            <>
              Are you sure you want to delete the employee{' '}
              <strong className="font-semibold text-gray-800">{employeeToDelete.name}</strong>? This action cannot be undone.
            </>
          }
        />
      )}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between p-5 border-b border-gray-200 gap-4">
          <h1 className="text-xl font-semibold text-gray-800">Add Employee</h1>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, designation, phone..."
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
              New Employee
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Employee Name</th>
                <th scope="col" className="px-6 py-3">Designation</th>
                <th scope="col" className="px-6 py-3">Phone</th>
                <th scope="col" className="px-6 py-3 text-right">Daily Wage</th>
                <th scope="col" className="px-6 py-3 text-right">Rate per Meter</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="bg-white border-b hover:bg-gray-50">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {employee.name}
                  </th>
                  <td className="px-6 py-4">{employee.designation || '-'}</td>
                  <td className="px-6 py-4">{employee.phone || '-'}</td>
                  <td className="px-6 py-4 text-right font-medium">₹{employee.dailyWage.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-medium">₹{(employee.ratePerMeter || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                     <div className="flex items-center justify-center gap-4">
                        <button onClick={() => handleOpenModalForEdit(employee)} className="p-1 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50" aria-label="Edit employee">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDeleteClick(employee)} className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50" aria-label="Delete employee">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEmployees.length === 0 && (
            <div className="text-center p-8 text-gray-500">
              {searchTerm 
                ? `No employees found matching "${searchTerm}".` 
                : 'No employees found. Click "New Employee" to add one.'}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployeeMasterScreen;