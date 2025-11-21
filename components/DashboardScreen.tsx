
import React, { useMemo } from 'react';
import { DollarSignIcon, PackageIcon, ShoppingCartIcon, CustomersIcon, InvoiceIcon, PaymentsIcon } from './Icons';
import type { Invoice, PaymentReceived, DeliveryChallan, PurchaseOrder, OtherExpense, EmployeeAdvance } from '../App';

interface DashboardScreenProps {
    invoices: Invoice[];
    paymentsReceived: PaymentReceived[];
    deliveryChallans: DeliveryChallan[];
    purchaseOrders: PurchaseOrder[];
    otherExpenses: OtherExpense[];
    advances: EmployeeAdvance[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

interface KPICardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color }) => {
    const colorClasses = {
        blue: 'bg-primary-100 text-primary-600',
        green: 'bg-success-100 text-success-600',
        orange: 'bg-accent-100 text-accent-600',
        purple: 'bg-primary-100 text-primary-600',
        red: 'bg-danger-100 text-danger-600',
        yellow: 'bg-warning-100 text-warning-800',
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm flex items-start transform transition-transform hover:scale-105">
            <div className={`p-3 rounded-full mr-4 ${colorClasses[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-secondary-500">{title}</p>
                <p className="text-2xl font-bold text-secondary-800 mt-1">{value}</p>
            </div>
        </div>
    );
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({
    invoices,
    paymentsReceived,
    deliveryChallans,
    purchaseOrders,
    otherExpenses,
    advances
}) => {

    const salesKpis = useMemo(() => {
        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const totalPayments = paymentsReceived.reduce((sum, p) => sum + p.amount, 0);
        const amountDue = totalRevenue - totalPayments;
        return {
            totalRevenue,
            totalPayments,
            amountDue,
            invoiceCount: invoices.length
        };
    }, [invoices, paymentsReceived]);

    const productionKpis = useMemo(() => {
        const invoicedChallanNumbers = new Set(
            invoices.flatMap(invoice => 
                invoice.items.flatMap(item => item.challanNumber.split(',').map(s => s.trim()))
            )
        );
        const readyToInvoice = deliveryChallans.filter(c => (c.status === 'Ready to Invoice' || c.status === 'Delivered') && !invoicedChallanNumbers.has(c.challanNumber));
        const pendingDelivery = deliveryChallans.filter(c => c.status === 'Not Delivered');
        const totalMetersProcessed = deliveryChallans
            .filter(c => c.status === 'Ready to Invoice' || c.status === 'Delivered')
            .reduce((sum, c) => sum + c.mtr, 0);

        return {
            readyToInvoiceCount: readyToInvoice.length,
            pendingDeliveryCount: pendingDelivery.length,
            totalMetersProcessed
        };
    }, [deliveryChallans, invoices]);

    const expenseKpis = useMemo(() => {
        const totalPurchaseValue = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);
        const unpaidPurchases = purchaseOrders.filter(po => po.status === 'Unpaid').length;
        const totalOtherExpenses = otherExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const outstandingAdvances = advances.reduce((sum, adv) => sum + (adv.amount - adv.paidAmount), 0);
        return {
            totalPurchaseValue,
            unpaidPurchases,
            totalOtherExpenses,
            outstandingAdvances
        };
    }, [purchaseOrders, otherExpenses, advances]);


    return (
        <div className="space-y-8 animate-fade-in-down">
            <div>
                <h2 className="text-xl font-semibold text-secondary-700 mb-4">Sales Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Total Revenue" value={formatCurrency(salesKpis.totalRevenue)} icon={<DollarSignIcon className="w-6 h-6" />} color="green" />
                    <KPICard title="Payments Received" value={formatCurrency(salesKpis.totalPayments)} icon={<PaymentsIcon className="w-6 h-6" />} color="blue" />
                    <KPICard title="Amount Due" value={formatCurrency(salesKpis.amountDue)} icon={<DollarSignIcon className="w-6 h-6" />} color="red" />
                    <KPICard title="Total Invoices" value={salesKpis.invoiceCount} icon={<InvoiceIcon className="w-6 h-6" />} color="purple" />
                </div>
            </div>
            
            <div>
                <h2 className="text-xl font-semibold text-secondary-700 mb-4">Production & Operations</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Challans Ready for Invoice" value={productionKpis.readyToInvoiceCount} icon={<PackageIcon className="w-6 h-6" />} color="orange" />
                    <KPICard title="Pending Deliveries" value={productionKpis.pendingDeliveryCount} icon={<PackageIcon className="w-6 h-6" />} color="yellow" />
                    <KPICard title="Total Meters Processed" value={`${productionKpis.totalMetersProcessed.toFixed(2)} m`} icon={<PackageIcon className="w-6 h-6" />} color="blue" />
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold text-secondary-700 mb-4">Expenses & Purchases</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard title="Total Purchase Value" value={formatCurrency(expenseKpis.totalPurchaseValue)} icon={<ShoppingCartIcon className="w-6 h-6" />} color="purple" />
                    <KPICard title="Unpaid Purchases" value={expenseKpis.unpaidPurchases} icon={<ShoppingCartIcon className="w-6 h-6" />} color="red" />
                    <KPICard title="Other Expenses" value={formatCurrency(expenseKpis.totalOtherExpenses)} icon={<DollarSignIcon className="w-6 h-6" />} color="orange" />
                    <KPICard title="Outstanding Employee Advances" value={formatCurrency(expenseKpis.outstandingAdvances)} icon={<CustomersIcon className="w-6 h-6" />} color="yellow" />
                </div>
            </div>
        </div>
    );
};

export default DashboardScreen;
