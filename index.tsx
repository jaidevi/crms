import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Changed named import to default import to match standard component export pattern
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);