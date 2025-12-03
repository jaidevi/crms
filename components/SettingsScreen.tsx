
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
  invConfig: InvoiceNumberConfig;
  onUpdateInvConfig: (newConfig: InvoiceNumberConfig) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ poConfig, onUpdatePoConfig, dcConfig, onUpdateDcConfig, invConfig, onUpdateInvConfig }) => {
  return (
    <div className="space-y-8">
      <PONumberSettingsScreen config={poConfig} onUpdateConfig={onUpdatePoConfig} />
      <DeliveryChallanNumberSettingsScreen config={dcConfig} onUpdateConfig={onUpdateDcConfig} />
      <InvoiceNumberSettingsScreen config={invConfig} onUpdateConfig={onUpdateInvConfig} />
    </div>
  );
};

export default SettingsScreen;
