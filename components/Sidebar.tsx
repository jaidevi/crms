import React, { useState } from 'react';
import {
  InvoiceIcon, HomeIcon, CustomersIcon, ItemsIcon, QuotesIcon,
  DeliveryIcon, InvoicesIcon, PaymentsIcon, CreditNotesIcon, ExpensesIcon,
  ReportsIcon, ChevronRightIcon, ChevronLeftIcon
} from './Icons';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, onClick }) => {
  const baseClasses = "flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm text-left";
  const activeClasses = "bg-blue-600 text-white";
  const inactiveClasses = "text-gray-300 hover:bg-slate-700";

  return (
    <button onClick={onClick} className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
      <div className="flex items-center">
        <span className="w-5 h-5 mr-3">{icon}</span>
        <span>{label}</span>
      </div>
    </button>
  );
};

interface SidebarProps {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeScreen, setActiveScreen }) => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { icon: <HomeIcon />, label: "Dashboard" },
    { icon: <CustomersIcon />, label: "Vendors" },
    { icon: <ItemsIcon />, label: "Products" },
    { icon: <QuotesIcon />, label: "Purchase Orders" },
    { icon: <DeliveryIcon />, label: "Delivery Challans" },
    { icon: <InvoicesIcon />, label: "Data Entry" },
    { icon: <PaymentsIcon />, label: "Salary & Payslips" },
    { icon: <CreditNotesIcon />, label: "Attendance" },
    { icon: <ExpensesIcon />, label: "Expenses" },
    { icon: <ReportsIcon />, label: "Reports" },
  ];

  return (
    <aside className={`bg-slate-800 text-white flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between h-16 border-b border-slate-700 px-4">
        <div className="flex items-center">
          <InvoiceIcon className="w-8 h-8 mr-2 text-blue-400" />
          {!collapsed && <span className="font-bold text-lg">TextileERP</span>}
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map(item => (
           collapsed ? (
            <button key={item.label} title={item.label} onClick={() => setActiveScreen(item.label)} className={`flex items-center justify-center w-full h-11 rounded-lg ${item.label === activeScreen ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-700'}`}>
               <span className="w-5 h-5">{item.icon}</span>
            </button>
           ) : (
            <NavItem 
              key={item.label} 
              icon={item.icon} 
              label={item.label} 
              active={item.label === activeScreen}
              onClick={() => setActiveScreen(item.label)}
            />
           )
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700">
        <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-full hover:bg-slate-700">
          {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;