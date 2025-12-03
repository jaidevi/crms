
import React, { useState, useEffect, useMemo } from 'react';
import { CloseIcon, CalendarIcon } from './Icons';
import type { DeliveryChallan, ProcessType, Invoice, InvoiceItem, InvoiceNumberConfig } from '../types';
import DatePicker from './DatePicker';

interface InvoiceFormProps {
    onClose: () => void;
    onSave: (invoice: Omit<Invoice, 'id'>) => void;
    clientName: string;
    challansToInvoice: DeliveryChallan[];
    invoiceNumberConfig: InvoiceNumberConfig;
    processTypes: ProcessType[];
}

const formatDateForInput = (isoDate: string) => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
};

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onClose, onSave, clientName, challansToInvoice, invoiceNumberConfig, processTypes }) => {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().