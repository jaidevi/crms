import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProductsScreen from './components/NewItemForm';
import PurchaseOrderScreen from './components/PurchaseOrderScreen';

// Define a type for a single purchase order
export interface PurchaseOrder {
  poNumber: string;
  orderDate: string;
  shopName: string;
  gstNo: string;
  itemDescription: string;
  quantity: number;
  gstPercentage: number | null;
  paymentMode: string;
  status: 'Pending' | 'Approved' | 'Shipped' | 'Delivered' | 'Cancelled';
  bankName?: string;
  chequeDate?: string;
}

// Sample data for initial state
const initialPurchaseOrders: PurchaseOrder[] = [
  {
    poNumber: 'PO-1682899200',
    orderDate: '2023-05-01',
    shopName: 'Fine Fabrics Ltd.',
    gstNo: '33AAAAA0000A1Z5',
    itemDescription: 'Linen Fabric, 200m',
    quantity: 200,
    gstPercentage: 12,
    paymentMode: 'Cheque',
    status: 'Pending',
    bankName: 'City Bank',
    chequeDate: '2023-05-05',
  },
  {
    poNumber: 'PO-1672531200',
    orderDate: '2023-01-01',
    shopName: 'Global Textiles Inc.',
    gstNo: '29ABCDE1234F1Z5',
    itemDescription: '100% Cotton Yarn, 500kg',
    quantity: 500,
    gstPercentage: 5,
    paymentMode: 'NEFT',
    status: 'Delivered',
  },
  {
    poNumber: 'PO-1675209600',
    orderDate: '2023-02-01',
    shopName: 'Fabric Depot',
    gstNo: '27FGHIJ5678K1Z4',
    itemDescription: 'Polyester Fabric, 1000m',
    quantity: 1000,
    gstPercentage: 12,
    paymentMode: 'GPay',
    status: 'Shipped',
  },
  {
    poNumber: 'PO-1677628800',
    orderDate: '2023-03-01',
    shopName: 'Weavers United',
    gstNo: '36LMNOP9012Q1Z3',
    itemDescription: 'Silk Thread, 50 spools',
    quantity: 50,
    gstPercentage: 5,
    paymentMode: 'Cash',
    status: 'Approved',
  },
   {
    poNumber: 'PO-1680307200',
    orderDate: '2023-04-01',
    shopName: 'The Yarn Barn',
    gstNo: '24RSTUV3456W1Z2',
    itemDescription: 'Wool Roving, 100kg',
    quantity: 100,
    gstPercentage: 12,
    paymentMode: 'GPay',
    status: 'Pending',
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
  const [banks, setBanks] = useState<string[]>(['City Bank', 'State Bank of India', 'HDFC Bank', 'ICICI Bank']);

  const addPurchaseOrder = (newOrder: PurchaseOrder) => {
    setPurchaseOrders(prevOrders => [newOrder, ...prevOrders]);
  };
  
  const addBank = (newBank: string) => {
    if (newBank && !banks.includes(newBank)) {
        setBanks(prevBanks => [...prevBanks, newBank].sort());
    }
  };

  const screenComponents: { [key: string]: React.FC } = {
    'Dashboard': () => <ScreenPlaceholder title="Dashboard" description="Welcome to your Textile ERP Dashboard. Key metrics will be displayed here." />,
    'Vendors': () => <ScreenPlaceholder title="Vendors" description="Manage vendor profiles, contact information, and product catalogs." />,
    'Products': ProductsScreen,
    'Purchase Orders': () => <PurchaseOrderScreen purchaseOrders={purchaseOrders} onAddOrder={addPurchaseOrder} banks={banks} onAddBank={addBank} />,
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