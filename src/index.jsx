import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { App } from './App';

const isSdkNoise = (msg) => typeof msg === 'string' && msg.includes('applicationId');

window.addEventListener('error', (event) => {
  const msg = event.message || (event.error && event.error.message) || '';
  if (isSdkNoise(msg)) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
}, true);

window.onerror = (message) => {
  if (isSdkNoise(message)) return true;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
