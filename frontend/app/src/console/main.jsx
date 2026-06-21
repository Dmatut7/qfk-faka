import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../design-system/styles.css';
import ConsoleApp from './ConsoleApp.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConsoleApp />
  </React.StrictMode>
);
