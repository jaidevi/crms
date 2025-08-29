
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProductsScreen from './components/NewItemForm';
import PurchaseOrderScreen from './components/PurchaseOrderScreen';

// Define types for the new structure
export interface LineItem {
  id: string; // For React keys
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type PaymentMode = 'Cash' | 'Cheque' | 'NEFT' | 'GPay' | 'Credit Card' | 'Bank Transfer' | 'Other';
export type OrderStatus = 'Paid' | 'Unpaid';

export interface PurchaseOrder {
  poNumber: string;
  poDate: string;
  shopName: string;
  items: LineItem[];
  totalAmount: number;
  gstNo: string;
  paymentMode: PaymentMode;
  status: OrderStatus;
  bankName?: string;
  chequeDate?: string;
}

// Sample data for initial state
const initialShopNames: string[] = ['Global Pharma Inc.', 'Fine Fabrics Ltd.', 'Weavers United', 'Global Textiles Inc.', 'Fabric Depot'];
const initialBankNames: string[] = ['HDFC Bank', 'ICICI Bank', 'State Bank of India'];

const initialPurchaseOrders: PurchaseOrder[] = [
  {
    poNumber: 'PO-1682899200',
    poDate: '2025-08-29',
    shopName: 'Global Pharma Inc.',
    items: [
      { id: '1', name: 'Master Item A', description: 'High-quality cotton blend', quantity: 2, rate: 150.00, amount: 300.00 },
      { id: '2', name: 'Master Item B', description: 'Pure silk, 50m roll', quantity: 5, rate: 75.50, amount: 377.50 },
    ],
    totalAmount: 677.50,
    gstNo: '27ABCDE1234F1Z5',
    paymentMode: 'Credit Card',
    status: 'Paid',
  },
  {
    poNumber: 'PO-1672531200',
    poDate: '2025-07-15',
    shopName: 'Fine Fabrics Ltd.',
    items: [
      { id: '1', name: 'Linen Fabric, 200m', description: 'Beige, 54 inch width', quantity: 200, rate: 12.00, amount: 2400.00 },
    ],
    totalAmount: 2400.00,
    gstNo: '29FABCD5678G1Z6',
    paymentMode: 'Bank Transfer',
    status: 'Unpaid',
  },
];


const ScreenPlaceholder: React.FC<{title: string; description: string}> = ({title, description}) => (
    <div className="bg-white rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-600 mt-2">{description}</p>
    </div>
);

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState('Purchase Orders');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [shopNames, setShopNames] = useState<string[]>(initialShopNames);
  const [bankNames, setBankNames] = useState<string[]>(initialBankNames);

  const addPurchaseOrder = (newOrder: PurchaseOrder) => {
    setPurchaseOrders(prevOrders => [newOrder, ...prevOrders]);
  };

  const addShopName = (newShop: string) => {
    if (!shopNames.includes(newShop)) {
        setShopNames(prev => [...prev, newShop].sort());
    }
  };

  const addBankName = (newBank: string) => {
    if (!bankNames.includes(newBank)) {
        setBankNames(prev => [...prev, newBank].sort());
    }
  };
  
  const screenComponents: { [key: string]: React.FC } = {
    'Dashboard': () => <ScreenPlaceholder title="Dashboard" description="Welcome to your Textile ERP Dashboard. Key metrics will be displayed here." />,
    'Vendors': () => <ScreenPlaceholder title="Vendors" description="Manage vendor profiles, contact information, and product catalogs." />,
    'Products': () => <ProductsScreen shopNames={shopNames} onAddShopName={addShopName} />,
    'Purchase Orders': () => <PurchaseOrderScreen purchaseOrders={purchaseOrders} onAddOrder={addPurchaseOrder} shopNames={shopNames} onAddShopName={addShopName} bankNames={bankNames} onAddBankName={addBankName} />,
    'Delivery Challans': () => <ScreenPlaceholder title="Delivery Challans" description="Generate and track delivery challans for product movements." />,
    'Data Entry': () => <ScreenPlaceholder title="Data Entry" description="Perform various data entry tasks, including creating new challans and records." />,
    'Salary & Payslips': () => <ScreenPlaceholder title="Salary & Payslips" description="Calculate monthly salaries, manage payments, and generate employee payslips." />,
    'Attendance': () => <ScreenPlaceholder title="Attendance" description="Record and manage daily employee attendance." />,
    'Expenses': () => <ScreenPlaceholder title="Expenses" description="Track and manage all business-related expenses." />,
    'Reports': () => <ScreenPlaceholder title="Reports" description="Generate and export detailed reports for all modules." />,
  };
  
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
