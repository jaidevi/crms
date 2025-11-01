import React, { useState } from 'react';
import {
  InvoiceIcon, HomeIcon, CustomersIcon, ItemsIcon, QuotesIcon,
  DeliveryIcon, InvoicesIcon, PaymentsIcon, CreditNotesIcon, ExpensesIcon,
  ReportsIcon, ChevronRightIcon, ChevronLeftIcon, SettingsIcon,
  DatabaseIcon, ChevronUpIcon, ChevronDownIcon, PlusIcon, EditIcon, WalletIcon,
  SearchIcon
} from './Icons';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  isSubItem?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, onClick, isSubItem = false }) => {
  const baseClasses = "flex items-center w-full px-4 py-2.5 rounded-lg text-sm text-left transition-colors duration-200";
  const activeClasses = "bg-blue-600 text-white";
  const inactiveClasses = "text-gray-300 hover:bg-gray-800";
  const subItemClasses = isSubItem ? "pl-12" : "";

  return (
    <button onClick={onClick} className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${subItemClasses}`}>
      <span className="w-5 h-5 mr-3">{icon}</span>
      <span>{label}</span>
    </button>
  );
};


interface SidebarProps {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeScreen, setActiveScreen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mastersOpen, setMastersOpen] = useState(true);
  const [transactionsOpen, setTransactionsOpen] = useState(true);
  const [masterSearch, setMasterSearch] = useState('');

  const masterScreens = ['Add Client', 'Add Purchase Shop', 'Add Employee', 'Add Process'];
  const transactionScreens = ['Expenses', 'Delivery Challans', 'Invoices', 'Payment Received', 'Salary & Payslips', 'Attendance'];
  
  const isMastersActive = masterScreens.includes(activeScreen);
  const isTransactionsActive = transactionScreens.includes(activeScreen);

  const handleNavClick = (screen: string) => {
    setActiveScreen(screen);
  };
  
  const transactionNavItems = [
    { icon: <ExpensesIcon />, label: "Expenses" },
    { icon: <DeliveryIcon />, label: "Delivery Challans" },
    { icon: <InvoiceIcon />, label: "Invoices" },
    { icon: <PaymentsIcon />, label: "Payment Received" },
    { icon: <CreditNotesIcon />, label: "Attendance" },
    { icon: <WalletIcon />, label: "Salary & Payslips" },
  ];
  
  const masterNavItems = [
      { icon: <CustomersIcon />, label: "Add Client" },
      { icon: <CustomersIcon />, label: "Add Purchase Shop" },
      { icon: <CustomersIcon />, label: "Add Employee" },
      { icon: <InvoicesIcon />, label: "Add Process" },
  ];
  
  const filteredMasterNavItems = masterNavItems.filter(item => 
    item.label.toLowerCase().includes(masterSearch.toLowerCase())
  );

  const mainNavItems = [
    { icon: <PlusIcon />, label: "New Screen" },
    { icon: <ReportsIcon />, label: "Reports" },
    { icon: <CustomersIcon />, label: "User Admin" },
  ];

  return (
    <aside className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between h-16 border-b border-gray-800 px-4">
        <div className="flex items-center">
          <InvoiceIcon className="w-8 h-8 mr-2 text-blue-400" />
          {!collapsed && <span className="font-bold text-lg">TextileERP</span>}
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {collapsed ? (
            <>
                {[
                    { icon: <HomeIcon />, label: "Dashboard" },
                    ...transactionNavItems,
                    ...masterNavItems,
                    ...mainNavItems
                ].map(item => (
                    <button key={item.label} title={item.label} onClick={() => setActiveScreen(item.label)} className={`flex items-center justify-center w-full h-11 rounded-lg ${item.label === activeScreen ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                       <span className="w-5 h-5">{item.icon}</span>
                    </button>
                ))}
            </>
        ) : (
            <>
                <NavItem icon={<HomeIcon />} label="Dashboard" active={activeScreen === 'Dashboard'} onClick={() => handleNavClick('Dashboard')} />
                
                {/* Transactions Dropdown */}
                <div>
                  <button
                    onClick={() => setTransactionsOpen(!transactionsOpen)}
                    className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm text-left transition-colors duration-200 ${isTransactionsActive ? 'text-white bg-gray-800/50' : 'text-gray-300'} hover:bg-gray-800`}
                  >
                    <div className="flex items-center">
                      <span className="w-5 h-5 mr-3"><DatabaseIcon /></span>
                      <span>Transactions</span>
                    </div>
                    {transactionsOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                  </button>
                  {transactionsOpen && (
                    <div className="pt-2 space-y-2">
                      {transactionNavItems.map(item => (
                        <NavItem key={item.label} icon={item.icon} label={item.label} active={activeScreen === item.label} onClick={() => handleNavClick(item.label)} isSubItem />
                      ))}
                    </div>
                  )}
                </div>

                {/* Masters Dropdown */}
                <div>
                  <button
                    onClick={() => setMastersOpen(!mastersOpen)}
                    className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm text-left transition-colors duration-200 ${isMastersActive ? 'text-white bg-gray-800/50' : 'text-gray-300'} hover:bg-gray-800`}
                  >
                    <div className="flex items-center">
                      <span className="w-5 h-5 mr-3"><DatabaseIcon /></span>
                      <span>Masters</span>
                    </div>
                    {mastersOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                  </button>
                  {mastersOpen && (
                    <div className="pt-2 space-y-2">
                      <div className="px-4 pb-2">
                        <div className="relative">
                           <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon className="w-4 h-4 text-gray-400" />
                          </span>
                          <input
                            type="text"
                            placeholder="Search masters..."
                            value={masterSearch}
                            onChange={(e) => setMasterSearch(e.target.value)}
                            className="w-full bg-gray-800 text-white text-sm rounded-md pl-9 pr-3 py-1.5 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                          />
                        </div>
                      </div>
                      {filteredMasterNavItems.map(item => (
                        <NavItem key={item.label} icon={item.icon} label={item.label} active={activeScreen === item.label} onClick={() => handleNavClick(item.label)} isSubItem />
                      ))}
                    </div>
                  )}
                </div>
                
                {mainNavItems.map(item => (
                    <NavItem 
                      key={item.label} 
                      icon={item.icon} 
                      label={item.label} 
                      active={item.label === activeScreen}
                      onClick={() => handleNavClick(item.label)}
                    />
                ))}
            </>
        )}
      </nav>

      <div>
        <div className="px-4 py-2">
           {collapsed ? (
                <button title="Settings" onClick={() => handleNavClick('Settings')} className={`flex items-center justify-center w-full h-11 rounded-lg ${activeScreen === 'Settings' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                    <span className="w-5 h-5"><SettingsIcon/></span>
                </button>
           ) : (
                <NavItem 
                    icon={<SettingsIcon />} 
                    label="Settings" 
                    active={activeScreen === 'Settings'}
                    onClick={() => handleNavClick('Settings')}
                />
           )}
        </div>
        <div className="px-4 py-4 border-t border-gray-800">
          <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-full hover:bg-gray-800">
            {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;