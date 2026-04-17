// CRITICAL: mapbox-gl CSS must be imported BEFORE any app styles
import 'mapbox-gl/dist/mapbox-gl.css';
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
