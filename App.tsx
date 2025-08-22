import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProductsScreen from './components/NewItemForm';

const ScreenPlaceholder: React.FC<{title: string; description: string}> = ({title, description}) => (
    <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-600 mt-2">{description}</p>
    </div>
);

const screenComponents: { [key: string]: React.FC } = {
    'Dashboard': () => <ScreenPlaceholder title="Dashboard" description="Welcome to your Textile ERP Dashboard. Key metrics will be displayed here." />,
    'Vendors': () => <ScreenPlaceholder title="Vendors" description="Manage vendor profiles, contact information, and product catalogs." />,
    'Products': ProductsScreen,
    'Purchase Orders': () => <ScreenPlaceholder title="Purchase Orders" description="Create and manage purchase orders, track their status, and handle invoicing." />,
    'Delivery Challans': () => <ScreenPlaceholder title="Delivery Challans" description="Generate and track delivery challans for product movements." />,
    'Data Entry': () => <ScreenPlaceholder title="Data Entry" description="Perform various data entry tasks, including creating new challans and records." />,
    'Salary & Payslips': () => <ScreenPlaceholder title="Salary & Payslips" description="Calculate monthly salaries, manage payments, and generate employee payslips." />,
    'Attendance': () => <ScreenPlaceholder title="Attendance" description="Record and manage daily employee attendance." />,
    'Expenses': () => <ScreenPlaceholder title="Expenses" description="Track and manage all business-related expenses." />,
    'Reports': () => <ScreenPlaceholder title="Reports" description="Generate and export detailed reports for all modules." />,
};


const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState('Products');
  
  const ActiveScreenComponent = screenComponents[activeScreen] || screenComponents['Dashboard'];

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900">
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      <div className="flex-1 flex flex-col h-screen">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          <ActiveScreenComponent />
        </main>
      </div>
    </div>
  );
};

export default App;