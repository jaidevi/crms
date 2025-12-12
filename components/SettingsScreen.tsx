
import React from 'react';
import PONumberSettingsScreen from './PONumberSettingsScreen';
import DeliveryChallanNumberSettingsScreen from './DeliveryChallanNumberSettingsScreen';
import InvoiceNumberSettingsScreen from './InvoiceNumberSettingsScreen';
import type { PONumberConfig, DeliveryChallanNumberConfig, InvoiceNumberConfig } from '../types';

interface SettingsScreenProps {
  poConfig: PONumberConfig;
  onUpdatePoConfig: (newConfig: PONumberConfig) => void;
  dcConfig: DeliveryChallanNumberConfig;
  onUpdateDcConfig: (newConfig: DeliveryChallanNumberConfig) => void;
  outsourcingDcConfig: DeliveryChallanNumberConfig;
  onUpdateOutsourcingDcConfig: (newConfig: DeliveryChallanNumberConfig) => void;
  invConfig: InvoiceNumberConfig;
  ngstInvConfig: InvoiceNumberConfig;
  onUpdateInvConfig: (type: 'GST' | 'NGST', newConfig: InvoiceNumberConfig) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ poConfig, onUpdatePoConfig, dcConfig, onUpdateDcConfig, outsourcingDcConfig, onUpdateOutsourcingDcConfig, invConfig, ngstInvConfig, onUpdateInvConfig }) => {
  return (
    <div className="space-y-8">
      <PONumberSettingsScreen config={poConfig} onUpdateConfig={onUpdatePoConfig} />
      <DeliveryChallanNumberSettingsScreen title="Delivery Challan Numbering" config={dcConfig} onUpdateConfig={onUpdateDcConfig} />
      <DeliveryChallanNumberSettingsScreen title="Outsourcing Challan Numbering" config={outsourcingDcConfig} onUpdateConfig={onUpdateOutsourcingDcConfig} />
      <InvoiceNumberSettingsScreen 
        gstConfig={invConfig} 
        ngstConfig={ngstInvConfig} 
        onUpdateConfig={onUpdateInvConfig} 
      />
    </div>
  );
};

export default SettingsScreen;
